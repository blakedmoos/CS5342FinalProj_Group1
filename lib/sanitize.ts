/**
 * Sanitizes user input to prevent XSS, malformed questions, and abuse.
 */
export function sanitizeInput(text: string): string {
  if (!text || typeof text !== "string") return ""

  let clean = text.trim()

  const MAX_LEN = 500
  if (clean.length > MAX_LEN) {
    clean = clean.slice(0, MAX_LEN)
  }

  clean = clean.replace(/<\s*script.*?>.*?<\s*\/\s*script\s*>/gi, "")

  clean = clean.replace(/<[^>]+>/g, "")

  clean = clean.replace(/[\u0000-\u001F\u007F]/g, "")

  clean = clean.replace(/\s+/g, " ")

  return clean
}
