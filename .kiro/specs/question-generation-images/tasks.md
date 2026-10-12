# Question Generation with Images - Tasks

## Phase 1: Core Question Generation Verification (2-3 hours)

### Task 1.1: Test Delimiter-Based Parsing
- **Description**: Verify `parseQuestionsFromText()` works correctly
- **Current State**: Implementation exists in `/lib/ai.ts`
- **Testing**:
  - Generate sample questions with delimiters
  - Verify all fields parse correctly (question, options, answer, explanation, hint, marks)
  - Test with English text
  - Test with Sinhala text
  - Test edge cases (missing fields, extra delimiters)
- **Acceptance**: All test cases pass
- **Estimate**: 1 hour

### Task 1.2: Test Gemini 3.1 Flash Lite Generation
- **Description**: Verify AI generates valid delimiter-formatted questions
- **Current State**: Model configured in `/lib/ai.ts`
- **Testing**:
  - Generate 5 MCQ questions (Easy) - English
  - Generate 5 MCQ questions (Easy) - Sinhala
  - Check delimiter format matches specification
  - Verify parsing succeeds
  - Verify question quality is acceptable
- **Acceptance**: Questions generate, parse, and are quality-acceptable
- **Estimate**: 1.5 hours

### Task 1.3: Test API Route `/api/admin/questions/generate`
- **Description**: Verify question generation endpoint works end-to-end
- **Current State**: Route exists, uses `generateQuestionBank()`
- **Testing**:
  - Call POST /api/admin/questions/generate with valid lessonId
  - Verify questions created in DB with status=PENDING
  - Check questions have all required fields
  - Verify count matches requested count
  - Test with different difficulty levels
- **Acceptance**: API successfully creates questions with all fields
- **Estimate**: 0.5 hours

---

## Phase 2: Image Generation Verification (2-3 hours)

### Task 2.1: Test Diagram Generation API
- **Description**: Verify `/api/admin/generate-diagram` works
- **Current State**: Route exists, uses `generateDiagramBatch()`
- **Testing**:
  - Call with single diagram description
  - Verify returns base64 image data
  - Verify image is valid PNG/PNG format
  - Test multiple diagrams in batch
  - Check rate limiting (1.1s spacing)
- **Acceptance**: API returns valid images, respects rate limits
- **Estimate**: 1 hour

### Task 2.2: Test Image Generation with Sinhala Descriptions
- **Description**: Verify diagrams generate for Sinhala descriptions
- **Current State**: Gemini 2.5 Flash Image configured
- **Testing**:
  - Generate questions with Sinhala [DIAGRAM: ...] tags
  - Call generate-diagram with Sinhala descriptions
  - Verify images generate correctly
  - Check description understanding (geometry correct)
- **If Issue**: May need to translate descriptions or adjust prompt
- **Acceptance**: Images generate for Sinhala descriptions
- **Estimate**: 1 hour

### Task 2.3: Test Image Rendering in Admin UI
- **Description**: Verify images display correctly in question review page
- **Current State**: UI exists in `/admin/questions/[lessonId]`
- **Testing**:
  - Review question with generated image
  - Verify image displays below question
  - Verify [DIAGRAM: ...] placeholder replaced with image
  - Test responsive sizing
- **Acceptance**: Images display correctly and are readable
- **Estimate**: 0.5 hours

---

## Phase 3: Question Storage & Retrieval (1.5-2 hours)

### Task 3.1: Verify Question Model & Storage
- **Description**: Ensure Prisma Question model stores all fields
- **Current State**: Model exists in `/prisma/schema.prisma`
- **Verify**:
  - All fields from requirements are in schema
  - Types are correct (options as JSON, answerIndex as Int, etc.)
  - Relationships to Lesson are correct
- **If Missing**: Add fields to schema
- **Estimate**: 0.5 hours

### Task 3.2: Test Question Retrieval & Filtering
- **Description**: Verify filtering by lesson, status, difficulty, type
- **Testing**:
  - Create 20 questions (mix of types, difficulties, statuses)
  - Query: GET all pending questions for lesson X
  - Query: GET all approved MCQs for lesson Y
  - Query: GET all HARD STRUCTURED questions
- **Acceptance**: Filtering works accurately
- **Estimate**: 0.5 hours

### Task 3.3: Test Question Approval/Rejection Flow
- **Description**: Verify PATCH endpoint updates status correctly
- **Current State**: Route exists
- **Testing**:
  - Create question (status=PENDING)
  - PATCH with action=approve → status changes to APPROVED
  - PATCH with action=reject → status changes to REJECTED
  - Verify changes persist in DB
- **Acceptance**: Status updates work correctly
- **Estimate**: 0.5 hours

