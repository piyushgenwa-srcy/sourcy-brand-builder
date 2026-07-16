import sharp from "sharp";

/**
 * Normalizes an uploaded image into a flat PNG before sending it to Gemini.
 * Gemini's image API only accepts raster mimetypes (PNG/JPEG/WEBP/HEIC) and
 * rejects others outright — SVG logos (a very common upload for brand logos)
 * fail with a 400 "Unable to process input image" otherwise. Re-encoding
 * through sharp also caps oversized uploads and normalizes whatever mimetype
 * the browser reported for the original file.
 */
export async function normalizeImageToPng(
  file: File
): Promise<{ mimeType: string; data: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const png = await sharp(bytes, { density: 300 })
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  return { mimeType: "image/png", data: png.toString("base64") };
}
