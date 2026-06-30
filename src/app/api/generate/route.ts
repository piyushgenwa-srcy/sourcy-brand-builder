import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from "@/lib/products";

export const maxDuration = 60;

type ViewType = "logo" | "front" | "back";

const IMAGEN_VIEW_SUFFIX: Record<ViewType, string> = {
  logo: "Extreme close-up macro shot zoomed in on the logo and branding area, showing crisp detail of the print or embroidery texture, shallow depth of field, clean background.",
  front:
    "Front-facing full product view, centered composition, clean white/marble background.",
  back: "Back view of the product showing the complete back side, centered composition, clean white/marble background.",
};

const GEMINI_VIEW_INSTRUCTION: Record<ViewType, string> = {
  logo: "Generate an extreme close-up macro shot focused entirely on the logo/branding area of the product, showing crisp detail of the print or embroidery texture, shallow depth of field.",
  front:
    "Generate a clean front-facing view of the full product, centered composition, professional product photography.",
  back: "Generate a clean back view of the full product showing the complete back side, centered composition, professional product photography.",
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const productId = formData.get("productId") as string;
  const brandName = formData.get("brandName") as string;
  const logoFile = formData.get("logo") as File | null;
  const customImage = formData.get("customImage") as File | null;
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
  const hasInputImages = !!(logoFile || customImage);

  try {
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

async function generateWithImagen(
  ai: GoogleGenAI,
  product: (typeof PRODUCTS)[number],
  brandName: string,
  viewType: ViewType
) {
  const brandingInstruction = brandName
    ? `with the brand name "${brandName}" prominently printed/embroidered on the product. The brand text should be clearly readable, naturally placed where branding would go.`
    : `as a clean blank product ready for branding.`;

  const viewSuffix = IMAGEN_VIEW_SUFFIX[viewType];

  const prompt = `Professional product photography of ${product.prompt} ${brandingInstruction} ${viewSuffix} Premium catalog quality, warm natural lighting, high-end commercial photography style.`;

  const response = await ai.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt,
    config: {
      numberOfImages: 1,
    },
  });

  const image = response.generatedImages?.[0];
  if (!image?.image?.imageBytes) {
    return Response.json({ error: "No image generated" }, { status: 500 });
  }

  const base64 =
    typeof image.image.imageBytes === "string"
      ? image.image.imageBytes
      : Buffer.from(image.image.imageBytes).toString("base64");

  return Response.json({
    imageUrl: `data:image/png;base64,${base64}`,
  });
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

  const viewInstruction = GEMINI_VIEW_INSTRUCTION[viewType];

  if (customImage) {
    const imageBytes = await customImage.arrayBuffer();
    const base64 = Buffer.from(imageBytes).toString("base64");

    const brandDesc = brandName ? `the brand "${brandName}"` : "the provided brand";
    parts.push({
      text: `You are a professional product mockup designer. Take this product image and add ${brandDesc} logo/branding onto it naturally. The logo should be placed where it would naturally appear on this product - centered on the chest for shirts/hoodies, front panel for caps, side for bottles, cover for notebooks, etc. Make it look like a real branded product photo, production-ready quality. Keep the style photorealistic and premium. ${viewInstruction}`,
    });

    parts.push({
      inlineData: { mimeType: customImage.type, data: base64 },
    });

    if (logoFile) {
      const logoBytes = await logoFile.arrayBuffer();
      const logoBase64 = Buffer.from(logoBytes).toString("base64");
      parts.push({
        text: "Here is the brand logo to place on the product:",
      });
      parts.push({
        inlineData: { mimeType: logoFile.type, data: logoBase64 },
      });
    }
  } else {
    const brandLine = brandName ? ` The brand name is "${brandName}".` : "";
    parts.push({
      text: `Generate a photorealistic product mockup image of ${product.prompt} with the brand logo prominently featured on the product. The logo should be naturally placed where branding would go - centered chest for shirts/hoodies, front panel for caps, side for bottles, cover for notebooks, front for totes. Make this look like a real product photo from a premium brand catalog. Warm natural lighting, clean composition, production-ready quality.${brandLine} ${viewInstruction}`,
    });

    if (logoFile) {
      const logoBytes = await logoFile.arrayBuffer();
      const logoBase64 = Buffer.from(logoBytes).toString("base64");
      parts.push({
        text: "Incorporate this brand logo into the product design:",
      });
      parts.push({
        inlineData: { mimeType: logoFile.type, data: logoBase64 },
      });
    }
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts }],
    config: {
      responseModalities: ["image", "text"],
    },
  });

  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    return Response.json({ error: "No image generated" }, { status: 500 });
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      const mimeType = part.inlineData.mimeType || "image/png";
      return Response.json({
        imageUrl: `data:${mimeType};base64,${imageData}`,
      });
    }
  }

  return Response.json({ error: "No image in response" }, { status: 500 });
}
