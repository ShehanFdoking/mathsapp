import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";
import { getSinhalaFont } from "./sinhala-font";

const MARGIN = 50;
const LINE_HEIGHT = 16;
const PAGE_SIZE: [number, number] = [595.28, 841.89]; // A4

// Helper to check if text contains Sinhala characters
function containsSinhala(text: string): boolean {
  return /[\u0D80-\u0DFF]/.test(text);
}

async function newDoc() {
  const doc = await PDFDocument.create();

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Load and embed Sinhala font - REQUIRED for Sinhala text support
  let sinhalaFont = null;
  try {
    const sinhalaFontBytes = await getSinhalaFont();
    // pdf-lib can embed TTF fonts directly without fontkit for basic rendering
    sinhalaFont = await doc.embedFont(sinhalaFontBytes, { subset: true });
    console.log("Successfully embedded Sinhala font");
  } catch (error) {
    console.error("Failed to embed Sinhala font:", error);
    // Don't throw - just log and continue without Sinhala support
    // This allows English notes to still work
  }

  return { doc, font, bold, sinhalaFont };
}

function wrapText(text: string, font: any, size: number, maxWidth: number, sinhalaFont?: any): string[] {
  // Use appropriate font based on text content
  const hasSinhala = containsSinhala(text);
  const effectiveFont = hasSinhala && sinhalaFont ? sinhalaFont : font;

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    try {
      if (effectiveFont.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    } catch (e) {
      // If width calculation fails, just add the word
      if (line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

class Writer {
  page: any;
  y: number;
  doc: PDFDocument;
  font: any;
  bold: any;
  sinhalaFont: any;

  constructor(doc: PDFDocument, font: any, bold: any, sinhalaFont: any) {
    this.doc = doc;
    this.font = font;
    this.bold = bold;
    this.sinhalaFont = sinhalaFont;
    this.page = doc.addPage(PAGE_SIZE);
    this.y = PAGE_SIZE[1] - MARGIN;
  }

  ensureSpace(needed: number) {
    if (this.y - needed < MARGIN) {
      this.page = this.doc.addPage(PAGE_SIZE);
      this.y = PAGE_SIZE[1] - MARGIN;
    }
  }

  text(str: string, opts: { size?: number; bold?: boolean; gap?: number } = {}) {
    const size = opts.size || 11;
    const maxWidth = PAGE_SIZE[0] - MARGIN * 2;

    // Check if text contains Sinhala
    const hasSinhala = containsSinhala(str);
    const useFont = hasSinhala && this.sinhalaFont ? this.sinhalaFont : (opts.bold ? this.bold : this.font);

    const lines = wrapText(str, useFont, size, maxWidth, this.sinhalaFont);

    for (const line of lines) {
      this.ensureSpace(LINE_HEIGHT);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: useFont, color: rgb(0.1, 0.1, 0.1) });
      this.y -= LINE_HEIGHT;
    }
    this.y -= opts.gap || 4;
  }

  // Add watermark to current page
  addWatermark(text: string = "GoMath Study Material") {
    const centerX = PAGE_SIZE[0] / 2;
    const centerY = PAGE_SIZE[1] / 2;

    // Draw diagonal watermark in center (pdf-lib uses degrees directly)
    this.page.drawText(text, {
      x: centerX - 100,
      y: centerY,
      size: 40,
      font: this.font,
      color: rgb(0.9, 0.9, 0.9),
      rotate: { type: 'degrees', angle: -45 },
      opacity: 0.3,
    });
  }
}

export async function generatePaperPdf(params: {
  studentName: string;
  grade: number;
  difficulty: string;
  durationMin: number;
  lessonTitles: string[];
  questions: { question: string; modelAnswer: string; marks: number }[];
}): Promise<Buffer> {
  const { doc, font, bold, sinhalaFont } = await newDoc();
  const w = new Writer(doc, font, bold, sinhalaFont);

  const totalMarks = params.questions.reduce((sum, q) => sum + q.marks, 0);

  w.text(`Grade ${params.grade} Maths — Practice Paper`, { size: 18, bold: true, gap: 4 });
  w.text(`Difficulty: ${params.difficulty}   |   Duration: ${params.durationMin} minutes   |   Total marks: ${totalMarks}`, {
    size: 11,
    gap: 2,
  });
  w.text(`Lessons: ${params.lessonTitles.join(", ")}`, { size: 11, gap: 2 });
  w.text(`Student: ${params.studentName}`, { size: 11, gap: 14 });

  w.text("Answer ALL questions. Show your full working.", { size: 11, gap: 14 });

  params.questions.forEach((q, i) => {
    w.ensureSpace(60);
    w.text(`${i + 1}. ${q.question}  [${q.marks} mark${q.marks === 1 ? "" : "s"}]`, { size: 12, bold: true, gap: 6 });
    // Leave working space proportional to the marks allocated
    w.y -= Math.min(80, q.marks * 18);
  });

  w.ensureSpace(200);
  w.text("— End of paper —", { size: 11, gap: 0 });

  // Model answers / marking scheme on fresh pages
  const w2 = new Writer(doc, font, bold, sinhalaFont);
  w2.text("Model Answers (for self-check / marking)", { size: 14, bold: true, gap: 10 });
  params.questions.forEach((q, i) => {
    w2.ensureSpace(40);
    w2.text(`${i + 1}. ${q.question}`, { size: 11, bold: true, gap: 4 });
    w2.text(q.modelAnswer, { size: 11, gap: 12 });
  });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

// Legacy MCQ-based paper renderer — kept in case you want an MCQ-style
// paper format again in the future. Not used by the current STRUCTURED
// paper flow.
export async function generateMcqPaperPdf(params: {
  studentName: string;
  grade: number;
  difficulty: string;
  durationMin: number;
  lessonTitles: string[];
  questions: { question: string; options: [string, string, string, string]; answerIndex: number }[];
}): Promise<Buffer> {
  const { doc, font, bold, sinhalaFont } = await newDoc();
  const w = new Writer(doc, font, bold, sinhalaFont);

  w.text(`Grade ${params.grade} Maths — Practice Paper`, { size: 18, bold: true, gap: 4 });
  w.text(`Difficulty: ${params.difficulty}   |   Duration: ${params.durationMin} minutes`, { size: 11, gap: 2 });
  w.text(`Lessons: ${params.lessonTitles.join(", ")}`, { size: 11, gap: 2 });
  w.text(`Student: ${params.studentName}`, { size: 11, gap: 14 });

  params.questions.forEach((q, i) => {
    w.text(`${i + 1}. ${q.question}`, { size: 12, bold: true, gap: 6 });
  });

  w.ensureSpace(200);
  w.text("— End of paper —", { size: 11, gap: 0 });

  // Answer key on a fresh page
  const w2 = new Writer(doc, font, bold, sinhalaFont);
  w2.text("Answer Key (for self-check)", { size: 14, bold: true, gap: 10 });
  params.questions.forEach((q, i) => {
    const letter = ["A", "B", "C", "D"][q.answerIndex];
    w2.text(`${i + 1}. ${letter}) ${q.options[q.answerIndex]}`, { size: 11, gap: 4 });
  });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export async function generateNotePdf(params: {
  lessonTitle: string;
  grade: number;
  markdown: string;
  addWatermark?: boolean;
}): Promise<Buffer> {
  const { doc, font, bold, sinhalaFont } = await newDoc();
  const w = new Writer(doc, font, bold, sinhalaFont);

  // Add watermark to first page if requested
  if (params.addWatermark) {
    w.addWatermark();
  }

  w.text(`Grade ${params.grade} — ${params.lessonTitle}`, { size: 16, bold: true, gap: 10 });

  // Process markdown - now properly supports Sinhala
  const lines = params.markdown.split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      w.y -= 6;
      continue;
    }
    if (line.startsWith("#")) {
      w.text(line.replace(/^#+\s*/, ""), { size: 13, bold: true, gap: 6 });
    } else if (line.startsWith("-") || line.startsWith("*")) {
      w.text(`•  ${line.replace(/^[-*]\s*/, "")}`, { size: 11, gap: 3 });
    } else {
      w.text(line.replace(/\*\*/g, ""), { size: 11, gap: 3 });
    }
  }

  // Add watermark to all pages
  if (params.addWatermark) {
    const pages = doc.getPages();
    pages.forEach((page, index) => {
      if (index > 0) { // First page already has watermark
        page.drawText("GoMath Study Material", {
          x: PAGE_SIZE[0] / 2 - 100,
          y: PAGE_SIZE[1] / 2,
          size: 40,
          font: font,
          color: rgb(0.9, 0.9, 0.9),
          rotate: degrees(-45),
          opacity: 0.3,
        });
      }
    });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
