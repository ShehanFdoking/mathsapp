import { GoogleGenAI } from "@google/genai";
import { createDiagramInstructionForAI } from "./image-generator";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Model selection based on task requirements and availability
// Using gemini-3.1-flash-lite for all tasks (fast and cost-effective)
const LESSON_SEPARATION_MODEL = "gemini-3.1-flash-lite";
const MAIN_MODEL = "gemini-3.1-flash-lite";

// Extract textbook page ranges by looking for patterns like "page 15", "page i", etc.
function extractTextbookPageRanges(pages: { page: number; text: string }[]): {
  info: string;
  textbookPageMap: Map<number, number>;
} {
  const textbookPageMap = new Map<number, number>();
  const ranges: string[] = [];

  for (const p of pages) {
    // Look for patterns like "page 15", "page i", "page xi", etc.
    const pageMatch = p.text.match(/(?:page\s*)?(\d+|[ivxIVX]+)\s*(?:of\s*\d+)?/i);
    if (pageMatch) {
      // Try to parse as number
      const pageStr = pageMatch[1];
      const pageNum = parseInt(pageStr);

      if (!isNaN(pageNum) && pageNum > 0 && pageNum < 10000) {
        // Likely a valid textbook page number
        textbookPageMap.set(p.page, pageNum);
      }
    }
  }

  if (textbookPageMap.size > 0) {
    const minPage = Math.min(...textbookPageMap.values());
    const maxPage = Math.max(...textbookPageMap.values());
    ranges.push(`Detected textbook pages: ${minPage} to ${maxPage}`);
  } else {
    ranges.push("No textbook page numbers detected in text.");
  }

  return {
    info: ranges.join("\n"),
    textbookPageMap,
  };
}

