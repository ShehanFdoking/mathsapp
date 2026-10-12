# Admin UI Improvements - Design

## Architecture Overview

```
Admin Dashboard (entry point)
  ├── Navigation Bar (persistent)
  │   ├── Dashboard
  │   ├── Upload Textbooks → Grade Selection Grid
  │   │   ├── Grade 6 [Sinhala] [English]
  │   │   ├── Grade 7 [Sinhala] [English]
  │   │   └── ... Grade 11
  │   │
  │   ├── Manage Questions (all pending)
  │   ├── Manage Students
  │   └── Logout
  │
  └── Pages
      ├── /admin/dashboard (overview)
      ├── /admin/textbooks (grade grid)
      ├── /admin/textbooks/[grade]/[medium] (upload page)
      ├── /admin/textbooks/[grade]/[medium]/lessons (lesson list)
      ├── /admin/lessons/[lessonId]/edit (lesson editor)
      └── /admin/questions/[lessonId] (already exists - verify)
```

---

## Component Design

### 1. Admin Navigation Layout

**Option A: Sidebar Navigation (Recommended)**
```
┌─────────────────────────────────────────┐
│  GoMath Admin                           │
├─────────────────────────────────────────┤
│ □ Dashboard                             │
│ □ Upload Textbooks                      │
│ □ Manage Questions (5 pending)          │
│ □ Manage Students                       │
├─────────────────────────────────────────┤
│ Admin User                              │
│ [Logout]                                │
└─────────────────────────────────────────┘
```

**Styling**:
- Width: 240px (collapsible on mobile to 60px icon-only)
- Background: #1F2937 (dark gray)
- Text: white
- Active item: #3B82F6 (blue) with left border highlight
- Hover: slightly lighter background

---

### 2. Textbook Upload - Grade Selection Grid

**Layout**: 2x3 responsive grid
```
┌─────────────────────────────────────────────────┐
│ Upload Textbooks                                │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐             │
│  │   Grade 6    │  │   Grade 7    │             │
│  │ [Sinhala]    │  │ [Sinhala]    │             │
│  │ [English]    │  │ [English]    │             │
│  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐             │
│  │   Grade 8    │  │   Grade 9    │             │
│  │ [Sinhala]    │  │ [Sinhala]    │             │
│  │ [English]    │  │ [English]    │             │
│  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐             │
│  │  Grade 10    │  │  Grade 11    │             │
│  │ [Sinhala]    │  │ [Sinhala]    │             │
│  │ [English]    │  │ [English]    │             │
│  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────┘
```

**Box Styling**:
- Card: rounded-lg, border, shadow on hover
- Grade Title: font-bold, text-lg, centered
- Buttons: Two columns, each 50% width
  - "Sinhala Medium" & "English Medium"
  - Primary blue styling
  - Cursor: pointer on hover with opacity change

---

### 3. Upload Page: Grade [X] - [Medium]

**Layout**: Single file upload form
```
┌─────────────────────────────────────────┐
│ Upload Textbook: Grade 9 - Sinhala      │
├─────────────────────────────────────────┤
│                                         │
│  Select PDF file:                       │
│  [Choose File] (no file selected)       │
│                                         │
│  [Upload Textbook]  [Cancel]            │
│                                         │
│  Status: Ready                          │
│                                         │
└─────────────────────────────────────────┘

(During upload)
┌─────────────────────────────────────────┐
│ Upload Textbook: Grade 9 - Sinhala      │
├─────────────────────────────────────────┤
│                                         │
│  Uploading: file.pdf                    │
│  Progress: [████████░░░░░░░░░░] 45%     │
│                                         │
│  Separating into lessons...             │
│                                         │
└─────────────────────────────────────────┘

(On success, redirect to lessons page)
```

---

### 4. Lesson List & Management

**After Upload - Lesson Cards**:
```
┌──────────────────────────────────────────┐
│ Lessons: Grade 9 - Sinhala (5 lessons)   │
├──────────────────────────────────────────┤
│
│  ┌─────────────────────────────────────┐ │
│  │ Lesson 1: Sets and Logic            │ │
│  │ Pages 1-15 | Questions: 0 approved  │ │
│  │ [Edit] [Delete] [Questions ▶]       │ │
│  └─────────────────────────────────────┘ │
│
│  ┌─────────────────────────────────────┐ │
│  │ Lesson 2: Relations and Functions   │ │
│  │ Pages 16-35 | Questions: 12 pending │ │
│  │ [Edit] [Delete] [Questions ▶]       │ │
│  └─────────────────────────────────────┘ │
│
│  (... more lessons)
│
│  [Upload Another Part]                  │
│                                         │
└──────────────────────────────────────────┘
```

