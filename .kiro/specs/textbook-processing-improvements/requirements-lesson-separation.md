# Enhanced Lesson Separation - Detailed Requirements Specification

## 1. Introduction

This document provides detailed requirements for the enhanced lesson separation logic (R1) as part of the Textbook Processing Improvements initiative. The current implementation has critical flaws that result in missed lessons, incorrect page ranges, and improper handling of multi-part textbooks.

### 1.1 Current Issues

1. **Page Limitation**: Only first 100 pages are processed by AI lesson detection
2. **Missing Lessons**: AI fails to detect all lessons in textbooks
3. **Incorrect Page Ranges**: Lesson boundaries don't match actual textbook structure
4. **No Textbook Page Tracking**: PDF page numbers don't align with textbook page numbers
5. **Multi-Part Handling**: Part 2 textbooks aren't recognized as continuations
6. **No Confidence Scoring**: All lessons treated with equal confidence

### 1.2 Scope

This document covers only the lesson separation requirements (R1). Sinhala text handling (R2) and figure-aware question generation (R3) are addressed in separate documents.

## 2. Core Requirements

### 2.1 R1.1: Complete Page Analysis

**Requirement**: Process ALL pages in the PDF, not just the first 100.

**Details**:
- Remove artificial page limit (currently `maxPagesForAI = 100`)
- Send full page-by-page text to AI for lesson detection
- If token limits are exceeded, implement pagination strategy
- Each page must be analyzed regardless of position in book

**Acceptance Criteria**:
- All pages in PDF are processed
- Lesson detection doesn't skip pages based on position
- Token usage is managed via pagination if needed

**Priority**: High

---

### 2.2 R1.2: Textbook Page Number Detection

**Requirement**: Detect and track both PDF page index and textbook page numbers.

**Details**:
- PDF Page Index: Position in current PDF file (1 = first page)
- Textbook Page Number: Number printed in book (may differ)
- Search for patterns in headers/footers:
  - "page N", "Page N", "PAGE N"
  - Standalone numbers at top/bottom of pages
  - Chapter/section numbers that may indicate textbook pages

**Textbook Page Detection Algorithm**:
```
For each page:
  1. Search for explicit "page N" patterns in first/last 500 characters
  2. Extract standalone numbers that look like page numbers
  3. Validate number is in expected range (1 to total pages)
  4. Map PDF page index → textbook page number
```

**Acceptance Criteria**:
- PDF page index recorded for each lesson
- Textbook page number recorded when detectable
- Invalid/unclear page numbers are ignored
- Missing textbook page numbers don't cause errors

**Priority**: High

---

### 2.3 R1.3: Lesson Continuity Detection

**Requirement**: Handle multi-part textbooks by detecting when lessons continue across parts.

**Details**:
- When uploading Part 2 of a textbook, check if lessons continue from Part 1
- If Part 2 starts at PDF page 1 but lesson title matches Part 1's end:
  - Merge as continuation
  - Extend end page to Part 2's end
- AI should detect same lesson titles in consecutive uploads

**Algorithm**:
```
On Part 2 upload:
  1. Get last lesson from Part 1 (by grade + medium)
  2. Compare Part 2's first detected lesson title with Part 1's last lesson
  3. If same title:
     - Extend Part 1 lesson to include Part 2 pages
     - Update textbook page range
  4. If different title:
     - Process Part 2 as new lesson(s)
```

**Acceptance Criteria**:
- Multi-part textbooks are recognized
- Lessons spanning parts are correctly identified
- No duplicate lessons for same content
- Admin can review and merge if AI unsure

**Priority**: High

---

### 2.4 R1.4: Lesson Order Preservation

**Requirement**: Preserve the original textbook order of lessons.

**Details**:
- Lessons must appear in the same order as in the physical textbook
- Table of contents (if present) used for title extraction only
- Page ranges determined by actual appearance order
- No sorting by title or other criteria

**AI Prompt Enhancement**:
```
IMPORTANT: Return lessons in APPEARANCE ORDER.
The first lesson in your output should be the first lesson in the book.
The second lesson should be the second lesson, and so on.
Do NOT sort alphabetically or by any other criteria.
```