function extractJson(text: string): string {
  // Remove markdown code fences
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // Try to find JSON array or object in the text
  // Look for the first [ and match to the last ]
  const startIdx = cleaned.indexOf("[");
  if (startIdx !== -1) {
    // Find matching closing bracket
    let bracketCount = 0;
    let endIdx = -1;
    for (let i = startIdx; i < cleaned.length; i++) {
      if (cleaned[i] === "[") bracketCount++;
      if (cleaned[i] === "]") {
        bracketCount--;
        if (bracketCount === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx !== -1) {
      return cleaned.substring(startIdx, endIdx + 1);
    }
  }

  // Fallback: try to find { }
  const objStart = cleaned.indexOf("{");
  if (objStart !== -1) {
    let braceCount = 0;
    let endIdx = -1;
    for (let i = objStart; i < cleaned.length; i++) {
      if (cleaned[i] === "{") braceCount++;
      if (cleaned[i] === "}") {
        braceCount--;
        if (braceCount === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx !== -1) {
      return cleaned.substring(objStart, endIdx + 1);
    }
  }

  return cleaned;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * PHASE 2 — AI understands the book.
 * Splits a textbook's full page-by-page text into lessons (title + page
 * range), since textbooks aren't uniformly structured and may span
 * multiple uploaded parts.
 * 
 * Uses Gemini 3.5 Flash Lite for cost-efficient lesson detection.
 */
export async function segmentTextbookIntoLessons(params: {
  grade: number;
  medium: "ENGLISH" | "SINHALA";
  pages: { page: number; text: string }[];
}): Promise<{ title: string; startPage: number; endPage: number }[]> {
  const { grade, medium, pages } = params;
  const langNote = medium === "SINHALA" ? "The textbook is in Sinhala." : "The textbook is in English.";

  // Calculate actual textbook page range by scanning for page numbers
  const textbookPages = extractTextbookPageRanges(pages);

  // Send much more of each page than before (was 300 chars — too little to
  // reliably reach the actual heading text past headers/decorative framing
  // on a page). Gemini's context window comfortably fits this even for a
  // 200+ page book.
  const digest = pages
    .map((p) => `=== PDF_PAGE_INDEX ${p.page} ===\n${p.text.slice(0, 1000)}`)
    .join("\n\n");

  const prompt = `This is page-by-page text extracted from a Grade ${grade} maths textbook. ${langNote}
Each page below is labelled "=== PDF_PAGE_INDEX N ===" — that N is the page's actual position in this PDF file (1 = first page of the file).

IMPORTANT PAGE NUMBER LOGIC:
1. PDF_PAGE_INDEX = Physical page position in THIS PDF FILE (1 = first page)
2. Textbook page numbers (if visible) = Numbers appearing in footers/headers like "page 15" or "112"
3. ALWAYS return PDF_PAGE_INDEX values, NOT printed page numbers.

${textbookPages.info}

WORK THROUGH THIS SYSTEMATICALLY:

1. SCAN FOR TABLE OF CONTENTS: Look for "Contents", "Index", "Table of Contents", or similar sections
   - Extract all lesson names from TOC
   - Note the order they appear

2. FIND ACTUAL LESSON TITLES: Scan each page for lesson headers
   - Look for numbered lessons like "Lesson 1", "Unit 1", "Chapter 1"
   - Look for descriptive titles followed by explanation/examples
   - Ignore cover pages, copyright pages, TOC pages

3. TRACK ORDER: List lessons in the order they appear in the textbook
   - Preserve the original textbook structure
   - Don't skip any lessons

4. DETERMINE ENDS: For each lesson, determine where it ends
   - Lesson ends when NEXT lesson title appears
   - OR at the end of available pages
   - OR when a new section starts (e.g., "Exercises", "Summary")

5. MAP TO TEXTBOOK PAGES: If textbook page numbers are visible, map them
   - This helps when PDF page numbers don't match textbook numbering
   - Example: PDF page 1-10 might be textbook pages i-x (intro), PDF 11-145 might be textbook pages 1-135

6. HANDLE MULTI-PART TEXTBOOKS: If this is Part 2+
   - Check if lessons continue from Part 1
   - Same lesson title = same lesson continuation
   - Admin can review and adjust later

7. VERIFY COMPLETENESS: Check all lessons from TOC are accounted for
   - If TOC has 10 lessons but only 8 found, flag missing ones
   - Ensure no lessons are skipped

IMPORTANT: 
- Use the table of contents ONLY to identify lesson names
- Always use PDF_PAGE_INDEX values from the "=== PDF_PAGE_INDEX N ===" markers
- If textbook pages are 1-145 but PDF has 150 pages, the extra 5 may be back cover/appendix
- Be thorough - don't miss any lessons

${digest}

Return ONLY a valid JSON array (no markdown fences): [{ "title": string, "startPage": number, "endPage": number }]`;

  // Use retry logic for rate limits
  const response = await retryWithBackoff(
    async () => await ai.models.generateContent({
      model: LESSON_SEPARATION_MODEL,
      contents: prompt,
    }),
    3, // max retries
    5000 // initial delay 5 seconds (longer for larger requests)
  );

  try {
    const extracted = extractJson(response.text || "");
    return JSON.parse(extracted);
  } catch (parseError) {
    console.error("Lesson segmentation JSON parse failed, raw response:", response.text?.slice(0, 500));
    // Try with control character removal
    try {
      const text = response.text || "";
      const jsonStr = text
        .replace(/[\x00-\x1F\x7F]/g, " ")
        .replace(/,\s*]/g, "]")
        .replace(/,\s*}/g, "}");
      return JSON.parse(jsonStr);
    } catch {
      throw new Error(`Failed to parse lesson segmentation JSON: ${parseError}`);
    }
  }
}

/**
 * Student-facing "smart note" for a lesson, grounded in the actual
 * textbook text (including its worked examples).
 * 
 * Uses Gemini 2.5 Pro for better educational content generation.
 */
export async function generateSmartNote(params: {
  lessonTitle: string;
  grade: number;
  medium: "ENGLISH" | "SINHALA";
  textbookText: string;
}) {
  const { lessonTitle, grade, medium, textbookText } = params;
  const langInstruction = medium === "SINHALA" ? "Write the note in Sinhala." : "Write the note in English.";

  const prompt = `You are a maths teacher writing study notes for a Grade ${grade} student.
Lesson: "${lessonTitle}".
${langInstruction}

Base the note strictly on the following textbook excerpt:
---
${textbookText.slice(0, 8000)}
---

Produce a clear note with:
1. Short concept explanation
2. Key formulas highlighted
3. 2-3 worked examples
4. Common mistakes section

Return Markdown only.`;

  // Use Gemini 2.5 Pro for better note generation
  const response = await ai.models.generateContent({ model: MAIN_MODEL, contents: prompt });
  return response.text || "";
}

/**
 * Chatbot answer for a student's question about a specific lesson.
 * 
 * Uses Gemini 2.5 Pro for better conversational responses.
 */
export async function chatAboutLesson(params: {
  lessonTitle: string;
  grade: number;
  medium: "ENGLISH" | "SINHALA";
  lessonContext: string;
  history: { role: "user" | "assistant"; content: string }[];
  question: string;
}) {
  const { lessonTitle, grade, medium, lessonContext, history, question } = params;
  const langInstruction = medium === "SINHALA" ? "Reply in Sinhala." : "Reply in English.";

  const systemInstruction = `You are a patient, encouraging Grade ${grade} maths tutor helping with the lesson "${lessonTitle}".
${langInstruction} Keep answers simple, use step-by-step explanations, and stay grounded in this lesson's textbook content:
---
${lessonContext.slice(0, 8000)}
---
If the student asks something unrelated to this lesson, gently redirect them back to it.`;

  const geminiHistory = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = ai.chats.create({
    model: MAIN_MODEL,
    config: { systemInstruction },
    history: geminiHistory,
  });

  const result = await chat.sendMessage({ message: question });
  return result.text || "";
}

export type QuestionType = "MCQ" | "STRUCTURED";

// MCQ (quiz) questions have options + answerIndex + explanation.
// STRUCTURED (paper/exam) questions are open-ended — no options; marked
// against a modelAnswer (the full worked solution / marking scheme) instead.
export type GeneratedQuestion = {
  question: string;
  options: [string, string, string, string] | null;
  answerIndex: number | null;
  modelAnswer: string | null;
  explanation: string | null;
  hint: string;
  marks: number;
  diagramUrl?: string | null;
};

const DIFFICULTY_GUIDE: Record<string, string> = {
  EASY: "direct application of a single concept from the lesson, minimal steps, straightforward wording",
  MEDIUM: "combine 1-2 concepts from the lesson, moderate number of steps, some interpretation required",
  HARD: "multi-step problem solving that may combine multiple concepts from the lesson, requires deeper reasoning",
};

/**
 * PHASE 3 — AI generates questions for one lesson at one difficulty and
 * ONE type. Called in batches by the admin "generate question bank" route,
 * since asking for e.g. 100 questions in a single call risks hitting
 * output-length/rate limits.
 *
 * type "MCQ": quiz-style — 4 options, one correct answerIndex, a
 * step-by-step explanation of the correct answer.
 *
 * type "STRUCTURED": exam-paper style — an open-ended question the student
 * would write working for on paper, with a full modelAnswer (the marking
 * scheme / expected working) instead of multiple-choice options. This is
 * a genuinely different content type from MCQs, not just a different
 * presentation of the same question — real exam papers are mostly
 * structured, worked questions, not multiple choice.
 */
/**
 * Extract text between delimiters like ---KEY--- and next ---
 */
function extractDelimited(text: string, key: string): string {
  const startMarker = `---${key}---`;
  const start = text.indexOf(startMarker);
  if (start === -1) return "";

  const contentStart = start + startMarker.length;
  const nextMarker = text.indexOf("---", contentStart);

  if (nextMarker === -1) {
    return text.substring(contentStart).trim();
  }

  return text.substring(contentStart, nextMarker).trim();
}

/**
 * Parse questions from the delimiter-based text format
 */
function parseQuestionsFromText(text: string, type: QuestionType): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];

  // Split by question delimiters
  const questionBlocks = text.split("---QUESTION START---");

  for (const block of questionBlocks) {
    if (!block.includes("---QUESTION END---")) continue;

    try {
      const content = block.split("---QUESTION END---")[0];

      if (type === "MCQ") {
        const question = extractDelimited(content, "QUESTION");
        const optionA = extractDelimited(content, "OPTION_A");
        const optionB = extractDelimited(content, "OPTION_B");
        const optionC = extractDelimited(content, "OPTION_C");
        const optionD = extractDelimited(content, "OPTION_D");
        const answerText = extractDelimited(content, "ANSWER");
        const explanation = extractDelimited(content, "EXPLANATION");
        const hint = extractDelimited(content, "HINT");
        const marksText = extractDelimited(content, "MARKS");

        if (question && optionA && optionB && optionC && optionD && answerText) {
          const answerMap: Record<string, number> = { "A": 0, "B": 1, "C": 2, "D": 3 };
          const answerIndex = answerMap[answerText.trim().toUpperCase()] ?? 0;

          questions.push({
            question,
            options: [optionA, optionB, optionC, optionD],
            answerIndex,
            modelAnswer: null,
            explanation: explanation || "",
            hint: hint || "Think about the key concept",
            marks: parseInt(marksText || "1") || 1,
          });
        }
      } else {
        const question = extractDelimited(content, "QUESTION");
        const modelAnswer = extractDelimited(content, "MODEL_ANSWER");
        const hint = extractDelimited(content, "HINT");
        const marksText = extractDelimited(content, "MARKS");

        if (question && modelAnswer) {
          questions.push({
            question,
            options: null,
            answerIndex: null,
            modelAnswer,
            explanation: null,
            hint: hint || "Review the key steps",
            marks: parseInt(marksText || "2") || 2,
          });
        }
      }
    } catch (error) {
      console.error("Error parsing question block:", error);
      continue;
    }
  }

  return questions;
}

