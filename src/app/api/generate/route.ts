import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from "@/lib/products";

export const maxDuration = 60;

export async function POST(request: Request) {
  const formData = await request.formData();
  const productId = formData.get("productId") as string;
  const brandName = formData.get("brandName") as string;
  const logoFile = formData.get("logo") as File | null;
  const customImage = formData.get("customImage") as File | null;

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
        customImage
      );
    } else {
      return await generateWithImagen(ai, product, brandName);
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
  brandName: string
) {
  const prompt = `Professional product photography of ${product.prompt} with the brand name "${brandName}" prominently printed/embroidered on the product. The brand text should be clearly readable, naturally placed where branding would go. Premium catalog quality, warm natural lighting, clean white/marble background, high-end commercial photography style.`;

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
  customImage: File | null
) {
  const parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  if (customImage) {
    const imageBytes = await customImage.arrayBuffer();
    const base64 = Buffer.from(imageBytes).toString("base64");

    parts.push({
      text: `You are a professional product mockup designer. Take this product image and add the brand "${brandName}" logo/branding onto it naturally. The logo should be placed where it would naturally appear on this product - centered on the chest for shirts/hoodies, front panel for caps, side for bottles, cover for notebooks, etc. Make it look like a real branded product photo, production-ready quality. Keep the style photorealistic and premium. Generate the edited image.`,
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
    parts.push({
      text: `Generate a photorealistic product mockup image of ${product.prompt} with the brand logo prominently featured on the product. The logo should be naturally placed where branding would go - centered chest for shirts/hoodies, front panel for caps, side for bottles, cover for notebooks, front for totes. Make this look like a real product photo from a premium brand catalog. Warm natural lighting, clean composition, production-ready quality. The brand name is "${brandName}". Generate the image.`,
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
