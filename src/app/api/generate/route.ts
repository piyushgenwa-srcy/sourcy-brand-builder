import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from "@/lib/products";

export const maxDuration = 60;

type ViewType = "logo" | "front" | "back";

export async function POST(request: Request) {
  const formData = await request.formData();
  const productId = formData.get("productId") as string;
  const brandName = formData.get("brandName") as string;
  const logoFile = formData.get("logo") as File | null;
  const customImage = formData.get("customImage") as File | null;
  const referenceImage = formData.get("referenceImage") as File | null;
  const viewType = (formData.get("viewType") as ViewType) || "front";

  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    return Response.json({ error: "Invalid product" }, { status: 400 });
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
      return await generateFromReference(
        ai,
        product,
        brandName,
        referenceImage,
        viewType
      );
    }

    const hasInputImages = !!(logoFile || customImage);
    if (hasInputImages) {
      return await generateWithGeminiImage(
        ai,
        product,
        brandName,
        logoFile,
        customImage,
        viewType
      );
    } else {
      return await generateWithImagen(ai, product, brandName, viewType);
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    console.error("Generation error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

// Used for logo close-up and back view — derives from the already-generated front
// so all 3 images are visually consistent (same product, same logo, same lighting).
async function generateFromReference(
  ai: GoogleGenAI,
  product: (typeof PRODUCTS)[number],
  brandName: string,
  referenceImage: File,
  viewType: "logo" | "back"
) {
  const refBytes = await referenceImage.arrayBuffer();
  const refBase64 = Buffer.from(refBytes).toString("base64");

  let instruction: string;
  if (viewType === "logo") {
    instruction = `This is a product photograph. Generate an extreme close-up macro photo zoomed tightly into the logo and branding area only. Reproduce the EXACT same logo design, colors, typography, and style shown in the reference image — do not alter or reinterpret the logo. Show fine surface detail (print grain, embroidery stitching, or vinyl texture). Maintain consistent lighting, product color, and material. Professional macro product photography.`;
  } else {
    instruction = `This is the FRONT view of a ${product.name}. Generate the BACK view of this exact same product — same color, same material, same lighting, same clean background, same photography style. ${product.backDescription} Do not add any logos or branding text to the back.`;
  }

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [
    { text: instruction },
    { inlineData: { mimeType: referenceImage.type, data: refBase64 } },
  ];

  return await callGeminiImage(ai, parts);
}

async function generateWithImagen(
  ai: GoogleGenAI,
  product: (typeof PRODUCTS)[number],
  brandName: string,
  viewType: ViewType
) {
  const brandingInstruction = brandName
    ? `with the brand name "${brandName}" prominently printed/embroidered on the product. The brand text should be clearly readable, naturally placed where branding would appear.`
    : `as a clean blank product ready for branding.`;

  let viewDirective: string;
  if (viewType === "front") {
    viewDirective =
      "Front-facing full product view, centered composition, clean white/marble background.";
  } else if (viewType === "logo") {
    viewDirective =
      "Extreme close-up macro shot zoomed in on the logo and branding area, showing crisp print or embroidery texture detail, shallow depth of field.";
  } else {
    viewDirective = `Back view of the product. ${product.backDescription} Centered composition, clean white/marble background.`;
  }

  const prompt = `Professional product photography of ${product.prompt} ${brandingInstruction} ${viewDirective} Premium catalog quality, warm natural lighting, high-end commercial photography style.`;

  const response = await ai.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt,
    config: { numberOfImages: 1 },
  });

  const image = response.generatedImages?.[0];
  if (!image?.image?.imageBytes) {
    return Response.json({ error: "No image generated" }, { status: 500 });
  }

  const base64 =
    typeof image.image.imageBytes === "string"
      ? image.image.imageBytes
      : Buffer.from(image.image.imageBytes).toString("base64");

  return Response.json({ imageUrl: `data:image/png;base64,${base64}` });
}

async function generateWithGeminiImage(
  ai: GoogleGenAI,
  product: (typeof PRODUCTS)[number],
  brandName: string,
  logoFile: File | null,
  customImage: File | null,
  viewType: ViewType
) {
  const parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  let viewNote = "";
  if (viewType === "logo") {
    viewNote =
      " Then generate an extreme close-up of the logo/branding area only, showing crisp detail.";
  } else if (viewType === "back") {
    viewNote = ` Show the BACK VIEW of the product. ${product.backDescription} Do not add any logos or branding to the back.`;
  }

  if (customImage) {
    const imageBytes = await customImage.arrayBuffer();
    const base64 = Buffer.from(imageBytes).toString("base64");
    const brandDesc = brandName ? `the brand "${brandName}"` : "the provided brand";

    parts.push({
      text: `You are a professional product mockup designer. Take this product image and add ${brandDesc} logo/branding onto the front naturally — placed where it would appear on this type of product (centered chest for shirts/hoodies, front panel for caps, side for bottles, cover for notebooks). Make it look like a real branded product photo, production-ready quality, photorealistic and premium.${viewNote} Generate the edited image.`,
    });
    parts.push({ inlineData: { mimeType: customImage.type, data: base64 } });

    if (logoFile) {
      const logoBytes = await logoFile.arrayBuffer();
      const logoBase64 = Buffer.from(logoBytes).toString("base64");
      parts.push({ text: "Here is the brand logo to place on the product:" });
      parts.push({ inlineData: { mimeType: logoFile.type, data: logoBase64 } });
    }
  } else {
    const brandLine = brandName ? ` The brand name is "${brandName}".` : "";
    parts.push({
      text: `Generate a photorealistic product mockup of ${product.prompt} with the brand logo on the front only — placed where it would naturally appear (centered chest for shirts/hoodies, front panel for caps, side for bottles, cover for notebooks, front for totes). Premium brand catalog style, warm natural lighting, clean composition.${brandLine}${viewNote}`,
    });

    if (logoFile) {
      const logoBytes = await logoFile.arrayBuffer();
      const logoBase64 = Buffer.from(logoBytes).toString("base64");
      parts.push({ text: "Incorporate this brand logo into the product design:" });
      parts.push({ inlineData: { mimeType: logoFile.type, data: logoBase64 } });
    }
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
