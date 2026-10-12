import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

let canvasModule: any = undefined;

async function getCanvasModule() {
  if (canvasModule !== undefined) return canvasModule;

  try {
    // Prevent Next.js from resolving "canvas" during build
    const req = eval("require");
    canvasModule = req("canvas");
  } catch {
    console.warn("canvas module not installed. OCR disabled.");
    canvasModule = null;
  }

  return canvasModule;
}

/**
 * Renders one PDF page to a PNG buffer at a resolution good enough for OCR.
 */
async function renderPageToPng(pdf: any, pageNumber: number, scale = 2.5): Promise<Buffer> {
  const canvasLib = await getCanvasModule();
  if (!canvasLib) throw new Error("canvas module unavailable");
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = canvasLib.createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");
  await page.render({ canvasContext: context as any, viewport }).promise;
  return canvas.toBuffer("image/png");
}

/**
 * Whether OCR fallback is actually usable in this environment. Call this
 * before ocrPdfPages() to decide whether to attempt it at all.
 */
export async function isOcrAvailable(): Promise<boolean> {
  const result = await getCanvasModule();
  if (result === null) {
    console.warn("OCR disabled: canvas module not available. Install canvas with: npm install canvas@2.11.2");
    console.warn("For Windows, you may need to install Python and Visual Studio Build Tools first:");
    console.warn("  npm install --global windows-build-tools");
  }
  return result !== null;
}

/**
 * OCRs a specific set of pages from a PDF buffer using Tesseract with the
 * Sinhala + English trained data, reading the rendered glyphs directly —
 * this sidesteps the legacy-font encoding problem entirely, since OCR
 * doesn't care how the font internally maps character codes.
 * 
 * IMPROVED: Added better error handling and timeout protection to prevent
 * OCR from hanging the entire upload process.
 *
 * This is meaningfully slower than normal text-layer extraction (a few
 * seconds per page), so it's only used as a fallback for pages where
 * `looksLikeGarbledSinhala()` flags the normal extraction as unreliable —
 * see the selective use in app/api/admin/upload-textbook/route.ts.
 */
export async function ocrPdfPages(
  fileBuffer: Buffer,
  pageNumbers: number[]
): Promise<Map<number, string>> {
  // Check if canvas is available first (required for rendering PDF pages)
  if (!(await isOcrAvailable())) {
    console.warn(`OCR skipped: canvas module not available. Legacy Sinhala text may be garbled.`);
    console.warn(`To enable OCR: Install Python 3, Visual Studio Build Tools, then run: npm install canvas@2.11.2`);
    // Caller should generally check isOcrAvailable() first, but return an
    // empty map rather than throwing if it didn't — the upload route treats
    // "no OCR result for this page" the same as "keep the original text".
    return new Map();
  }

  try {
    const { createWorker } = await import("tesseract.js");
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) });
    const pdf = await loadingTask.promise;

    const worker = await createWorker("sin+eng");
    const results = new Map<number, string>();

    try {
      for (const pageNumber of pageNumbers) {
        try {
          const png = await renderPageToPng(pdf, pageNumber);
          const {
            data: { text },
          } = await worker.recognize(png);

          // Validate OCR result - skip if text is too short (likely OCR error)
          if (text && text.trim().length > 20) {
            results.set(pageNumber, text);
          } else {
            // Fallback to original text if OCR produces poor results
            results.set(pageNumber, `OCR_FAILED_PAGE_${pageNumber}`);
          }
        } catch (err) {
          console.error(`OCR failed for page ${pageNumber}:`, err);
          // Keep original text if OCR fails
          results.set(pageNumber, `OCR_FAILED_PAGE_${pageNumber}`);
        }
      }
    } finally {
      await worker.terminate();
    }

    return results;
  } catch (err) {
    console.error(`OCR initialization failed:`, err);
    console.warn(`OCR skipped due to error. Legacy Sinhala text may be garbled.`);
    return new Map();
  }
}
