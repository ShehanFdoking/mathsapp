import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, edits } = body as {
    action: "approve" | "reject";
    edits?: {
      question?: string;
      options?: string[];
      answerIndex?: number;
      modelAnswer?: string;
      explanation?: string;
      hint?: string;
      marks?: number;
      diagramUrl?: string | null;
    };
  };

  const question = await prisma.question.update({
    where: { id: params.id },
    data: {
      ...(edits?.question !== undefined && { question: edits.question }),
      ...(edits?.options !== undefined && { options: edits.options }),
      ...(edits?.answerIndex !== undefined && { answerIndex: edits.answerIndex }),
      ...(edits?.modelAnswer !== undefined && { modelAnswer: edits.modelAnswer }),
      ...(edits?.explanation !== undefined && { explanation: edits.explanation }),
      ...(edits?.hint !== undefined && { hint: edits.hint }),
      ...(edits?.marks !== undefined && { marks: edits.marks }),
      ...(edits?.diagramUrl !== undefined && { diagramUrl: edits.diagramUrl }),
      status: action === "approve" ? "APPROVED" : "REJECTED",
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json(question);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.question.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
