import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const gradeParam = searchParams.get("grade");
  const mediumParam = searchParams.get("medium");

  // Build where clause - only include filters if they are provided
  const where: any = {};
  if (gradeParam) {
    where.grade = Number(gradeParam);
  }
  if (mediumParam) {
    where.medium = mediumParam as "ENGLISH" | "SINHALA";
  }

  const lessons = await prisma.lesson.findMany({
    where,
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { questions: true }
      }
    }
  });

  return NextResponse.json(lessons);
}
