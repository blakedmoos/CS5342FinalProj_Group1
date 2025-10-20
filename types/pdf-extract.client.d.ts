declare module './lib/pdf-extract.client' {
  export function extractTextFromPDF(file: File): Promise<string>;
}