/**
 * Retry helper with exponential backoff for API rate limits
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit or high demand error
      const is503 = error?.status === 503 || error?.message?.includes("high demand");
      const is429 = error?.status === 429 || error?.message?.includes("rate limit");

      if ((is503 || is429) && attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`API rate limit hit. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export async function generateQuestionBatch(params: {
  grade: number;
  medium: "ENGLISH" | "SINHALA";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  type: QuestionType;
  lessonTitle: string;
  lessonText: string;
  count: number;
  avoidQuestions?: string[];
}): Promise<GeneratedQuestion[]> {
  const { grade, medium, difficulty, type, lessonTitle, lessonText, count, avoidQuestions } = params;
  const langInstruction = medium === "SINHALA" ? "Write everything in Sinhala." : "Write everything in English.";

  const avoidBlock =
    avoidQuestions && avoidQuestions.length
      ? `\nDo NOT repeat or closely rephrase any of these already-created questions:\n${avoidQuestions
        .slice(-40)
        .map((q, i) => `${i + 1}. ${q}`)
        .join("\n")}\n`
      : "";

  let prompt: string;

  if (type === "MCQ") {
    prompt = `You are an expert Grade ${grade} maths teacher and exam setter, working strictly from the lesson content below.
Lesson: "${lessonTitle}"
Difficulty: ${difficulty} — ${DIFFICULTY_GUIDE[difficulty]}
${langInstruction}
${avoidBlock}

Lesson content (textbook-grounded — base every question on this):
---
${lessonText.slice(0, 8000)}
---

${createDiagramInstructionForAI()}

IMPORTANT INSTRUCTIONS:
1. Create questions that directly test understanding of the lesson material
2. For geometry questions, include [DIAGRAM: ...] with clear description
3. Ensure diagram descriptions are detailed enough for image generation
4. Make questions challenging but fair for ${difficulty.toLowerCase()} difficulty

Generate exactly ${count} multiple-choice questions.

For EACH question, use this EXACT format (do NOT deviate):
---QUESTION START---
<the question text here>
---QUESTION---
<repeat the question text>
---OPTION_A---
<option A text>
---OPTION_B---
<option B text>
---OPTION_C---
<option C text>
---OPTION_D---
<option D text>
---ANSWER---
<A or B or C or D - which is correct>
---EXPLANATION---
<clear step-by-step explanation>
---HINT---
<short hint without revealing answer>
---MARKS---
${difficulty === "EASY" ? "1" : difficulty === "MEDIUM" ? "2" : "3"}
---QUESTION END---

Start now:`;
  } else {
    prompt = `You are an expert Grade ${grade} maths teacher and exam setter, working strictly from the lesson content below.
Lesson: "${lessonTitle}"
Difficulty: ${difficulty} — ${DIFFICULTY_GUIDE[difficulty]}
${langInstruction}
${avoidBlock}

Lesson content (textbook-grounded — base every question on this):
---
${lessonText.slice(0, 8000)}
---

${createDiagramInstructionForAI()}

IMPORTANT INSTRUCTIONS:
1. Create questions that directly test understanding of the lesson material
2. For geometry questions, include [DIAGRAM: ...] with clear description
3. Ensure diagram descriptions are detailed enough for image generation
4. Make questions challenging but fair for ${difficulty.toLowerCase()} difficulty

Generate exactly ${count} open-ended, structured exam questions.

For EACH question, use this EXACT format (do NOT deviate):
---QUESTION START---
<the question text here>
---QUESTION---
<repeat the question text>
---MODEL_ANSWER---
<complete worked solution / marking scheme>
---HINT---
<short hint without revealing answer>
---MARKS---
${difficulty === "EASY" ? "1-2" : difficulty === "MEDIUM" ? "2-4" : "4-8"}
---QUESTION END---

Start now:`;
  }

  // Request response with retry logic for rate limits
  const response = await retryWithBackoff(
    async () => await ai.models.generateContent({
      model: MAIN_MODEL,
      contents: prompt,
    }),
    3, // max retries
    3000 // initial delay 3 seconds
  );

  const rawText = response.text || "";
  const questions = parseQuestionsFromText(rawText, type);

  return questions;
}

/**
 * Generates `totalCount` questions of one type for a lesson+difficulty in
 * safe-sized batches (to stay under output-token and rate limits), pausing
 * briefly between calls. Returns the full combined list.
 */
