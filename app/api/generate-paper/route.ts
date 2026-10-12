import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePaperPdf } from "@/lib/pdf-generate";
import { uploadFile, generateKey } from "@/lib/storage";
import { PAPER_DURATION_MIN, Difficulty } from "@/lib/grading";

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

  const lessons = await prisma.lesson.findMany({ where: { id: { in: lessonIds } } });
  const durationMin = PAPER_DURATION_MIN[difficulty];

  // Roughly scale question count to duration so harder/longer papers have more content
  const questionCount = difficulty === "EASY" ? 8 : difficulty === "MEDIUM" ? 12 : 16;

  // Papers draw from STRUCTURED (open-ended, worked-answer) questions —
  // a genuinely different question type from quiz MCQs, matching how real
  // exam papers are written.
  const pool = await prisma.question.findMany({
    where: { lessonId: { in: lessonIds }, difficulty, type: "STRUCTURED", status: "APPROVED" },
  });

  if (pool.length < questionCount) {
    return NextResponse.json(
      {
        error: `Not enough approved ${difficulty.toLowerCase()} paper questions for these lessons yet (${pool.length}/${questionCount}). Ask your teacher/admin to approve more.`,
      },
      { status: 409 }
    );
  }

  const picked = shuffle(pool).slice(0, questionCount);

  const pdfBuffer = await generatePaperPdf({
    studentName: user.name,
    grade: user.grade,
    difficulty,
    durationMin,
    lessonTitles: lessons.map((l) => l.title),
    questions: picked.map((q) => ({
      question: q.question,
      modelAnswer: q.modelAnswer || "",
      marks: q.marks,
      diagramUrl: q.diagramUrl,
    })),
  });

  const key = generateKey(`papers/${user.id}`, "pdf");
  await uploadFile(pdfBuffer, key, "application/pdf");

  const paper = await prisma.paper.create({
    data: {
      userId: user.id,
      lessonIds,
      questionIds: picked.map((q) => q.id),
      difficulty,
      durationMin,
      fileUrl: key,
    },
  });

  return NextResponse.json({ id: paper.id });
}
