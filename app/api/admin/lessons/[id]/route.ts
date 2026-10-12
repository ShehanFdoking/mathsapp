import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedFileUrl } from "@/lib/storage";
import { extractPdfPages, joinPageRange, looksLikeGarbledSinhala } from "@/lib/pdf-extract";
import { ocrPdfPages, isOcrAvailable } from "@/lib/pdf-ocr";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, startPage, endPage } = (await req.json()) as {
    title?: string;
    startPage?: number;
    endPage?: number;
  };

  const lesson = await prisma.lesson.findUnique({ where: { id: params.id }, include: { textbook: true } });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const newStart = startPage ?? lesson.startPage;
  const newEnd = endPage ?? lesson.endPage;

  let rawText = lesson.rawText;
  // Only re-extract text from the PDF if the page range actually changed —
  // this is the slow part (downloads + parses the source PDF again).
  if (newStart !== lesson.startPage || newEnd !== lesson.endPage) {
    if (newStart < 1 || newEnd > lesson.textbook.pageCount || newStart > newEnd) {
      return NextResponse.json(
        { error: `Page range must be between 1 and ${lesson.textbook.pageCount}, with start ≤ end.` },
        { status: 400 }
      );
    }
    const sourceUrl = await getSignedFileUrl(lesson.textbook.fileUrl);
    const sourceResponse = await fetch(sourceUrl);
    const sourceArrayBuffer = await sourceResponse.arrayBuffer();
    const sourceBytes = Buffer.from(sourceArrayBuffer);
    let pages = await extractPdfPages(sourceBytes);

    if (lesson.medium === "SINHALA" && (await isOcrAvailable())) {
      const rangePages = pages.filter((p) => p.page >= newStart && p.page <= newEnd);
      const badPages = rangePages.filter((p) => looksLikeGarbledSinhala(p.text)).map((p) => p.page);
      if (badPages.length > 0) {
        const ocrResults = await ocrPdfPages(sourceBytes, badPages);
        pages = pages.map((p) => (ocrResults.has(p.page) ? { ...p, text: ocrResults.get(p.page)! } : p));
      }
    }

    rawText = joinPageRange(pages, newStart, newEnd);
  }

  const updated = await prisma.lesson.update({
    where: { id: params.id },
    data: {
      title: title ?? lesson.title,
      startPage: newStart,
      endPage: newEnd,
      rawText,
      // Clear the smart note since it was generated from the old text —
      // admin should regenerate it after correcting the range.
      smartNote: newStart !== lesson.startPage || newEnd !== lesson.endPage ? null : lesson.smartNote,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.question.deleteMany({ where: { lessonId: params.id } });
  await prisma.lesson.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
