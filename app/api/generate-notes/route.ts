import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PDFDocument } from "pdf-lib";
import { uploadFile, generateKey, getSignedFileUrl } from "@/lib/storage";

// Merges pre-generated note PDFs for selected lessons
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;
    const { lessonIds } = (await req.json()) as { lessonIds: string[] };

    if (!lessonIds || lessonIds.length === 0) {
      return NextResponse.json({ error: "No lessons selected" }, { status: 400 });
    }

    const lessons = await prisma.lesson.findMany({
      where: { id: { in: lessonIds } },
      orderBy: { order: "asc" }
    });

    if (lessons.length === 0) {
      return NextResponse.json({ error: "No lessons found" }, { status: 404 });
    }

    // Check if any lessons have pre-generated PDF notes
    const lessonsWithPdfs = lessons.filter(l => l.notePdfKey);
    if (lessonsWithPdfs.length === 0) {
      return NextResponse.json({
        error: "None of the selected lessons have notes available yet. Please ask your teacher to generate notes."
      }, { status: 400 });
    }

    console.log(`Merging pre-generated PDFs for ${lessonsWithPdfs.length} lessons`);

    // Fetch and merge pre-generated PDFs
    const merged = await PDFDocument.create();
    for (const lesson of lessonsWithPdfs) {
      try {
        console.log(`Fetching PDF for lesson: ${lesson.title}`);

        // Generate fresh signed URL from the stored S3 key
        const signedUrl = await getSignedFileUrl(lesson.notePdfKey!);

        // Fetch the pre-generated PDF from S3
        const response = await fetch(signedUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }

        const pdfBytes = await response.arrayBuffer();
        const src = await PDFDocument.load(pdfBytes);
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));

        console.log(`Successfully merged PDF for lesson: ${lesson.title}`);
      } catch (pdfError: any) {
        console.error(`Error processing lesson ${lesson.title}:`, pdfError);
        return NextResponse.json(
          { error: `Failed to process lesson "${lesson.title}": ${pdfError.message}` },
          { status: 500 }
        );
      }
    }

    console.log("Saving merged PDF...");
    const finalBytes = Buffer.from(await merged.save());
    console.log(`PDF size: ${finalBytes.length} bytes`);

    // Upload merged PDF to S3 for student
    const key = generateKey(`notes/${user.id}`, "pdf");
    console.log(`Uploading to S3 with key: ${key}`);

    await uploadFile(finalBytes, key, "application/pdf");
    console.log("Upload successful");

    const url = await getSignedFileUrl(key);
    console.log("Generated signed URL");

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Generate notes error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate notes PDF" },
      { status: 500 }
    );
  }
}
