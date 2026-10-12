# Textbook Processing Improvements - Design

## Overview
This document outlines the technical design for addressing the three requirements: improved lesson separation, Sinhala text handling, and figure-aware question generation.

## Model Configuration

### Gemini 3.1 Flash-Lite
- **Use case:** All AI operations (lesson segmentation, question generation, notes, chat)
- **Why:** Current available free tier model, cost-efficient, optimized for low latency
- **Model name:** `gemini-3.1-flash-lite`
- **Note:** Updated from Gemini 2.5 Flash due to model deprecation (no longer available to new users)

## D1: Enhanced Lesson Segmentation

### Current Approach
```typescript
// lib/ai.ts - REMOVED (now uses all pages)
const maxPagesForAI = 100; // Only first 100 pages
const pagesForAI = pages.slice(0, maxPagesForAI);
```

### Proposed Design

#### 1. Remove Page Limit
```typescript
// Remove maxPagesForAI limit - send all pages to AI
export async function segmentTextbookIntoLessons({
  grade,
  medium,
  pages,
}: {
  grade: number;
  medium: "ENGLISH" | "SINHALA";
  pages: { page: number; text: string }[];
}): Promise<LessonBoundary[]> {
  // Send all pages (or use pagination if token limits are hit)
  const digest = pages
    .map((p) => `=== PDF_PAGE_INDEX ${p.page} ===\n${p.text.slice(0, 1000)}`)
    .join("\n\n");
  // ... AI processing
}
```

#### 2. Textbook Page Number Detection
```typescript
// Extract textbook page numbers from PDF pages
function extractTextbookPageNumbers(
  pages: { page: number; text: string }[]
): Map<number, number> {
  const textbookPageMap = new Map<number, number>();
  
  for (const p of pages) {
    // Look for patterns like "page 15", "112", etc. in footers/headers
    const textbookPageMatch = p.text.match(/page\s*(\d+)/i) || 
                              p.text.match(/\b(\d{1,3})\s*$/);
    if (textbookPageMatch) {
      const textbookPage = parseInt(textbookPageMatch[1]);
      textbookPageMap.set(p.page, textbookPage);
    }
  }
  
  return textbookPageMap;
}
```

#### 3. Confidence Scoring
```typescript
interface LessonBoundary {
  title: string;
  startPdfPage: number;
  endPdfPage: number;
  startTextbookPage?: number; // If detected
  endTextbookPage?: number;   // If detected
  confidence: number;         // 0-1 score
  detectedBy: string;         // "table_of_contents", "header_pattern", etc.
}

function calculateConfidence(
  boundary: any,
  pages: { page: number; text: string }[]
): number {
  let score = 1.0;
  
  // Lower score if title is too short
  if (boundary.title.length < 5) score -= 0.3;
  
  // Lower score if page range seems too large
  if (boundary.endPage - boundary.startPage > 100) score -= 0.2;
  
  // Lower score if no clear transition detected
  // ... additional heuristics
  
  return Math.max(0, score);
}
```

#### 4. Multi-Part Continuation Detection
```typescript
async function detectLessonContinuation(
  grade: number,
  medium: "ENGLISH" | "SINHALA",
  newLessons: LessonBoundary[]
): Promise<LessonBoundary[]> {
  const existingLessons = await prisma.lesson.findMany({
    where: { grade, medium },
    orderBy: { order: "asc" },
  });

  if (existingLessons.length === 0) return newLessons;

  // Check if first new lesson matches last existing lesson's end
  const lastExisting = existingLessons[existingLessons.length - 1];
  const firstNew = newLessons[0];

  // If new lesson starts at very low page, check for continuation
  if (firstNew.startPdfPage <= 5) {
    // AI should detect same lesson title - handle continuation
    // Admin can review and merge if needed
  }

  return newLessons;
}
```

#### 5. Enhanced AI Prompt
```typescript
const prompt = `This is page-by-page text from a Grade ${grade} maths textbook.

IMPORTANT INSTRUCTIONS:
1. Read ENTIRE textbook (all pages provided)
2. Find ALL lesson titles (not "Contents" or "Index" pages)
3. Track lessons in APPEARANCE ORDER
4. For each lesson, find:
   - START: First page with lesson title or content
   - END: Last page before next lesson starts (or end of book)