**Acceptance Criteria**:
- Lesson order matches textbook order
- Table of contents not used for ordering
- Multiple uploads maintain correct sequence
- Admin can reorder if AI makes error

**Priority**: High

---

### 2.5 R1.5: Confidence Scoring

**Requirement**: Assign confidence scores to each lesson boundary for admin review.

**Confidence Score Range**: 0.0 (low) to 1.0 (high)

**Scoring Factors**:
- Title length and clarity (short generic titles = lower score)
- Page range reasonableness (100+ pages = suspicious)
- Table of contents match (if title appears in TOC = higher score)
- Clear transition between lessons (higher score)
- Page number consistency (lower score if textbook pages don't align)

**Confidence Score Calculation**:
```
baseScore = 1.0

if title.length < 5:
    baseScore -= 0.3

if endPage - startPage > 100:
    baseScore -= 0.2

if detectedFromTableOfContents:
    baseScore += 0.1
else:
    baseScore -= 0.1

if textbookPageNumbersDetected:
    baseScore += 0.05

if transitionPatternDetected:
    baseScore += 0.1

finalScore = clamp(0, 1, baseScore)
```

**Acceptance Criteria**:
- Each lesson has confidence score
- Low-confidence lessons (< 0.7) flagged for review
- Score calculation documented
- Admin interface shows confidence scores

**Priority**: Medium

---

### 2.6 R1.6: No Lesson Dropping

**Requirement**: Ensure all lessons in the textbook are detected.

**Details**:
- Multiple detection strategies to catch missed lessons:
  1. Table of contents parsing
  2. Section header pattern matching
  3. Page number clustering analysis
  4. AI-based title detection
- Cross-validation between strategies
- Fallback mechanisms for edge cases

**Detection Strategy Priority**:
1. Table of contents (most reliable when present)
2. AI-detected lesson titles
3. Header/footer patterns
4. Page clustering (pages with similar content type)

**Acceptance Criteria**:
- All lessons in textbook are detected
- Missing lessons trigger warning
- Admin can add missing lessons manually
- No lessons silently dropped

**Priority**: High

---

## 3. Technical Specifications

### 3.1 Data Model

```typescript
interface LessonBoundary {
  title: string;
  startPdfPage: number;
  endPdfPage: number;
  startTextbookPage?: number;
  endTextbookPage?: number;
  confidence: number;
  detectedBy: 'table_of_contents' | 'ai_detection' | 'header_pattern' | 'page_clustering';
  continuation?: {
    fromPart: number;  // If continuation from another part
    originalLessonId: string;  // ID of original lesson
  };
  textbookPagesDetected: boolean;  // True if textbook page numbers found
}
```

### 3.2 Input

```typescript
interface SegmentTextbookParams {
  grade: number;
  medium: 'ENGLISH' | 'SINHALA';
  part?: number;  // Part number (1 for single-part, >1 for multi-part)
  textbookId?: string;  // Existing textbook ID for continuations
  pages: {
    page: number;  // PDF page index (1-based)
    text: string;  // Extracted text from page
    rawText?: string;  // Raw page text including whitespace
  }[];
}
```

### 3.3 AI Prompt Enhancement

```typescript
const prompt = `You are analyzing a Grade ${grade} maths textbook. ${medium === 'SINHALA' ? 'The textbook is in Sinhala.' : 'The textbook is in English.'}

TEXTBOOK STRUCTURE:
- PDF_PAGE_INDEX = Position in THIS PDF file (1 = first page)
- Textbook may have printed page numbers in headers/footers
- This may be Part ${params.part || 1} of a multi-part textbook

WORK THROUGH THIS METHODICALLY:

1. LOOK FOR TABLE OF CONTENTS:
   - Search for "Contents", "Index", "Lesson List", etc.
   - Extract ALL lesson titles from TOC
   - Record order from TOC

2. SCAN ENTIRE BOOK:
   - Read ALL pages (no page limit)
   - Look for lesson titles anywhere in book
   - Track each lesson's first and last page

3. IDENTIFY LESSON BOUNDARIES:
   - Lesson START = First page with lesson title or content
   - Lesson END = Last page before NEXT lesson starts
   - If no clear boundary, extend to page with header pattern

4. DETERMINE TEXTBOOK PAGE NUMBERS:
   - Look for "page N", "N", etc. in headers/footers
   - Map PDF page → textbook page when possible

5. ASSESS CONFIDENCE:
   - Table of contents match = higher confidence
   - Clear title transitions = higher confidence
   - Ambiguous boundaries = lower confidence

IMPORTANT: Return lessons in APPEARANCE ORDER, not TOC order.

Return ONLY a valid JSON array:
[
  {
    "title": "Lesson Name",
    "startPdfPage": number,
    "endPdfPage": number,
    "startTextbookPage": number | null,
    "endTextbookPage": number | null,
    "confidence": 0.0-1.0,
    "detectedBy": "table_of_contents" | "ai_detection" | "header_pattern"
  }
]`;
```

### 3.4 Error Handling

```typescript
interface SegmentResult {
  boundaries: LessonBoundary[];
  warnings: string[];
  textbookPageDetectionRate: number;  // % of pages with textbook page numbers
}

// Common Warnings
- "Table of contents not detected - using AI detection only"
- "Textbook page numbers not detected in any page"
- "Only ${count} lessons detected - verify complete"
- "Confidence scores below 0.7: ${lessons}"
- "Multi-part textbook detected - verify continuation"
```

---

## 4. Implementation Checklist

### 4.1 Core Logic
- [ ] Remove `maxPagesForAI` limit in `ai.ts`
- [ ] Add textbook page number detection function
- [ ] Implement confidence scoring algorithm
- [ ] Add multi-part continuation detection logic
- [ ] Update AI prompt with enhanced instructions

### 4.2 Testing
- [ ] Test with single-part textbooks (verify all lessons detected)
- [ ] Test with multi-part textbooks (verify continuation handled)
- [ ] Test with textbooks lacking table of contents
- [ ] Test with textbooks having non-standard page numbering
- [ ] Test confidence scoring with edge cases

### 4.3 Integration
- [ ] Update `upload-textbook` API route
- [ ] Update database schema if needed
- [ ] Update admin interface to show confidence scores
- [ ] Add review workflow for low-confidence lessons

---

## 5. Acceptance Test Cases

### TC1: Complete Page Analysis
**Input**: 150-page PDF with lessons on pages 10-25, 80-100, 120-140  
**Expected**: All three lessons detected  
**Pass Criteria**: All pages analyzed, no skipped sections

### TC2: Textbook Page Number Detection  
**Input**: PDF with "page 15" in footer on pages 20-50  
**Expected**: Textbook page numbers mapped  
**Pass Criteria**: Map of PDF → textbook page numbers created

### TC3: Multi-Part Continuation
**Input**: Part 1 (100 pages) + Part 2 (starts at PDF page 1) with same lesson titles  
**Expected**: Lessons merged as continuation  
**Pass Criteria**: Single lesson spans both parts

### TC4: Order Preservation
**Input**: Textbook with lessons A, B, C in that order  
**Expected**: Output order A, B, C (not alphabetical)  
**Pass Criteria**: Order matches textbook

### TC5: Confidence Scoring
**Input**: Lesson with clear TOC match vs ambiguous title  
**Expected**: Higher confidence for TOC match  
**Pass Criteria**: Scores reflect detection reliability

### TC6: No Lesson Dropping
**Input**: Textbook with 10 lessons  
**Expected**: All 10 lessons detected (with warnings if < 10)  
**Pass Criteria**: No lessons silently dropped

---

## 6. Dependencies

- PDF.js for text extraction (already in use)
- AI model for lesson detection (Gemini 3.5 Flash Lite)
- Database schema for lesson storage
- Admin UI for review interface

---

## 7. Future Enhancements

- OCR-based page number detection for scanned textbooks
- Machine learning model trained on Sri Lankan textbooks
- User feedback loop to improve confidence scoring
- Batch processing for multiple textbooks
- Preview of detected lessons before final save

---

## 8. References

- Main Requirements: `requirements.md`
- Design Document: `design.md`
- Tasks: `tasks.md`
- AI Implementation: `lib/ai.ts`
- PDF Extraction: `lib/pdf-extract.ts`