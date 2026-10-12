# Admin UI Improvements - Tasks

## Phase 1: Navigation & Layout (3-4 hours)

### Task 1.1: Create Admin Layout Component
- **Description**: Create `/app/admin/layout.tsx` with persistent navigation
- **Subtasks**:
  - Build sidebar with navigation items
  - Add logout button with session handling
  - Add active page highlighting
  - Responsive mobile menu (collapsible)
- **Acceptance**: Navigation appears on all admin pages, logout works
- **Estimate**: 1.5 hours

### Task 1.2: Create Admin Dashboard Page
- **Description**: Create `/app/admin/dashboard/page.tsx` landing page
- **Content**:
  - Welcome message
  - Quick stats (total textbooks, lessons, pending questions)
  - Recent activity
  - Quick links to main actions
- **Acceptance**: Dashboard loads, shows relevant stats
- **Estimate**: 1.5 hours

### Task 1.3: Verify Authentication Middleware
- **Description**: Ensure non-admin users can't access /admin routes
- **Current State**: Check if middleware.ts is protecting routes
- **Action**: If not, add redirect to login for non-admin
- **Acceptance**: Non-admin redirected, admin can access
- **Estimate**: 0.5 hours

---

## Phase 2: Textbook Upload Flow (4-5 hours)

### Task 2.1: Create Grade Selection Grid Page
- **Description**: Create `/app/admin/textbooks/page.tsx`
- **Content**:
  - 2x3 grid of grade boxes (6-11)
  - Each box has 2 buttons: Sinhala, English
  - Buttons navigate to `/admin/textbooks/[grade]/[medium]`
- **Styling**: Use Tailwind for responsive grid, hover effects
- **Acceptance**: Grid displays correctly, buttons navigate
- **Estimate**: 1 hour

### Task 2.2: Create Upload Form Page
- **Description**: Create `/app/admin/textbooks/[grade]/[medium]/page.tsx`
- **Content**:
  - File input (PDF only)
  - Upload button (disabled until file selected)
  - Progress bar during upload
  - Status messages
- **API Call**: POST `/api/admin/upload-textbook` (already exists, verify)
- **On Success**: Redirect to lessons page
- **Acceptance**: Can upload PDF, see progress, see results
- **Estimate**: 1.5 hours

### Task 2.3: Create Lesson List Page
- **Description**: Create `/app/admin/textbooks/[grade]/[medium]/lessons/page.tsx`
- **Content**:
  - List of lessons from DB (filter by grade + medium)
  - Each lesson shows: title, page range, question count
  - Action buttons: Edit, Delete, Manage Questions
- **Query**: GET lessons for grade + medium
- **Acceptance**: Lessons display correctly with all info
- **Estimate**: 1.5 hours

### Task 2.4: Update Upload API (if needed)
- **Description**: Verify `/api/admin/upload-textbook` works correctly
- **Check**:
  - Takes file + grade + medium
  - Calls `segmentTextbookIntoLessons()`
  - Stores lessons in DB
  - Returns success status
- **If Broken**: Fix or rewrite
- **Acceptance**: API successfully separates lessons
- **Estimate**: 1 hour (or 2 if rewrite needed)

---

## Phase 3: Lesson Management (3-4 hours)

### Task 3.1: Create Lesson Edit Modal
- **Description**: Add edit functionality to lesson cards
- **Options**:
  - Option A: Modal popup with form
  - Option B: Inline editing on card
- **Recommended**: Modal (cleaner UX)
- **Fields**: Title, Start Page, End Page
- **Validation**: End > Start, both positive integers
- **Acceptance**: Can edit and save lesson properties
- **Estimate**: 1.5 hours

### Task 3.2: Implement Edit Lesson API
- **Description**: Create `PATCH /api/admin/lessons/[id]`
- **Input**: { title?, startPage?, endPage? }
- **Validation**: Same as Task 3.1
- **Update**: Prisma lesson update
- **Error Handling**: Return 400 if validation fails
- **Acceptance**: PATCH successfully updates DB
- **Estimate**: 1 hour

### Task 3.3: Implement Delete Lesson
- **Description**: Add delete functionality with confirmation
- **Flow**:
  1. Click [Delete] button on lesson card
  2. Confirmation modal asks "Delete this lesson?"
  3. On confirm: DELETE `/api/admin/lessons/[id]`
  4. Cascade delete questions
  5. Remove card from UI
- **API**: Create `DELETE /api/admin/lessons/[id]`
- **Acceptance**: Lesson deleted with questions, card removed
- **Estimate**: 1.5 hours

### Task 3.4: Add "Manage Questions" Navigation
- **Description**: Link lesson card to question review page
- **Link**: "Manage Questions (X pending)" button
- **Target**: `/admin/questions/[lessonId]`
- **Badge**: Show count of pending vs approved
- **Acceptance**: Clicking navigates and loads correct lesson's questions
- **Estimate**: 0.5 hours

---

## Phase 4: Question Review & Images (3-4 hours)

### Task 4.1: Verify Delimiter-Based Question Parsing
- **Description**: Test that questions generated from delimiter format work
- **Current State**: `/lib/ai.ts` has `parseQuestionsFromText()`
- **Test**:
  - Generate sample questions with `---QUESTION START---` delimiters
  - Verify parsing extracts all fields correctly
  - Check Sinhala text is preserved