TEXTBOOK PAGE NUMBERS:
- PDF_PAGE_INDEX = Position in THIS PDF file (1 = first page)
- Textbook may have printed page numbers in footers - record these too

MULTI-PART TEXTBOOKS:
- If this is Part 2+, lessons may continue from Part 1
- AI will detect lesson titles - same title = same lesson continuation

Return JSON array with confidence scores:
[
  {
    "title": "Lesson Name",
    "startPdfPage": 5,
    "endPdfPage": 20,
    "confidence": 0.9,
    "detectedBy": "table_of_contents"
  }
]`;
```

## D2: Sinhala Text Pipeline

### Current Approach
```typescript
// PDF extraction uses Unicode detection
export function looksLikeGarbledSinhala(text: string, threshold = 0.15): boolean {
  return sinhalaUnicodeRatio(text) < threshold;
}
```

### Proposed Design

#### 1. Enhanced OCR Configuration
```typescript
// Update tesseract.js to use better Sinhala model
async function ocrPdfPagesEnhanced(
  fileBuffer: Buffer,
  pageNumbers: number[]
): Promise<Map<number, string>> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("sin+eng", "tessdata", {
    // Better configuration for Sinhala
    tessedit_char_whitelist: "ඞශෂළෆක්‌්ළතථදධනපබමයරලවශසහළ්�ඤඥඤාිීුූෙේෛොෝෞෘෲෳ්ාැෑුූෘෲෳ්ාැෑ", // Sinhala characters
    tessedit_pages_seg_mode: Tesseract.PSM.SINGLE_BLOCK,
  });
  
  // ... OCR processing
}
```

#### 2. Canvas Fallback Strategy
```typescript
// In upload-textbook/route.ts
let ocrSkippedWarning: string | null = null;

if (medium === "SINHALA") {
  const badPages = pages.filter((p) => looksLikeGarbledSinhala(p.text));
  
  if (badPages.length > 0) {
    if (await isOcrAvailable()) {
      // Use OCR
      const ocrResults = await ocrPdfPages(buffer, badPages);
      pages = pages.map((p) => 
        ocrResults.has(p.page) 
          ? { ...p, text: ocrResults.get(p.page)! }
          : p
      );
    } else {
      // Canvas not available - warn but continue
      ocrSkippedWarning = `OCR unavailable. ${badPages.length} page(s) may have garbled Sinhala text. 
      Install canvas package: npm install canvas@2.11.2
      See OCR-SETUP-WINDOWS.md for Windows instructions.`;
    }
  }
}
```

#### 3. Database UTF-8 Validation
```sql
-- Check schema uses UTF-8
ALTER TABLE lessons MODIFY title VARCHAR(255) 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
  
ALTER TABLE lessons MODIFY rawText TEXT 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

#### 4. Frontend Sinhala Font Support
```css
/* app/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;500;700&display=swap');

.sinhala-font {
  font-family: 'Noto Sans Sinhala', 'FM Abhaya', sans-serif;
}

/* Ensure proper rendering */
body {
  font-display: swap;
}
```

#### 5. Text Encoding Validation
```typescript
function validateSinhalaEncoding(text: string): boolean {
  // Check for proper Sinhala Unicode
  const sinhalaPattern = /[\u0D80-\u0DFF]+/;
  
  // Check for garbled patterns (Latin characters where Sinhala expected)
  const garbledPattern = /[a-zA-Z]{3,}[^a-zA-Z]*[a-zA-Z]{3,}/;
  
  if (sinhalaPattern.test(text)) return true; // Proper Unicode
  if (garbledPattern.test(text)) return false; // Garbled
  
  return true; // Default to OK
}
```

## D3: Figure-Aware Question Generation

### Current Approach
```typescript
// In ai.ts - basic figure handling
const prompt = `...IMPORTANT INSTRUCTIONS:...For questions involving figures, describe them clearly in words...`;
```

### Proposed Design

#### 1. Figure Detection in PDF
```typescript
function detectFiguresInPage(pageText: string, pageNum: number): Figure[] {
  const figures: Figure[] = [];
  
  // Pattern 1: "Figure 1", "Fig. 1", etc.
  const figPattern1 = /figure\s*(\d+)|fig\.\s*(\d+)/gi;
  let match;
  while ((match = figPattern1.exec(pageText)) !== null) {
    figures.push({
      id: parseInt(match[1] || match[2]),
      page: pageNum,
      type: "diagram",
      position: match.index,
    });
  }
  
  // Pattern 2: Captions with "Figure" nearby
  const captionPattern = /caption.*:.*figure/gi;
  // ... additional detection logic
  
  return figures;
}

