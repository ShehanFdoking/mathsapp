import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSmartNote } from "@/lib/ai";
import { generateNotePdf } from "@/lib/pdf-generate";
import { uploadFile, generateKey, getSignedFileUrl } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await req.json();
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  // Generate smart note text
  const note = await generateSmartNote({
    lessonTitle: lesson.title,
    grade: lesson.grade,
    medium: lesson.medium,
    textbookText: lesson.rawText || "",
  });

  // Generate PDF with watermark
  const pdfBytes = await generateNotePdf({
    lessonTitle: lesson.title,
    grade: lesson.grade,
    markdown: note,
    addWatermark: true,
  });

  // Upload PDF to S3
  const key = generateKey(`notes/lessons/${lessonId}`, "pdf");
  await uploadFile(pdfBytes, key, "application/pdf");

  // Update lesson with both smartNote text and PDF key (not URL - we'll generate signed URLs on demand)
  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      smartNote: note,
      notePdfKey: key,
    },
  });

  // Generate a signed URL for immediate preview
  const pdfUrl = await getSignedFileUrl(key);

  return NextResponse.json({ ok: true, pdfUrl });
}
