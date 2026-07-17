import { GoogleGenAI } from "@google/genai";
import { BAG_DESIGNS, referenceImagePath } from "@/lib/pickleball-products";
import { normalizeImageToPng } from "@/lib/normalize-image";
import { cleanGeminiError } from "@/lib/gemini-error";

export const maxDuration = 60;

type ViewType = "logo" | "front" | "back";

// Real supplier photos live in /public and are served statically — fetch them
// over HTTP from our own origin rather than via fs, since Vercel serverless
// functions don't reliably have filesystem access to the public/ directory.
async function fetchReferenceImage(
  request: Request,
  designId: string,
  view: "front" | "back"
): Promise<Buffer> {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const res = await fetch(`${origin}${referenceImagePath(designId, view)}`);
  if (!res.ok) throw new Error(`Reference photo not found for ${designId}/${view}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const designId = formData.get("designId") as string;
  const colorId = formData.get("colorId") as string;
  const materialId = formData.get("materialId") as string;
  const brandName = formData.get("brandName") as string;
  const logoFile = formData.get("logo") as File | null;
  const referenceImage = formData.get("referenceImage") as File | null;
  const viewType = (formData.get("viewType") as ViewType) || "front";

  const design = BAG_DESIGNS.find((d) => d.id === designId);
  if (!design) {
    return Response.json({ error: "Invalid bag design" }, { status: 400 });
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
    // The logo close-up derives purely from the reference image — no color/material needed.
    if (viewType === "logo" && referenceImage) {
      return await generateLogoCloseUp(ai, design, referenceImage);
    }

    const color = design.colors.find((c) => c.id === colorId);
    if (!color) {
      return Response.json({ error: "Invalid colorway" }, { status: 400 });
    }
    const material = design.materials.find((m) => m.id === materialId);
    if (!material) {
      return Response.json({ error: "Invalid material" }, { status: 400 });
    }

    if (viewType === "back" && design.hasBackPhoto) {
      const base = await fetchReferenceImage(request, designId, "back");
      return await generateRestyledView(ai, design, base, color, material, {
        brandName: "",
        logoFile: null,
        isBack: true,
      });
    }

    if (viewType === "back" && !design.hasBackPhoto && referenceImage) {
      return await generateInferredBack(ai, design, referenceImage, color, material);
    }

    const base = await fetchReferenceImage(request, designId, "front");
    return await generateRestyledView(ai, design, base, color, material, {
      brandName,
      logoFile,
      isBack: false,
    });
  } catch (error: unknown) {
    const message = cleanGeminiError(error);
    console.error("Generation error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

// Re-styles a real supplier reference photo into the selected color/material,
// optionally adding the user's logo, while preserving the exact bag shape,
// pockets, hardware, and camera angle shown in the reference.
async function generateRestyledView(
  ai: GoogleGenAI,
  design: (typeof BAG_DESIGNS)[number],
  baseImage: Buffer,
  color: (typeof BAG_DESIGNS)[number]["colors"][number],
  material: (typeof BAG_DESIGNS)[number]["materials"][number],
  options: { brandName: string; logoFile: File | null; isBack: boolean }
) {
  const parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  const restyleInstruction = `Re-render this exact bag in ${color.descriptor} ${material.descriptor}. Keep the EXACT same bag shape, silhouette, pockets, seams, hardware, straps, and camera angle/framing as shown in the reference photo — only change the color and material finish. Clean white/marble background, premium catalog product photography, warm natural lighting, photorealistic.`;

  if (options.isBack) {
    parts.push({ text: `${restyleInstruction} Do not add any logos or branding.` });
    parts.push({ inlineData: { mimeType: "image/png", data: baseImage.toString("base64") } });
  } else if (options.logoFile) {
    const logo = await normalizeImageToPng(options.logoFile);
    const brandDesc = options.brandName ? `the brand "${options.brandName}"` : "the provided brand";
    parts.push({
      text: `${restyleInstruction} Then add ${brandDesc} logo naturally at ${design.logoPlacement}, as if it were embroidered or printed there.`,
    });
    parts.push({ inlineData: { mimeType: "image/png", data: baseImage.toString("base64") } });
    parts.push({ text: "Here is the brand logo to place on the bag:" });
    parts.push({ inlineData: logo });
  } else {
    const brandLine = options.brandName
      ? ` Then add the brand name "${options.brandName}" onto the bag naturally at ${design.logoPlacement}, small and subtly embroidered/printed, clearly readable.`
      : "";
    parts.push({ text: `${restyleInstruction}${brandLine}` });
    parts.push({ inlineData: { mimeType: "image/png", data: baseImage.toString("base64") } });
  }

  return await callGeminiImage(ai, parts);
}

// Used only for designs without a real back photo — infers the back view from
// the already-branded, restyled front image.
async function generateInferredBack(
  ai: GoogleGenAI,
  design: (typeof BAG_DESIGNS)[number],
  frontReference: File,
  color: (typeof BAG_DESIGNS)[number]["colors"][number],
  material: (typeof BAG_DESIGNS)[number]["materials"][number]
) {
  const refBytes = await frontReference.arrayBuffer();
  const refBase64 = Buffer.from(refBytes).toString("base64");

  const instruction = `This is the FRONT view of a ${design.name} in ${color.descriptor} ${material.descriptor}. Generate the BACK view of this exact same bag as a FULL PRODUCT SHOT: frame the ENTIRE bag from top to bottom so its complete silhouette — straps, handles, and full outline — is visible inside the frame with clean background space around it. Same color, same material, same lighting, same clean background, same photography style as the reference. ${design.backDescription} Do not add any logos or branding to the back.`;

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [
    { text: instruction },
    { inlineData: { mimeType: frontReference.type, data: refBase64 } },
  ];

  return await callGeminiImage(ai, parts);
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