interface Figure {
  id: number;
  page: number;
  type: "diagram" | "graph" | "chart" | "geometry" | "unknown";
  description?: string; // Will be filled by AI
}
```

#### 2. Enhanced Question Generation Prompt
```typescript
const prompt = `You are an expert Grade ${grade} maths teacher and exam setter.

Lesson: "${lessonTitle}"
Difficulty: ${difficulty}

IMPORTANT INSTRUCTIONS FOR FIGURES:
1. If your question references a figure, you MUST describe it in full detail
2. The description should be self-contained - students should understand the figure from text alone
3. Format: "As shown in Figure [X], [detailed description]..."
4. For geometry figures: describe shapes, angles, labels, measurements
5. For graphs: describe axes, scales, data points, trends
6. For diagrams: describe components, labels, relationships

EXAMPLES:
Bad: "In the figure above..." (no figure reference)
Good: "In Figure 1, a right triangle ABC is shown with angle B = 90 degrees, AB = 5cm, BC = 12cm. What is the length of AC?"

Bad: "Refer to the graph..." (no description)
Good: "Figure 2 shows a line graph with x-axis labeled 'Time (hours)' from 0 to 10, and y-axis labeled 'Distance (km)' from 0 to 100. The line shows linear growth from (0,0) to (10,100). What is the speed?"

${typeInstruction}

Return JSON with figure descriptions embedded in questions.`;
```

#### 3. Question Validation
```typescript
function validateQuestionAgainstFigure(
  question: GeneratedQuestion,
  figures: Figure[]
): boolean {
  // Check if question mentions figures
  const figureMentions = question.question.match(/figure|fig\.\s*\d+/gi);
  
  if (!figureMentions) return true; // No figures mentioned, OK
  
  // If figures mentioned, check if they're properly described
  // This is a simplified check - would need more sophisticated analysis
  
  // Check for "As shown in Figure" pattern
  const properReferencePattern = /as shown in figure|in figure \d+|figure \d+ shows/gi;
  
  if (properReferencePattern.test(question.question)) {
    // Question likely has proper figure description
    return true;
  }
  
  // Flag for review
  console.warn("Question may reference figure without description:", question.question);
  return false;
}
```

#### 4. Question UI Enhancement
```typescript
// In admin/questions/[lessonId]/page.tsx
function QuestionCard({ question, figures }: { question: Question, figures: Figure[] }) {
  const hasFigure = question.question.match(/figure|fig\.\s*\d+/gi);
  
  return (
    <div className="question-card">
      <div className="question-content">{question.question}</div>
      
      {hasFigure && (
        <div className="figure-notice">
          ⚠️ This question references a figure. Verify the description is complete.
        </div>
      )}
      
      {hasFigure && (
        <div className="figure-preview">
          {figures.map(fig => (
            <div key={fig.id}>Figure {fig.id}: {fig.description}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Implementation Plan

### Phase 1: Enhanced Lesson Segmentation
1. Remove `maxPagesForAI` limit
2. Add textbook page number detection
3. Update AI prompt with multi-part handling
4. Add confidence scoring

### Phase 2: Sinhala Text Pipeline
1. Enhance OCR configuration
2. Update database schema for UTF-8
3. Add frontend font support
4. Implement text encoding validation

### Phase 3: Figure Handling
1. Add figure detection to PDF extraction
2. Update question generation prompts
3. Add question validation
4. Update UI for figure notices

## Files to Modify

### Core Logic
- `lib/ai.ts` - Enhanced lesson segmentation, figure-aware prompts
- `lib/pdf-extract.ts` - Textbook page number detection, figure detection
- `lib/pdf-ocr.ts` - Enhanced OCR configuration

### API Routes
- `app/api/admin/upload-textbook/route.ts` - Remove page limit, add warnings

### Frontend
- `app/globals.css` - Sinhala font support
- `app/admin/questions/[lessonId]/page.tsx` - Question UI with figure notices
