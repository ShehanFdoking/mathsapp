import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUIZ_DURATION_MIN, QUESTIONS_PER_QUIZ, Difficulty } from "@/lib/grading";

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;
  const { lessonIds, difficulty } = (await req.json()) as {
    lessonIds: string[];
    difficulty: Difficulty;
  };

  if (!lessonIds?.length) {
    return NextResponse.json({ error: "Select at least one lesson" }, { status: 400 });
  }

  // Only ever draw from admin-approved MCQ questions.
  const pool = await prisma.question.findMany({
    where: { lessonId: { in: lessonIds }, difficulty, type: "MCQ", status: "APPROVED" },
  });

  if (pool.length < QUESTIONS_PER_QUIZ) {
    return NextResponse.json(
      {
        error: `Not enough approved ${difficulty.toLowerCase()} questions for these lessons yet (${pool.length}/${QUESTIONS_PER_QUIZ}). Ask your teacher/admin to approve more.`,
      },
      { status: 409 }
    );
  }

  const picked = shuffle(pool).slice(0, QUESTIONS_PER_QUIZ);

  const quiz = await prisma.quiz.create({
    data: {
      userId: user.id,
      lessonIds,
      questionIds: picked.map((q) => q.id),
      difficulty,
      durationMin: QUIZ_DURATION_MIN[difficulty],
    },
  });

  // Don't leak answerIndex/explanation to the client until after submission
  const safeQuestions = picked.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    hint: q.hint,
    diagramUrl: q.diagramUrl,
  }));

  return NextResponse.json({
    id: quiz.id,
    durationMin: quiz.durationMin,
    questions: safeQuestions,
  });
}
