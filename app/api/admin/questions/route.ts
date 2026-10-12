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
  const lessonId = searchParams.get("lessonId") || undefined;
  const difficulty = searchParams.get("difficulty") || undefined;
  const status = searchParams.get("status") || undefined;
  const type = searchParams.get("type") || undefined;
  const grade = searchParams.get("grade") ? parseInt(searchParams.get("grade")!) : undefined;
  const medium = searchParams.get("medium") || undefined;

  const questions = await prisma.question.findMany({
    where: {
      ...(lessonId && { lessonId }),
      ...(difficulty && { difficulty: difficulty as any }),
      ...(status && { status: status as any }),
      ...(type && { type: type as any }),
      ...(grade && { grade }),
      ...(medium && { medium: medium as any }),
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(questions);
}