**Edit Lesson Modal**:
```
┌────────────────────────────────┐
│ Edit Lesson                    │
├────────────────────────────────┤
│                                │
│ Title:                         │
│ [Sets and Logic_____________] │
│                                │
│ Start Page:                    │
│ [1]                            │
│                                │
│ End Page:                      │
│ [15]                           │
│                                │
│  [Save]  [Cancel]              │
│                                │
└────────────────────────────────┘
```

---

### 5. Question Review - Image Generation UX

**Current Question Card**:
```
┌────────────────────────────────────┐
│ What is the derivative of x²?      │
│ [DIAGRAM: coordinate system...]    │
│                                    │
│ A) 2x                              │
│ B) x                               │
│ C) 2x + 1                          │
│ D) x²                              │
│                                    │
│ Answer: A                          │
│ Marks: 2                           │
│                                    │
│ [Approve] [Edit] [Reject]          │
└────────────────────────────────────┘
```

**With Image Generation**:
```
┌──────────────────────────────────────────┐
│ Question with diagram                    │
├──────────────────────────────────────────┤
│ What is the area of this trapezoid?      │
│                                          │
│ [DIAGRAM: Trapezoid with measurements]   │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ [Generate Image Button]              │ │
│ │ (or show spinner if generating)      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [After generation - show image]          │
│ ┌──────────────────────────────────────┐ │
│ │  [Generated Image Here]              │ │
│ │  (clean 2D geometric figure)         │ │
│ │                                      │ │
│ │  [Regenerate]  [Accept]  [Reject]   │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ (Continue with question options...)      │
│                                          │
│ [Approve & Add to Bank]                  │
└──────────────────────────────────────────┘
```

---

## Data Flow

### Upload → Lesson Separation
```
1. Admin selects grade + medium
2. Admin uploads PDF
3. System calls: POST /api/admin/upload-textbook
4. Backend:
   - Saves PDF to storage
   - Extracts text (OCR/pdf-extract)
   - Calls segmentTextbookIntoLessons() (Gemini)
   - Stores lessons in DB
5. UI shows lesson list with edit controls
```

### Edit Lesson
```
1. Admin clicks [Edit] on lesson card
2. Modal shows current title + page range
3. Admin edits and clicks Save
4. PATCH /api/admin/lessons/[id]
5. DB updates, UI refreshes card
```

### Delete Lesson
```
1. Admin clicks [Delete]
2. Confirmation modal
3. DELETE /api/admin/lessons/[id]
4. Cascade deletes questions
5. UI removes card
```

### Question Generation & Review
```
1. Admin goes to Manage Questions
2. Selects lesson + difficulty + type
3. Clicks Generate
4. Batch creation loop (1500ms between batches)
5. For each question:
   - If has [DIAGRAM: ...], show Generate button
   - Admin reviews question
   - If image needed, clicks Generate
   - API calls generateDiagramBatch()
   - Shows image
   - Admin approves/rejects/regenerates
6. Approved questions saved with status=APPROVED
```

---

## File Structure & Routes

**New Pages**:
```
/app/admin/
├── layout.tsx (navigation wrapper)
├── dashboard/page.tsx (overview)
├── textbooks/
│   ├── page.tsx (grade selection grid)
│   └── [grade]/[medium]/
│       ├── page.tsx (upload form)
│       └── lessons/page.tsx (lesson list)
├── lessons/
│   └── [lessonId]/
│       └── edit/page.tsx (lesson editor)
└── questions/[lessonId]/page.tsx (already exists)

/app/api/admin/
├── upload-textbook/route.ts (already exists, verify)
├── lessons/
│   ├── route.ts (GET all lessons, POST create)
│   └── [id]/
│       ├── route.ts (PATCH update, DELETE delete)
│       └── pdf/route.ts (GET lesson PDF - already exists)
└── generate-diagram/route.ts (already exists, verify)
```

---

## Key Design Decisions

1. **Sidebar Navigation**: Easier to scale with more admin features later
2. **Grade Grid**: Visual, easy to find grade+medium combination
3. **Lesson Cards**: Clear separation of lessons with quick actions
4. **Modal Editing**: Non-destructive UX, keeps context
5. **Delimiter-Based Questions**: Avoids JSON parsing issues with non-ASCII text
6. **Image Generation on Review**: Gives admin visual feedback before approval

---

## Styling Approach

- **Framework**: Tailwind CSS (already in use)
- **Color Scheme**: 
  - Primary: #3B82F6 (blue) for actions
  - Success: #10B981 (green) for approve
  - Danger: #EF4444 (red) for delete/reject
  - Neutral: #6B7280 (gray) for secondary
- **Spacing**: Consistent padding/margins using Tailwind scale
- **Typography**: Use existing Tailwind text utilities
