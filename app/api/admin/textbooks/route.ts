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
  const grade = Number(searchParams.get("grade"));
  const medium = searchParams.get("medium") as "ENGLISH" | "SINHALA";

  const textbooks = await prisma.textbook.findMany({
    where: { grade, medium },
    orderBy: { part: "asc" },
    include: { _count: { select: { lessons: true } } },
  });

  return NextResponse.json(textbooks);
}
