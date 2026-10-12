import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedFileUrl } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paper = await prisma.paper.findUnique({ where: { id: params.id } });
  if (!paper || paper.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = await getSignedFileUrl(paper.fileUrl);
  return NextResponse.redirect(url);
}
