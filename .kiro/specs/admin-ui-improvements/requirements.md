# Admin UI Improvements - Requirements

## 1. Admin Dashboard Navigation

### Requirement 1.1: Persistent Navigation Bar
- **Description**: A consistent navigation bar across all admin pages
- **Options**: Sidebar (left) or Top navbar (recommended for admin)
- **Navigation Items**:
  - Dashboard (shows overview stats)
  - Upload Textbooks (leads to grade selection)
  - Manage Questions (all pending questions across lessons)
  - Manage Students (student list, viewing)
  - Logout (user session)
- **Design**: Clean, professional, with active page highlight
- **Priority**: P0 (blocking everything else)

### Requirement 1.2: Authentication Check
- **Description**: Verify admin role on every admin page
- **Behavior**: Redirect non-admins to login
- **Current State**: Already implemented via middleware
- **Priority**: P0

---

## 2. Textbook Upload Interface

### Requirement 2.1: Grade Selection Grid
- **Description**: Visual grid showing grades 6-11
- **Layout**: 2x3 grid (6 boxes, one per grade)
- **Box Design**: 
  - Grade number prominently displayed
  - 2 buttons inside: "Sinhala Medium" + "English Medium"
  - Hover effect (subtle shadow/background change)
  - Click navigates to upload page with grade + medium pre-filled
- **Priority**: P0

### Requirement 2.2: Grade-Medium Upload Page
- **Description**: Single upload page for one grade+medium combination
- **Page Title**: "Upload Textbook: Grade [X] - [Medium]"
- **Elements**:
  - File input (accept PDF only)
  - Upload button (disabled until file selected)
  - Progress indicator (during upload)
  - Status message (success/error)
  - Cancel/Go Back button
- **Behavior**: After upload, show lesson separation results
- **Priority**: P0

### Requirement 2.3: Multiple File Upload (Optional Enhancement)
- **Description**: Allow uploading Part 1, Part 2, etc. of same textbook
- **Behavior**: Merge lessons from multiple uploads with user confirmation
- **Priority**: P1 (defer if time-limited)

---

## 3. Lesson Management

### Requirement 3.1: Lesson List for Grade+Medium
- **Description**: After upload/lesson separation, display lessons
- **For Each Lesson Card, Show**:
  - Lesson title (editable inline or modal)
  - Page range: "Pages X-Y" (editable)
  - Question count badge
  - Action buttons: Edit, Delete, Manage Questions
- **Priority**: P0

### Requirement 3.2: Edit Lesson
- **Description**: Modal or inline editor for lesson properties
- **Editable Fields**:
  - Title (text input, required)
  - Start Page (number input)
  - End Page (number input)
  - Confirm/Cancel buttons
- **Validation**: End page > Start page, both positive integers
- **Priority**: P0

### Requirement 3.3: Delete Lesson
- **Description**: Remove lesson from database
- **Confirmation**: Modal asking "Delete lesson '[Title]'? This cannot be undone."
- **Cascade**: Delete associated questions
- **Priority**: P0

### Requirement 3.4: Manage Question Bank Link
- **Description**: Navigate to question review page for that lesson
- **Link**: "Manage Questions (0/20)" - shows approved/total
- **Target Page**: Existing `/admin/questions/[lessonId]` page
- **Priority**: P0

---

## 4. Question Review & Approval

### Requirement 4.1: Accept/Reject Options (Already Exists)
- **Description**: Questions show approve/reject/edit buttons
- **Current Implementation**: Already in `/admin/questions/[lessonId]`
- **Status**: Verify it's working with delimiter-based parsing
- **Priority**: P0 (verify)

### Requirement 4.2: Image Generation & Review
- **Description**: For questions with [DIAGRAM: ...], show generate image button
- **Flow**:
  1. Admin sees question with diagram placeholder
  2. Clicks "Generate Image" button
  3. System calls `/api/admin/generate-diagram`
  4. Shows generated image below question
  5. Admin can accept image or regenerate
  6. On accept, image attached to question
  7. Then approve question to bank
- **Current State**: Partially implemented, needs UX refinement
- **Priority**: P0

### Requirement 4.3: Retry/Regenerate Image
- **Description**: If admin dislikes generated image, can try again
- **Behavior**: Clicking "Regenerate" calls API again with same description
- **Rate Limit**: Add small delay to prevent spam
- **Priority**: P1

---

## 5. Sinhala Language Handling

### Requirement 5.1: UTF-8 Support
- **Description**: All text inputs/outputs preserve Sinhala characters
- **Implementation**: 
  - Database: UTF-8 collation (already configured)
  - Forms: Accept Sinhala input
  - Display: Render correctly in all UIs
- **Priority**: P0 (critical for Sinhala medium)

### Requirement 5.2: Sinhala Keyboard Input
- **Description**: Users can type Sinhala in edit fields
- **Current State**: Browser handles this natively, no special code needed
- **Priority**: P0 (verify on test)

### Requirement 5.3: Question Generation Quality (Sinhala)
- **Description**: Ensure generated Sinhala questions are grammatically correct
- **Implementation**: Use Gemini 3.1 Flash Lite (proven to work)
- **Testing**: Manual review of Sinhala questions before approval
- **Priority**: P1 (validation, not blocking)

---

## 6. Non-Functional Requirements

### Performance
- File upload should show progress (>5MB files)
- Lesson list loads in <2 seconds
- Image generation displays spinner while processing

### Usability
- All forms have clear labels and placeholders
- Error messages are specific (not generic "Error occurred")
- Confirm dialogs for destructive actions

### Accessibility
- All buttons have clear labels
- Forms are keyboard navigable
- Color contrast meets WCAG AA

---

## Dependencies
- Existing: Admin auth, Prisma models, API routes
- Blocking: Lesson segmentation API (already working)
- Related: Student UI spec (different workflow)

## Out of Scope
- Student dashboard (separate spec)
- Lesson PDF download (backend exists, UI refinement only)
- Analytics/reporting
