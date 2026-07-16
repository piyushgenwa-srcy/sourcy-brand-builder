import { GoogleGenAI } from "@google/genai";
import { BAG_DESIGNS, bagImagePath } from "@/lib/pickleball-products";

export const maxDuration = 60;

type ViewType = "logo" | "front" | "back";

// Pre-generated base shots live in /public and are served statically — fetch them
// over HTTP from our own origin rather than via fs, since Vercel serverless
// functions don't reliably have filesystem access to the public/ directory.
async function fetchBaseImage(
  request: Request,
  designId: string,
  colorId: string,
  view: "front" | "back"
): Promise<Buffer> {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const res = await fetch(`${origin}${bagImagePath(designId, colorId, view)}`);
  if (!res.ok) throw new Error(`Base image not found for ${designId}/${colorId}/${view}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const designId = formData.get("designId") as string;
  const colorId = formData.get("colorId") as string;
  const brandName = formData.get("brandName") as string;
  const logoFile = formData.get("logo") as File | null;
  const referenceImage = formData.get("referenceImage") as File | null;
  const viewType = (formData.get("viewType") as ViewType) || "front";

  const design = BAG_DESIGNS.find((d) => d.id === designId);
  if (!design) {
    return Response.json({ error: "Invalid bag design" }, { status: 400 });
  }
  const color = design.colors.find((c) => c.id === colorId);
  if (!color) {
    return Response.json({ error: "Invalid colorway" }, { status: 400 });
  }

  // The back view is never branded — it's a pre-generated static asset, no AI call needed.
  if (viewType === "back") {
    return Response.json({ imageUrl: bagImagePath(designId, colorId, "back") });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    if (viewType === "logo" && referenceImage) {
      return await generateLogoCloseUp(ai, design, referenceImage);
    }

    const base = await fetchBaseImage(request, designId, colorId, "front");
    return await generateBrandedFront(ai, design, base, brandName, logoFile);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    console.error("Generation error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

// Macro close-up of the logo/branding area, derived from the already-branded
// front image so it matches exactly (same logo, same lighting, same bag color).
async function generateLogoCloseUp(
  ai: GoogleGenAI,
  design: (typeof BAG_DESIGNS)[number],
  referenceImage: File
) {
  const refBytes = await referenceImage.arrayBuffer();
  const refBase64 = Buffer.from(refBytes).toString("base64");

  const instruction = `This is a product photograph of a pickleball/padel bag. Generate an extreme close-up macro photo zoomed tightly into the logo and branding area only, at ${design.logoPlacement}. Reproduce the EXACT same logo design, colors, typography, and style shown in the reference image — do not alter or reinterpret the logo. Show fine surface detail (embroidery stitching or printed texture). Maintain consistent lighting, bag color, and material. Professional macro product photography.`;

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [
    { text: instruction },
    { inlineData: { mimeType: referenceImage.type, data: refBase64 } },
  ];

  return await callGeminiImage(ai, parts);
}

// Composites the user's logo/brand name onto the pre-generated, unbranded base
// shot — the base image anchors the bag/color/background/lighting exactly as
// shown in the design picker, and Gemini only adds the branding on top.
async function generateBrandedFront(
  ai: GoogleGenAI,
  design: (typeof BAG_DESIGNS)[number],
  baseImage: Buffer,
  brandName: string,
  logoFile: File | null
) {
  const parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  if (logoFile) {
    const logoBytes = await logoFile.arrayBuffer();
    const logoBase64 = Buffer.from(logoBytes).toString("base64");
    const brandDesc = brandName ? `the brand "${brandName}"` : "the provided brand";

    parts.push({
      text: `This is a product photo of a ${design.name}. Add ${brandDesc} logo onto the bag naturally at ${design.logoPlacement}, as if it were embroidered or printed there. Do not change anything else about the image — keep the exact same bag shape, color, material, background, lighting, camera angle, and composition as shown. Only add the logo, nothing else. Photorealistic, production-ready quality.`,
    });
    parts.push({ inlineData: { mimeType: "image/png", data: baseImage.toString("base64") } });
    parts.push({ text: "Here is the brand logo to place on the bag:" });
    parts.push({ inlineData: { mimeType: logoFile.type, data: logoBase64 } });
  } else {
    const brandLine = brandName
      ? `Add the brand name "${brandName}" onto the bag naturally at ${design.logoPlacement}, small and subtly embroidered/printed, clearly readable.`
      : "Return the bag exactly as shown, unchanged.";
    parts.push({
      text: `This is a product photo of a ${design.name}. ${brandLine} Do not change anything else about the image — keep the exact same bag shape, color, material, background, lighting, camera angle, and composition as shown. Photorealistic, production-ready quality.`,
    });
    parts.push({ inlineData: { mimeType: "image/png", data: baseImage.toString("base64") } });
  }

  return await callGeminiImage(ai, parts);
}

async function callGeminiImage(
  ai: GoogleGenAI,
  parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  >
) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts }],
    config: { responseModalities: ["image", "text"] },
  });

  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    return Response.json({ error: "No image generated" }, { status: 500 });
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      const mimeType = part.inlineData.mimeType || "image/png";
      return Response.json({
        imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
      });
    }
  }

  return Response.json({ error: "No image in response" }, { status: 500 });
}