- **If Broken**: Debug and fix parsing logic
- **Acceptance**: Sample questions parse correctly with all fields
- **Estimate**: 1 hour

### Task 4.2: Enhance Image Generation UI
- **Description**: Improve `/admin/questions/[lessonId]` with image preview
- **Current**: Shows diagram placeholder
- **Enhancement**:
  - Add "Generate Image" button for [DIAGRAM: ...] questions
  - Show loading spinner while generating
  - Display generated image when ready
  - Add "Regenerate" + "Accept" buttons
- **API**: Use existing `POST /api/admin/generate-diagram`
- **Acceptance**: Can generate and preview images in UI
- **Estimate**: 1.5 hours

### Task 4.3: Test Image Generation with Sinhala
- **Description**: Verify Gemini 2.5 Flash Image handles Sinhala descriptions
- **Test**:
  - Generate questions in Sinhala with [DIAGRAM: ...] tags
  - Click Generate Image for Sinhala diagram descriptions
  - Verify image generates correctly
- **If Issue**: Document and workaround
- **Acceptance**: Sinhala diagram descriptions generate images
- **Estimate**: 1 hour (or defer if working)

### Task 4.4: Add Retry/Regenerate for Images
- **Description**: Let admin regenerate images if not satisfied
- **Flow**:
  1. Generate image (shows)
  2. Admin clicks [Regenerate]
  3. Call API again
  4. Show new image
  5. Can repeat until satisfied
- **Rate Limit**: Add 1-2 second delay between regenerate clicks
- **Acceptance**: Can regenerate multiple times
- **Estimate**: 0.5 hours

---

## Phase 5: Sinhala Language Support (2-3 hours)

### Task 5.1: Verify UTF-8 in Database
- **Description**: Confirm Prisma + PostgreSQL handle Sinhala correctly
- **Check**:
  - Database charset is UTF-8
  - Prisma schema has proper collation
  - Test storing Sinhala lesson title
  - Test retrieving and displaying
- **Current State**: Should be configured already
- **If Issue**: Fix collation in schema
- **Acceptance**: Sinhala text stores and displays correctly
- **Estimate**: 0.5 hours

### Task 5.2: Test Sinhala Input in Forms
- **Description**: Ensure all form fields accept Sinhala input
- **Test**:
  - Edit lesson title to Sinhala text
  - Submit form
  - Verify saved and displayed correctly
- **Acceptance**: Sinhala input works end-to-end
- **Estimate**: 0.5 hours

### Task 5.3: Manual QA: Sinhala Question Quality
- **Description**: Review generated Sinhala questions for grammar/correctness
- **Process**:
  1. Generate 10-20 questions in Sinhala
  2. Review for:
     - Grammar and spelling
     - Question clarity
     - Answer correctness
     - Diagram descriptions quality
  3. Document any issues
  4. Reject poor questions, improve prompt if systematic issues
- **Acceptance**: Questions are acceptable quality for students
- **Estimate**: 1.5 hours (not rushed)

---

## Phase 6: Polish & Testing (2-3 hours)

### Task 6.1: UI/UX Polish
- **Description**: Refine visual design and interactions
- **Checklist**:
  - [ ] Consistent spacing/padding
  - [ ] Hover states on all interactive elements
  - [ ] Loading states on buttons
  - [ ] Error messages clear and helpful
  - [ ] Mobile responsiveness
  - [ ] Color contrast WCAG AA compliant
- **Acceptance**: UI looks polished and professional
- **Estimate**: 1 hour

### Task 6.2: Integration Testing
- **Description**: End-to-end test of full workflows
- **Scenarios**:
  1. Upload textbook → Lessons appear
  2. Edit lesson title → Changes saved
  3. Delete lesson → Removed from DB
  4. Generate questions → Questions appear pending
  5. Approve/reject questions → Status updates
  6. Generate image for question → Image appears
- **Acceptance**: All workflows work without errors
- **Estimate**: 1 hour

### Task 6.3: Performance Check
- **Description**: Verify pages load quickly
- **Check**:
  - Grade grid loads instantly
  - Lesson list loads <2 seconds
  - Question review page responsive while scrolling
  - Image generation doesn't block UI
- **Optimization**: If slow, add pagination or lazy loading
- **Acceptance**: All pages feel responsive
- **Estimate**: 0.5 hours

### Task 6.4: Documentation & Cleanup
- **Description**: Comment code and clean up any dead code
- **Add**:
  - JSDoc comments on new components
  - Inline comments for complex logic
  - README for admin workflow
- **Remove**: Debug logs, unused imports
- **Acceptance**: Code is clean and documented
- **Estimate**: 0.5 hours

---

## Summary

| Phase | Title | Hours | Dependencies |
|-------|-------|-------|--------------|
| 1 | Navigation & Layout | 3-4 | None |
| 2 | Textbook Upload | 4-5 | Phase 1 |
| 3 | Lesson Management | 3-4 | Phase 2 |
| 4 | Question Review & Images | 3-4 | Phase 3 + existing AI |
| 5 | Sinhala Support | 2-3 | All phases |
| 6 | Polish & Testing | 2-3 | All phases |
| **TOTAL** | | **17-23 hours** | |

## Next Steps

1. Review this spec with user/team
2. Approve or request changes
3. Begin Phase 1 (Admin Layout)
4. Each task should have PR and code review