---

## Phase 4: UI Integration & Polish (2-3 hours)

### Task 4.1: Enhance Question Review Page
- **Description**: Improve `/admin/questions/[lessonId]` page
- **Current**: Works but could be more polished
- **Enhancements**:
  - [ ] Better organization of question cards
  - [ ] Larger/clearer question text
  - [ ] Better visual styling for MCQ options
  - [ ] Clearer approve/reject buttons
  - [ ] Show question counts by status
- **Acceptance**: Page looks professional and is easy to use
- **Estimate**: 1 hour

### Task 4.2: Add Image Preview in UI
- **Description**: Show generated images clearly when reviewing
- **Current State**: Images show but UX could be better
- **Enhancement**:
  - [ ] Image displays in larger modal when clicked
  - [ ] Image and question visible side-by-side on desktop
  - [ ] "Regenerate Image" button clearly visible
  - [ ] Loading state with spinner
- **Acceptance**: Image preview UX is smooth and clear
- **Estimate**: 1 hour

### Task 4.3: Generation Progress Feedback
- **Description**: Show admin progress while generating
- **Current State**: Basic status message
- **Enhancement**:
  - [ ] Progress bar showing batch completion
  - [ ] Count "3 of 10 batches completed"
  - [ ] Time estimate remaining
  - [ ] Cancel button to stop generation
  - [ ] Success toast notification when done
- **Acceptance**: Admin can track generation progress
- **Estimate**: 1 hour

---

## Phase 5: Sinhala Quality Assurance (2-3 hours)

### Task 5.1: Generate & Review Sinhala Questions
- **Description**: Manually verify quality of Sinhala-generated questions
- **Process**:
  1. Generate 20-30 Sinhala MCQ questions (mix of easy/medium/hard)
  2. For each question:
     - Check grammar and spelling
     - Verify mathematical correctness
     - Check option logic (no obvious wrong options)
     - Verify explanation is clear
  3. Document any issues found
  4. Calculate quality score (% acceptable)
- **Acceptance Criteria**: ≥90% questions are acceptable quality
- **If Below**: Iterate on prompt, regenerate, review again
- **Estimate**: 1.5 hours (not rushed)

### Task 5.2: Generate & Review Sinhala Diagrams
- **Description**: Test diagram generation with Sinhala descriptions
- **Process**:
  1. Generate 5-10 Sinhala questions with [DIAGRAM: ...] tags
  2. Generate images for each
  3. Verify images match description:
     - Correct shapes
     - Correct measurements
     - Labels readable
     - Professional appearance
  4. Try regenerating if not satisfied
  5. Document any patterns
- **Acceptance**: Diagram generation works reliably for Sinhala
- **Estimate**: 1 hour

### Task 5.3: Fix Prompt if Quality Issues Found
- **Description**: If Sinhala questions have issues, improve prompt
- **Common Issues**:
  - Grammatical errors → Specify "Use correct Sinhala grammar"
  - Wrong answers → Add "Verify answer is mathematically correct"
  - Poor explanations → Add "Provide clear step-by-step explanation"
- **Process**:
  1. Identify root cause
  2. Update prompt in `generateQuestionBatch()`
  3. Regenerate sample
  4. Re-review
  5. If improved, done; else iterate
- **Estimate**: 0.5 hours (or more if systematic changes needed)

---

## Phase 6: Error Handling & Edge Cases (1.5-2 hours)

### Task 6.1: Test Generation Failures
- **Description**: Verify graceful handling of API errors
- **Scenarios**:
  - [ ] Network timeout during generation
  - [ ] Rate limit (429) response
  - [ ] Invalid response from AI (garbled/malformed)
  - [ ] Partial batch failure (7 of 10 succeed)
  - [ ] Database write failure
- **Verification**: Each scenario handled gracefully with user-friendly message
- **Acceptance**: No crashes, clear error messages
- **Estimate**: 1 hour

### Task 6.2: Test Edge Cases in Parsing
- **Description**: Verify delimiter parsing handles variations
- **Scenarios**:
  - [ ] Missing optional fields (hint, explanation)
  - [ ] Extra whitespace or newlines
  - [ ] Unicode/Sinhala in all fields
  - [ ] Very long question text (>1000 chars)
  - [ ] Special characters in options (√, ÷, ±, etc.)
- **Acceptance**: Parser handles variations without crashing
- **Estimate**: 0.5 hours

### Task 6.3: Test Rate Limiting
- **Description**: Verify rate limits are respected
- **Scenarios**:
  - [ ] Generate multiple batches sequentially
  - [ ] Image generation with 1.1s spacing
  - [ ] Multiple admins generating simultaneously
