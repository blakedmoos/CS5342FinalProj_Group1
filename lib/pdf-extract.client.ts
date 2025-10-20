// Minimal client-side PDF extraction utility using pdf-lib (browser-safe)
import { PDFDocument } from 'pdf-lib';

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  let text = '';
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    // pdf-lib does not support text extraction directly; this is a placeholder for future WASM or backend solution
    text += `[Page ${i + 1} text extraction not fully supported with pdf-lib.]\n`;
  }
  return text;
}
