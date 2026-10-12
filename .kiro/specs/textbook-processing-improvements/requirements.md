# Textbook Processing Improvements - Requirements

## Model Configuration

### Gemini 3.1 Flash-Lite
- **Use case:** Lesson segmentation, question generation, smart notes, chat responses
- **Why:** Current available free tier model, cost-efficient, optimized for low latency
- **Model name:** `gemini-3.1-flash-lite`
- **Note:** Updated from Gemini 2.5 Flash due to model deprecation (no longer available to new users)
- **Files:** `lib/ai.ts` - `segmentTextbookIntoLessons`, `generateQuestionBatch`, `generateSmartNote`, `chatAboutLesson`

## Overview
This spec addresses three critical weaknesses in the textbook processing pipeline:
1. Lesson separation doesn't respect textbook order and misses lessons
2. Sinhala text display issues in lesson names and content
3. Question generation doesn't properly handle figures

## R1: Improved Lesson Separation

### Problem Statement
The current `segmentTextbookIntoLessons` function has several issues:
- Limited to first 100 pages (`maxPagesForAI = 100` in upload-textbook/route.ts)
- PDF page numbers don't match textbook page numbers (textbooks have intro pages, appendices, etc.)
- Multi-part textbooks (Part 1 ends at page 145, Part 2 starts at page 1) aren't handled well
- AI may miss lessons or get page ranges incorrect

### Requirements
1. **Process ALL pages** for AI lesson detection (not just first 100)
2. **Detect textbook page numbers** embedded in pages (footers, headers)
3. **Track both PDF page index AND textbook page number** for each lesson
4. **Preserve original textbook order** - lessons should appear in the order they appear in the book
5. **Handle multi-part textbooks** - detect when Part 2 continues from Part 1
6. **Implement confidence scoring** - flag lessons with low-confidence page ranges for admin review
7. **Don't miss lessons** - use multiple detection strategies (table of contents, section headers)

### Acceptance Criteria
- [ ] All pages in PDF are analyzed for lesson detection
- [ ] Lesson boundaries match actual textbook structure
- [ ] Multi-part textbooks are handled correctly
- [ ] No lessons are dropped during segmentation
- [ ] Confidence scores are available for admin review

## R2: Sinhala Text Handling

### Problem Statement
- Lesson names don't display properly in Sinhala
- Translation and Sinhala text style is poor
- OCR fallback may not work on Windows (canvas package fails to install)
- Garbled text appears for legacy Sinhala font PDFs

### Requirements
1. **Preserve Sinhala Unicode** - ensure proper UTF-8 storage throughout pipeline
2. **Display Sinhala correctly** - frontend must render Sinhala lesson names properly
3. **Improve OCR results** - enhance Tesseract configuration for Sinhala
4. **Handle canvas installation failure gracefully** - provide clear error messages
5. **Fallback strategy** - if OCR fails, keep original text but flag for review
6. **Font support** - ensure frontend uses Sinhala-friendly fonts

### Acceptance Criteria
- [ ] Lesson names display in proper Sinhala script
- [ ] Sinhala content is properly encoded in database
- [ ] UI renders Sinhala text correctly without garbled characters
- [ ] Clear error messages when OCR unavailable
- [ ] Admin can review flagged lessons

## R3: Figure-Aware Question Generation

### Problem Statement
- Questions may reference figures without describing them
- Students can't answer questions without seeing original figures
- No validation that questions are self-contained

### Requirements
1. **Detect figures in textbook pages** - identify figure locations
2. **Enforce figure descriptions** - questions must describe figures in words
3. **Validate self-containment** - ensure questions can be answered without seeing original figure
4. **Add visual context** - include placeholder descriptions for figures
5. **Mark figures in questions** - indicate which questions require figure reference

### Acceptance Criteria
- [ ] All questions describe figures in words
- [ ] Questions are answerable without seeing original figures
- [ ] Figure references are clearly marked in questions
- [ ] Visual context is preserved in question text

## Dependencies
- R1 depends on PDF.js text extraction improvements
- R2 depends on OCR configuration and canvas package handling
- R3 depends on figure detection logic

## Priority
- R1: High (core functionality)
- R2: High (user experience)
- R3: Medium (enhancement)
