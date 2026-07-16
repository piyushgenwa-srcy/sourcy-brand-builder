import { GoogleGenAI } from "@google/genai";
import { BAG_DESIGNS } from "@/lib/pickleball-products";

export const maxDuration = 60;

type ViewType = "logo" | "front" | "back";

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Logo and back views use the front image as a reference for visual consistency
    if (referenceImage && viewType !== "front") {
      return await generateFromReference(ai, design, referenceImage, viewType);
    }

    return await generateFront(ai, design, color, brandName, logoFile);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    console.error("Generation error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

// Used for logo close-up and back view — derives from the already-generated front
// so all 3 images are visually consistent (same bag, same color, same logo, same lighting).
async function generateFromReference(
  ai: GoogleGenAI,
  design: (typeof BAG_DESIGNS)[number],
  referenceImage: File,
  viewType: "logo" | "back"
) {
  const refBytes = await referenceImage.arrayBuffer();
  const refBase64 = Buffer.from(refBytes).toString("base64");

  let instruction: string;
  if (viewType === "logo") {
    instruction = `This is a product photograph of a pickleball/padel bag. Generate an extreme close-up macro photo zoomed tightly into the logo and branding area only, at ${design.logoPlacement}. Reproduce the EXACT same logo design, colors, typography, and style shown in the reference image — do not alter or reinterpret the logo. Show fine surface detail (embroidery stitching or printed texture). Maintain consistent lighting, bag color, and material. Professional macro product photography.`;
  } else {
    instruction = `This is the FRONT view of a ${design.name}. Generate the BACK view of this exact same bag — same color, same material, same lighting, same clean background, same photography style. ${design.backDescription} Do not add any logos or branding to the back.`;
  }

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [
    { text: instruction },
    { inlineData: { mimeType: referenceImage.type, data: refBase64 } },
  ];

  return await callGeminiImage(ai, parts);
}

async function generateFront(
  ai: GoogleGenAI,
  design: (typeof BAG_DESIGNS)[number],
  color: (typeof BAG_DESIGNS)[number]["colors"][number],
  brandName: string,
  logoFile: File | null
) {
  const parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  const baseDescription = `${design.silhouette}, in ${color.descriptor}`;

  if (logoFile) {
    const logoBytes = await logoFile.arrayBuffer();
    const logoBase64 = Buffer.from(logoBytes).toString("base64");
    const brandDesc = brandName ? `the brand "${brandName}"` : "the provided brand";

    parts.push({
      text: `Generate a photorealistic product mockup of ${baseDescription}. Incorporate ${brandDesc} logo naturally as ${design.logoPlacement}. Make it look like a real branded product photo, production-ready quality, photorealistic and premium. Front three-quarter view, centered composition, clean white/marble background, premium catalog quality, warm natural lighting, high-end commercial photography style.`,
    });
    parts.push({ text: "Here is the brand logo to place on the bag:" });
    parts.push({ inlineData: { mimeType: logoFile.type, data: logoBase64 } });
  } else {
    const brandLine = brandName
      ? ` The brand name "${brandName}" should appear as ${design.logoPlacement}, small and subtly embroidered/printed, clearly readable.`
      : "";
    parts.push({
      text: `Generate a photorealistic product mockup of ${baseDescription}.${brandLine} Front three-quarter view, centered composition, clean white/marble background, premium catalog quality, warm natural lighting, high-end commercial photography style.`,
    });
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
