import sharp from "sharp";

/**
 * Normalizes an uploaded image into a flat, square PNG before sending it to
 * Gemini. Gemini's image API only accepts raster mimetypes (PNG/JPEG/WEBP/
 * HEIC) and rejects others outright — SVG logos (a very common upload for
 * brand logos) fail with a 400 "Unable to process input image" otherwise.
 *
 * Padding to a square canvas matters as much as the format: a wide, short
 * wordmark logo (e.g. 1020x217) sent at its native aspect ratio skews
 * Gemini's chosen output canvas into a wide banner shape, squeezing the
 * actual product photo into a corner. Padding every input to 1:1 with
 * transparent margins keeps the logo's aspect ratio from leaking into the
 * generated image's shape.
 */
export async function normalizeImageToPng(
  file: File
): Promise<{ mimeType: string; data: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const png = await sharp(bytes, { density: 300 })
    .resize(1024, 1024, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
  return { mimeType: "image/png", data: png.toString("base64") };
}
