import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatAboutLesson } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const { lessonId, question } = await req.json();

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const priorMessages = await prisma.chatMessage.findMany({
    where: { userId, lessonId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const answer = await chatAboutLesson({
    lessonTitle: lesson.title,
    grade: lesson.grade,
    medium: lesson.medium,
    lessonContext: lesson.rawText || lesson.smartNote || "",
    history: priorMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    question,
  });

  await prisma.chatMessage.createMany({
    data: [
      { userId, lessonId, role: "user", content: question },
      { userId, lessonId, role: "assistant", content: answer },
    ],
  });

  return NextResponse.json({ answer });
}
