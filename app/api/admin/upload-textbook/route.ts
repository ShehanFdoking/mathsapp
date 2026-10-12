import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, generateKey } from "@/lib/storage";
import { extractPdfPages, joinPageRange, looksLikeGarbledSinhala } from "@/lib/pdf-extract";
import { ocrPdfPages, isOcrAvailable } from "@/lib/pdf-ocr";
import { segmentTextbookIntoLessons } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as File;
    const grade = Number(form.get("grade"));
    const medium = form.get("medium") as "ENGLISH" | "SINHALA";
    const part = Number(form.get("part") || 1);

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Store the raw PDF
    const key = generateKey(`textbooks/g${grade}-${medium.toLowerCase()}-p${part}`, "pdf");
    await uploadFile(buffer, key, "application/pdf");

    // 2. Extract text per page
    let pages = await extractPdfPages(buffer);

    console.log(`Extracted ${pages.length} pages from PDF`);

    // 2b. For Sinhala uploads, many textbook PDFs use legacy non-Unicode
    // fonts that make normal text extraction come out garbled (see
    // lib/pdf-extract.ts for details). Detect which pages are affected and
    // OCR only those — this keeps well-encoded books fast while still
    // fixing badly-encoded ones. This step is slow (a few seconds per
    // flagged page), so it only runs on pages that actually need it.
    let ocrSkippedWarning: string | null = null;
    if (medium === "SINHALA") {
      const badPages = pages.filter((p) => looksLikeGarbledSinhala(p.text)).map((p) => p.page);
      if (badPages.length > 0) {
        if (await isOcrAvailable()) {
          console.log(`OCR fallback: re-reading ${badPages.length}/${pages.length} Sinhala pages that looked garbled...`);
          const ocrResults = await ocrPdfPages(buffer, badPages);
          pages = pages.map((p) => (ocrResults.has(p.page) ? { ...p, text: ocrResults.get(p.page)! } : p));
        } else {
          ocrSkippedWarning = `${badPages.length} page(s) look like they use a legacy Sinhala font and may extract with garbled text — OCR correction isn't available in this environment (the 'canvas' package failed to install). See README for Windows install notes, or manually edit affected lessons afterward.`;
          console.warn(ocrSkippedWarning);
        }
      }
    }

    // 3. Save textbook record
    const textbook = await prisma.textbook.upsert({
      where: { grade_medium_part: { grade, medium, part } },
      update: { fileUrl: key, pageCount: pages.length },
      create: { grade, medium, part, fileUrl: key, pageCount: pages.length },
    });

    // 4. Ask AI to identify lesson boundaries from the page text
    // Process ALL pages for better lesson detection (was limited to 100 pages)
    const pagesForAI = pages;

    console.log(`Pages available for AI: ${pagesForAI.length}, Total pages: ${pages.length}`);

    const rawBoundaries = await segmentTextbookIntoLessons({ grade, medium, pages: pagesForAI });

    console.log(`AI returned ${rawBoundaries.length} lessons`);
    console.log(`First few lessons:`, rawBoundaries.slice(0, 3));

    // 4b. Validate/clamp what the AI returned — even with a much better
    // prompt, defend against out-of-range or nonsensical page numbers
    // rather than trusting the AI's output blindly. Bad entries are
    // dropped (visible to the admin as fewer lessons than expected,
    // rather than a lesson with garbage/empty content).
    const lessonBoundaries = rawBoundaries
      .filter((lb) => {
        const validRange =
          Number.isInteger(lb.startPage) &&
          Number.isInteger(lb.endPage) &&
          lb.startPage >= 1 &&
          lb.endPage <= pagesForAI.length &&
          lb.startPage <= lb.endPage;
        if (!validRange) {
          console.warn("Dropping lesson with invalid page range from AI segmentation:", lb);
        }
        return validRange && lb.title?.trim();
      })
      .sort((a, b) => a.startPage - b.startPage);

    // 4c. Check for lessons that may be missing between parts
    // Get existing lessons for this grade/medium to find gaps
    const existingLessons = await prisma.lesson.findMany({
      where: { grade, medium },
      orderBy: { order: "asc" },
    });

    // If this is Part 2+ and there are existing lessons, check if current
    // lessons continue from where the previous part left off
    if (part > 1 && existingLessons.length > 0) {
      const lastExistingLesson = existingLessons[existingLessons.length - 1];
      const lastExistingEndPage = lastExistingLesson.endPage;

      // If the first lesson we just extracted starts at a very low page number
      // (like page 1-5) but the textbook likely has more content, there may be
      // a continuation from a previous part that wasn't detected
      if (lessonBoundaries.length > 0 && lessonBoundaries[0].startPage <= 5) {
        console.log(`Part ${part} starts at page ${lessonBoundaries[0].startPage}, checking for lesson continuation from Part ${part - 1}`);
        // The AI will detect the lesson title and handle continuation
        // Admin can review and adjust if needed
      }
    }

    // 5. Create Lesson records with their extracted raw text
    let order = (await prisma.lesson.count({ where: { grade, medium } })) + 1;

    // If we have existing lessons, preserve their order numbers
    // and only assign new order numbers to lessons from this part
    if (existingLessons.length > 0) {
      // Find the maximum order number among existing lessons
      const maxOrder = Math.max(...existingLessons.map((l) => l.order));
      order = maxOrder + 1;
    }

    const created = [];
    for (const lb of lessonBoundaries) {
      const rawText = joinPageRange(pages, lb.startPage, lb.endPage);
      const lesson = await prisma.lesson.create({
        data: {
          grade,
          medium,
          title: lb.title,
          order: order++,
          textbookId: textbook.id,
          startPage: lb.startPage,
          endPage: lb.endPage,
          rawText,
        },
      });
      created.push(lesson);
    }

    return NextResponse.json({
      textbookId: textbook.id,
      lessonsCreated: created.length,
      lessonsDropped: rawBoundaries.length - lessonBoundaries.length,
      ocrSkippedWarning,
    });
  } catch (err: any) {
    console.error("UPLOAD TEXTBOOK ERROR:", err);

    // Check if this is a Gemini quota error
    const quotaErrorMatch = err?.message?.match(/quota|exceeded|rate.?limit/i);
    if (quotaErrorMatch) {
      return NextResponse.json(
        {
          error: "Gemini API quota exceeded. Please wait 30 seconds and try again, or use a different API key. The free tier has limited daily requests.",
          quotaError: true
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: err?.message || "Something went wrong while processing the textbook. Check the server logs for details." },
      { status: 500 }
    );
  }
}
