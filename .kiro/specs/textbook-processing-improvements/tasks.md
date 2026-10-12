# Textbook Processing Improvements - Tasks

## Completed Tasks

### Phase 1: Enhanced Lesson Segmentation (COMPLETED)

#### Task 1.1: Use Gemini 3.5 Flash Lite for Lesson Segmentation
- [x] Updated `segmentTextbookIntoLessons` in `lib/ai.ts` to use `gemini-3.5-flash-lite`
- [x] Added `extractTextbookPageRanges` helper function
- [x] Updated prompt with systematic 7-step process for lesson detection
- [x] Added textbook page number detection (scans for patterns like "page 15")

#### Task 1.2: Remove Page Limit for AI Analysis
- [x] Removed `maxPagesForAI` limit - now processes all pages
- [x] Updated `app/api/admin/upload-textbook/route.ts`
- [ ] Test with 200+ page textbooks

#### Task 1.3: Confidence Scoring System
- [ ] Add confidence scores to lesson boundaries
- [ ] Implement heuristics for confidence calculation
- [ ] Flag low-confidence lessons for admin review

#### Task 1.4: Multi-Part Continuation Detection
- [x] Enhanced `app/api/admin/upload-textbook/route.ts` to detect lesson continuity
- [ ] Implement more sophisticated continuation detection

#### Task 1.5: Enhanced AI Prompt
- [x] Updated prompt to read all pages
- [x] Added multi-part handling instructions
- [x] Added systematic 7-step process for lesson detection

### Phase 2: Sinhala Text Pipeline (IN PROGRESS)

#### Task 2.1: Enhanced OCR Configuration
- [ ] Update `ocrPdfPages` in `lib/pdf-ocr.ts` with better Sinhala config
- [ ] Add Sinhala character whitelist
- [ ] Improve Tesseract page segmentation mode

#### Task 2.2: Canvas Package Installation Guide
- [ ] Document Windows setup in `OCR-SETUP-WINDOWS.md`
- [ ] Add clear error messages when OCR unavailable
- [ ] Provide fallback instructions

#### Task 2.3: Database UTF-8 Validation
- [ ] Verify Prisma schema uses utf8mb4 for Sinhala
- [ ] Update schema if needed for lessons table
- [ ] Test with Sinhala content

#### Task 2.4: Frontend Font Support
- [ ] Import Sinhala-friendly fonts in `app/globals.css`
- [ ] Create `.sinhala-font` class
- [ ] Test rendering in all UI components

#### Task 2.5: Text Encoding Validation
- [ ] Add `validateSinhalaEncoding` function
- [ ] Validate text throughout pipeline
- [ ] Flag garbled text for review

### Phase 3: Figure-Aware Question Generation (IN PROGRESS)

#### Task 3.1: Figure Detection Logic
- [ ] Create `detectFiguresInPage` in `lib/pdf-extract.ts`
- [ ] Detect figure patterns: "Figure 1", "Fig. 1", captions
- [ ] Store figure metadata

#### Task 3.2: Enhanced Question Generation Prompt
- [x] Updated `generateQuestionBatch` in `lib/ai.ts` with figure handling
- [x] Already has instructions to describe figures in words
- [ ] Add strict examples for figure descriptions
- [ ] Include examples of proper figure references

#### Task 3.3: Question Validation
- [ ] Create `validateQuestionAgainstFigure` function
- [ ] Check for proper figure references in questions
- [ ] Flag questions for admin review

#### Task 3.4: Question UI Enhancement
- [ ] Update `app/admin/questions/[lessonId]/page.tsx`
- [ ] Add figure notice indicators
- [ ] Display figure descriptions with questions

### Phase 4: Testing & Validation (PENDING)
