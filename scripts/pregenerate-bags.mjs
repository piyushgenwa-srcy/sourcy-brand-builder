// One-off script: generates the unbranded base front + back shots for every
// bag design x colorway combo and writes them to public/pickleball/.
// Run with: GEMINI_API_KEY=... node scripts/pregenerate-bags.mjs
//
// These pre-generated images are what the /pickleball design picker shows,
// and what the generate-bag API composites a user's logo onto at request time.

import { GoogleGenAI } from "@google/genai";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "pickleball");

async function loadDesigns() {
  const mod = await import("../src/lib/pickleball-products.ts");
  return mod.BAG_DESIGNS;
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is required");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function callGeminiImage(parts) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts }],
    config: { responseModalities: ["image", "text"] },
  });
  const candidate = response.candidates?.[0];
  for (const part of candidate?.content?.parts ?? []) {
    if (part.inlineData) return Buffer.from(part.inlineData.data, "base64");
  }
  throw new Error("No image in response");
}

async function generateFront(design, color) {
  const baseDescription = `${design.silhouette}, in ${color.descriptor}`;
  const text = `Generate a photorealistic FULL PRODUCT SHOT of ${baseDescription}. Frame the ENTIRE bag from top to bottom so its complete silhouette — straps, handles, all pockets, and full outline — is clearly visible inside the frame with clean background space around it. This is a wide, full-body catalog product photo, NOT a close-up or macro detail shot of fabric texture or hardware. The bag must be completely plain with no logos, no text, and no branding anywhere. Three-quarter view, centered composition, clean white/marble background, premium catalog quality, warm natural lighting, high-end commercial e-commerce photography style, entire product visible with margin on all sides.`;
  return callGeminiImage([{ text }]);
}

async function generateBack(design, frontBuffer) {
  const text = `This is the FRONT view of a ${design.name}. Generate the BACK view of this exact same bag as a FULL PRODUCT SHOT: frame the ENTIRE bag from top to bottom so its complete silhouette — straps, handles, and full outline — is visible inside the frame with clean background space around it. This must be a wide, full-body product photo at the same distance/zoom level as the reference image, NOT a close-up or macro detail shot of the fabric or hardware. Same color, same material, same lighting, same clean background, same photography style as the reference. ${design.backDescription} The bag must be completely plain with no logos, no text, and no branding.`;
  return callGeminiImage([
    { text },
    { inlineData: { mimeType: "image/png", data: frontBuffer.toString("base64") } },
  ]);
}

async function main() {
  const BAG_DESIGNS = await loadDesigns();
  await mkdir(OUT_DIR, { recursive: true });

  const jobs = BAG_DESIGNS.flatMap((design) =>
    design.colors.map((color) => ({ design, color }))
  );

  // Small concurrency to avoid rate limits while still being reasonably fast.
  const CONCURRENCY = 3;
  let cursor = 0;

  async function worker() {
    while (cursor < jobs.length) {
      const { design, color } = jobs[cursor++];
      const label = `${design.id} / ${color.id}`;
      try {
        console.log(`[${label}] generating front...`);
        const front = await generateFront(design, color);
        await writeFile(
          path.join(OUT_DIR, `${design.id}--${color.id}--front.png`),
          front
        );

        console.log(`[${label}] generating back...`);
        const back = await generateBack(design, front);
        await writeFile(
          path.join(OUT_DIR, `${design.id}--${color.id}--back.png`),
          back
        );

        console.log(`[${label}] done`);
      } catch (err) {
        console.error(`[${label}] FAILED:`, err.message);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log("All done.");
}

main();
