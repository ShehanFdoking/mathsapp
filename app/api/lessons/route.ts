import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { grade, medium } = session.user as any;

  const lessons = await prisma.lesson.findMany({
    where: { grade, medium },
    orderBy: { order: "asc" },
    select: { id: true, title: true, order: true, smartNote: true, notePdfKey: true },
  });

  return NextResponse.json(lessons);
}