export async function generateQuestionBank(params: {
  grade: number;
  medium: "ENGLISH" | "SINHALA";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  type: QuestionType;
  lessonTitle: string;
  lessonText: string;
  totalCount: number;
  batchSize?: number;
  onBatch?: (batch: GeneratedQuestion[]) => Promise<void>;
}): Promise<GeneratedQuestion[]> {
  const batchSize = params.batchSize ?? 10;
  const all: GeneratedQuestion[] = [];

  for (let generated = 0; generated < params.totalCount; generated += batchSize) {
    const count = Math.min(batchSize, params.totalCount - generated);

    console.log(`Generating batch ${Math.floor(generated / batchSize) + 1}/${Math.ceil(params.totalCount / batchSize)}...`);

    const batch = await generateQuestionBatch({
      grade: params.grade,
      medium: params.medium,
      difficulty: params.difficulty,
      type: params.type,
      lessonTitle: params.lessonTitle,
      lessonText: params.lessonText,
      count,
      avoidQuestions: all.map((q) => q.question),
    });

    all.push(...batch);
    if (params.onBatch) await params.onBatch(batch);

    // Longer delay between batches to respect API rate limits
    if (generated + batchSize < params.totalCount) {
      console.log("Waiting 5 seconds before next batch to respect API limits...");
      await sleep(5000);
    }
  }

  return all;
}