- **Monitoring**: Track API calls in logs
- **Acceptance**: Spacing maintained, no quota exceeded errors
- **Estimate**: 0.5 hours

---

## Phase 7: Performance & Optimization (1-1.5 hours)

### Task 7.1: Benchmark Generation Speed
- **Description**: Measure how long generation takes
- **Test**:
  - Generate 10 questions → measure time
  - Generate 50 questions → measure time
  - Generate single image → measure time
  - Generate 5 images → measure time
- **Target**: 
  - 10 questions: ~20-30 seconds
  - 50 questions: ~80-120 seconds
  - Single image: ~5-15 seconds
- **Acceptance**: Performance acceptable for admin workflow
- **Estimate**: 0.5 hours

### Task 7.2: Optimize if Needed
- **Description**: If slow, identify bottlenecks
- **Potential Optimizations**:
  - Increase batch size (trade-off: cost vs speed)
  - Reduce prompt length (trade-off: quality vs speed)
  - Parallel API calls (trade-off: rate limits vs speed)
  - Cache common diagram descriptions (trade-off: freshness vs speed)
- **Decision**: Only optimize if measurably slow
- **Estimate**: 0.5 hours (or skip if already fast)

---

## Phase 8: Documentation & Cleanup (1-1.5 hours)

### Task 8.1: Code Documentation
- **Description**: Add comments and JSDoc to key functions
- **Add Comments**:
  - `generateQuestionBatch()` - high-level flow
  - `parseQuestionsFromText()` - parsing logic
  - `generateDiagramBatch()` - image generation
  - `extractDelimited()` - delimiter extraction
- **Acceptance**: Code is easy to understand for next developer
- **Estimate**: 0.5 hours

### Task 8.2: Create Admin Guide
- **Description**: Write guide for admins on question generation
- **Content**:
  - Step-by-step: How to generate questions
  - Tips: Quality settings, timing, Sinhala handling
  - Troubleshooting: What to do if generation fails
  - Quality: How to review and approve questions
- **Format**: Markdown file in docs folder
- **Estimate**: 0.5 hours

### Task 8.3: Clean Up & Consolidate
- **Description**: Remove debug code, consolidate helpers
- **Tasks**:
  - [ ] Remove console.log statements (keep error logs)
  - [ ] Consolidate similar functions
  - [ ] Remove unused imports
  - [ ] Consistent naming conventions
- **Acceptance**: Code is clean and production-ready
- **Estimate**: 0.5 hours

---

## Summary

| Phase | Title | Hours | Dependencies |
|-------|-------|-------|--------------|
| 1 | Core Generation Verification | 2-3 | None |
| 2 | Image Generation Verification | 2-3 | Phase 1 |
| 3 | Storage & Retrieval | 1.5-2 | Phase 1 |
| 4 | UI Integration | 2-3 | Phases 2-3 |
| 5 | Sinhala QA | 2-3 | Phase 1 |
| 6 | Error Handling | 1.5-2 | Phases 1-4 |
| 7 | Performance | 1-1.5 | Phases 1-6 |
| 8 | Documentation | 1-1.5 | All phases |
| **TOTAL** | | **14-19 hours** | |

---

## Testing Checklist

- [ ] English questions generate correctly
- [ ] Sinhala questions generate correctly and are grammatically sound
- [ ] MCQ format works (4 options, correct answer marked)
- [ ] STRUCTURED format works (question + model answer)
- [ ] Difficulty levels create appropriately-scaled questions
- [ ] Batch generation with 1.5s spacing works
- [ ] Questions store in DB with all fields
- [ ] Pending questions display in review page
- [ ] Approve/reject workflow updates status
- [ ] Images generate for diagram descriptions
- [ ] Images display correctly in UI
- [ ] Sinhala diagram descriptions generate images
- [ ] Rate limiting works (spacing respected)
- [ ] Error handling is graceful
- [ ] No database encoding issues with Sinhala

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Sinhala text corrupted in DB | Verify UTF-8 collation, test early |
| AI quota exhausted | Monitor usage, increase spacing if needed |
| Poor question quality | Manual review, iterate on prompt |
| Diagram generation fails | Fallback to text description |
| Parsing fails on unusual format | Test with real AI output, adjust regex |
| Performance issues | Profile early, optimize bottlenecks |

---

## Success Criteria

✓ Questions generate reliably (>95% success rate)
✓ Sinhala questions are high quality (manual review ≥90%)
✓ Images generate for geometry questions
✓ Admin workflow is smooth and intuitive
✓ No database corruption or encoding issues
✓ Error messages are helpful and clear
✓ Generation time is acceptable (<2 min for 50 questions)
