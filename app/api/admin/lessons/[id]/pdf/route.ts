import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PDFDocument } from "pdf-lib";
// If using S3 storage, fetch the object bytes via a helper; simplified here
// assuming lib/storage exposes a way to read the raw bytes back.
import { getSignedFileUrl } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: params.id }, include: { textbook: true } });
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sourceUrl = await getSignedFileUrl(lesson.textbook.fileUrl);
  const sourceBytes = await fetch(sourceUrl).then((r) => r.arrayBuffer());

  const srcDoc = await PDFDocument.load(sourceBytes);
  const outDoc = await PDFDocument.create();

  // startPage/endPage are 1-indexed
  const indices = [];
  for (let p = lesson.startPage; p <= lesson.endPage; p++) indices.push(p - 1);

  const copied = await outDoc.copyPages(srcDoc, indices);
  copied.forEach((p) => outDoc.addPage(p));

  const bytes = await outDoc.save();

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${lesson.title}.pdf"`,
    },
  });
}
