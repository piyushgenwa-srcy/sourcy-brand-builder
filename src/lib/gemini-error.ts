/**
 * Gemini SDK errors often surface as the raw HTTP response body (a JSON
 * blob) inside `error.message`. Extract the human-readable message from it
 * so the UI shows a clean sentence instead of dumping raw API JSON.
 */
export function cleanGeminiError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const jsonStart = raw.indexOf("{");
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart));
      const message = parsed?.error?.message;
      if (typeof message === "string") return message;
    } catch {
      // not valid JSON — fall through to the raw message
    }
  }
  return raw;
}
