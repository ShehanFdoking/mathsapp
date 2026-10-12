import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeGpaAverage } from "@/lib/grading";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const grade = Number(searchParams.get("grade") || 6);

  const students = await prisma.user.findMany({
    where: { role: "STUDENT", grade },
    include: {
      quizAttempts: { select: { percentage: true, credits: true } },
    },
  });

  const ranked = students
    .map((s) => ({
      id: s.id,
      name: s.name,
      school: s.school,
      medium: s.medium,
      average: computeGpaAverage(s.quizAttempts),
      attemptsCount: s.quizAttempts.length,
    }))
    .filter((s) => s.attemptsCount > 0)
    .sort((a, b) => b.average - a.average)
    .slice(0, 10);

  return NextResponse.json(ranked);
}
