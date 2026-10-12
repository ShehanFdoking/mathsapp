import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lessons = await prisma.lesson.findMany({ where: { textbookId: params.id }, select: { id: true } });
  const lessonIds = lessons.map((l) => l.id);

  // Cascade: questions -> lessons -> the textbook part itself.
  // (Note: this does not delete the underlying PDF file from storage —
  // add that cleanup in lib/storage.ts if you want it removed too.)
  await prisma.question.deleteMany({ where: { lessonId: { in: lessonIds } } });
  await prisma.lesson.deleteMany({ where: { textbookId: params.id } });
  await prisma.textbook.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true, lessonsRemoved: lessonIds.length });
}
