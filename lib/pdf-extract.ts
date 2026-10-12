import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Many Sri Lankan textbook PDFs are typeset with legacy, non-Unicode
 * Sinhala fonts (e.g. FM Abhaya, Malithi Web) where each glyph is mapped
 * to an arbitrary Latin-range code point. Extracting "text" from these
 * with a normal PDF text layer reader returns that garbled Latin mapping,
 * not real Sinhala — it looks like "iuñ;sh" instead of an actual word.
 * This checks whether a chunk of text contains a healthy proportion of
 * real Sinhala Unicode codepoints (U+0D80–U+0DFF), which is only true for
 * properly Unicode-encoded PDFs. Pages that fail this get OCR'd instead
 * (see lib/pdf-ocr.ts), which reads the rendered glyphs directly and
 * isn't affected by the font's internal encoding.
 * 
 * IMPROVED: Lower threshold to 0.15 to catch more pages that need OCR.
 * This ensures better Sinhala text extraction even with partial Unicode coverage.
 */
export function sinhalaUnicodeRatio(text: string): number {
  const nonSpace = text.replace(/\s/g, "");
  if (nonSpace.length < 10) return 1; // too little text to judge — don't flag near-empty pages
  const sinhalaChars = nonSpace.match(/[\u0D80-\u0DFF]/g)?.length ?? 0;
  return sinhalaChars / nonSpace.length;
}

export function looksLikeGarbledSinhala(text: string, threshold = 0.15): boolean {
  return sinhalaUnicodeRatio(text) < threshold;
}

/**
 * Extracts text per page from an uploaded textbook PDF.
 * Used both to feed the AI lesson-segmenter and to store each lesson's
 * rawText (startPage..endPage) for later note/question generation.
 */
export async function extractPdfPages(fileBuffer: Buffer): Promise<{ page: number; text: string }[]> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) });
  const pdf = await loadingTask.promise;
  const pages: { page: number; text: string }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(" ");
    pages.push({ page: i, text });
  }

  return pages;
}

export function joinPageRange(pages: { page: number; text: string }[], start: number, end: number): string {
  return pages
    .filter((p) => p.page >= start && p.page <= end)
    .map((p) => p.text)
    .join("\n");
}
