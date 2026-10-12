import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQuestionBank } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId, difficulty, type, count } = (await req.json()) as {
      lessonId: string;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      type: "MCQ" | "STRUCTURED";
      count: number;
    };

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    const questions = await generateQuestionBank({
      grade: lesson.grade,
      medium: lesson.medium,
      difficulty,
      type,
      lessonTitle: lesson.title,
      lessonText: lesson.rawText || lesson.smartNote || "",
      totalCount: count,
      batchSize: 10,
      onBatch: async (batch) => {
        await prisma.question.createMany({
          data: batch.map((q) => ({
            lessonId: lesson.id,
            grade: lesson.grade,
            medium: lesson.medium,
            difficulty,
            type,
            question: q.question,
            options: q.options ?? undefined,
            answerIndex: q.answerIndex,
            modelAnswer: q.modelAnswer,
            explanation: q.explanation,
            hint: q.hint,
            marks: q.marks,
            status: "PENDING",
            diagramUrl: q.diagramUrl ?? undefined,
          })),
        });
      },
    });

    return NextResponse.json({ generated: questions.length });
  } catch (err: any) {
    console.error("GENERATE QUESTION BANK ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate questions. Check server logs." },
      { status: 500 }
    );
  }
}
