import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CREDITS, QUESTIONS_PER_QUIZ, Difficulty } from "@/lib/grading";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const { answers } = (await req.json()) as { answers: number[] };

  const quiz = await prisma.quiz.findUnique({ where: { id: params.id } });
  if (!quiz || quiz.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const questions = await prisma.question.findMany({ where: { id: { in: quiz.questionIds } } });
  // preserve the original presentation order
  const ordered = quiz.questionIds.map((id) => questions.find((q) => q.id === id)!);

  let score = 0;
  ordered.forEach((q, i) => {
    if (answers[i] === q.answerIndex) score += 1;
  });

  const percentage = (score / QUESTIONS_PER_QUIZ) * 100;
  const credits = CREDITS[quiz.difficulty as Difficulty];

  const attempt = await prisma.quizAttempt.create({
    data: { quizId: quiz.id, userId, answers, score, percentage, credits },
  });

  return NextResponse.json({
    attemptId: attempt.id,
    score,
    total: QUESTIONS_PER_QUIZ,
    percentage,
    correctAnswers: ordered.map((q) => q.answerIndex),
    explanations: ordered.map((q) => q.explanation),
  });
}
