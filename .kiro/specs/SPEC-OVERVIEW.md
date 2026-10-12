# GoMath Platform - Specification Overview

This document provides an overview of the three focused specifications created for building the complete GoMath educational platform.

## Specs at a Glance

### 1. Admin UI Improvements
**Duration**: 17-23 hours | **Priority**: P0

Redesigns the admin dashboard for better usability managing textbooks, lessons, and questions.

**Key Features**:
- Persistent admin navigation bar
- Grade-based textbook upload interface (6-11 with Sinhala/English buttons)
- Lesson management (edit title, page ranges, delete, manage questions)
- Question review and approval workflow
- Image generation and preview in question UI

**Files**: `/admin/dashboard`, `/admin/textbooks`, `/admin/lessons`, `/admin/questions`

**Related Routes**: 
- `/api/admin/lessons` (CRUD)
- `/api/admin/upload-textbook`
- `/api/admin/generate-diagram`

**Spec Files**:
- `admin-ui-improvements/requirements.md` - Detailed requirements
- `admin-ui-improvements/design.md` - Architecture & UI layouts
- `admin-ui-improvements/tasks.md` - Implementation tasks (6 phases)

---

### 2. Question Generation with Images
**Duration**: 14-19 hours | **Priority**: P0

Implements robust question generation with AI and diagram image support.

**Key Features**:
- Question generation via Gemini 3.1 Flash Lite
- Delimiter-based text parsing (avoids JSON issues with Sinhala)
- MCQ and STRUCTURED question types
- EASY/MEDIUM/HARD difficulty levels
- Diagram image generation via Gemini 2.5 Flash Image
- Batch processing with rate limiting
- Full Sinhala language support

**AI Models**:
- **Text Generation**: `gemini-3.1-flash-lite` (questions)
- **Image Generation**: `gemini-2.5-flash-image` (diagrams)

**Related Routes**:
- `/api/admin/questions/generate` - Create questions
- `/api/admin/generate-diagram` - Create diagram images
- `/api/admin/questions/[id]` - Approve/reject

**Spec Files**:
- `question-generation-images/requirements.md` - Question specs & quality standards
- `question-generation-images/design.md` - Generation pipeline & formats
- `question-generation-images/tasks.md` - Implementation tasks (8 phases)

**Key Innovation**: Delimiter-based format (not JSON) for robust Sinhala text handling
```
---QUESTION START---
<question>
---QUESTION---
<question>
---OPTION_A---
<A>
...
---QUESTION END---
```

---

### 3. Student Workflows
**Duration**: TBD (design phase)

Implements student features: dashboard, paper/quiz/notes creation, leaderboard.

**Key Features**:
- Student login/registration
- Grade-based dashboard
- Create exam papers (multi-lesson selection, difficulty choice, PDF download)
- Create quizzes (lesson selection, timed: 20min/30min/40min, auto-submit, instant results)
- Create study notes (lesson summaries with worked examples)
- Leaderboard (scores, rankings, filtering)

**Spec Files**:
- `student-workflows/README.md` - Overview (full spec coming)
- `student-workflows/requirements.md` - To be created
- `student-workflows/design.md` - To be created
- `student-workflows/tasks.md` - To be created

---

## Implementation Order

### Recommended Sequence

1. **Start: Admin UI Improvements** (Phase 1-2)
   - Get basic admin dashboard and textbook upload working
   - Needed for the next two specs

2. **Parallel: Question Generation** (all phases)
   - Question generation is independent of student UI
   - Verify AI models work correctly
   - Manual QA on Sinhala questions

3. **Then: Student Workflows**
   - Build on top of working lesson/question infrastructure
   - Student dashboard, paper/quiz/notes creation

---

## Technology Stack

### Backend
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: Cloudflare R2 (S3-compatible)
- **Auth**: NextAuth.js with admin/student roles

### AI & APIs
- **Text Generation**: Google Gemini 3.1 Flash Lite
- **Image Generation**: Google Gemini 2.5 Flash Image
- **PDF Processing**: pdf-extract, jsPDF, ReportLab

### Frontend
- **Framework**: React (Next.js)
- **Styling**: Tailwind CSS
- **Component Library**: Custom (no external UI libs)

---

## Database Models

### Key Tables

```
User (admin + student roles)
├─ id, email, password, name, role
└─ grade (for students)

Textbook
├─ id, grade, medium (ENGLISH|SINHALA)
├─ title, status

Lesson
├─ id, textbookId, title, startPage, endPage
├─ rawText, smartNote
└─ grade, medium

Question
├─ id, lessonId, question, type (MCQ|STRUCTURED)
├─ options (JSON), answerIndex, modelAnswer
├─ explanation, hint, marks, difficulty
├─ status (PENDING|APPROVED|REJECTED)
└─ grade, medium

Paper (student-generated exam)
├─ id, studentId, title, difficulty
├─ lessonIds (JSON), questions (JSON)
└─ createdAt, downloadedAt

Quiz (student-generated timed assessment)
├─ id, studentId, title, difficulty
├─ lessonIds (JSON), questions (JSON)
├─ durationSeconds, startedAt, submittedAt
└─ score, status (IN_PROGRESS|COMPLETED)

QuizAnswer (student's answer to quiz question)
├─ id, quizId, questionId
├─ studentAnswer, isCorrect
└─ timeSpent

QuizResult (final quiz performance)
├─ id, quizId, studentId
├─ totalQuestions, correctCount, score, percentage
└─ completedAt

StudentScore / Leaderboard View
├─ studentId, studentName, grade
├─ totalScore, quizzesCompleted, averageScore
└─ rank
```

---

## API Routes Summary

### Admin Routes
```
/api/admin/
├─ /upload-textbook                    POST
├─ /lessons                            GET, POST
├─ /lessons/[id]                       GET, PATCH, DELETE
├─ /lessons/[id]/pdf                   GET (download PDF)
├─ /questions                          GET
├─ /questions/generate                 POST
├─ /questions/[id]                     GET, PATCH (approve/reject)
├─ /generate-diagram                   POST
├─ /students                           GET
└─ /textbooks                          GET, POST
```

### Student Routes
```
/api/
├─ /lessons                            GET (by grade)
├─ /papers                             POST (create)
├─ /papers/[id]                        GET, DELETE
├─ /papers/[id]/download               GET (PDF)
├─ /quiz                               POST (create)
├─ /quiz/[id]                          GET
├─ /quiz/[id]/submit                   POST
├─ /leaderboard                        GET (by grade)
├─ /generate-notes                     POST
├─ /generate-quiz                      POST (?)
└─ /chat                               POST
```

---

## Authentication & Authorization

### Admin
- Fixed credentials: `admin` / `admin123`
- Can upload textbooks, manage questions, view students
- Cannot: Take quizzes, create papers

### Student
- Email or phone + password signup/login
- Can: Create papers, take quizzes, read notes, view leaderboard
- Cannot: Upload content, manage questions

### Session
- NextAuth.js with JWT tokens
- Role-based middleware: redirect non-admins from /admin/*

---

## Quality Metrics

### For Admin UI
- [ ] All pages load <2 seconds
- [ ] Navigation responsive across devices
- [ ] Forms validate before submission
- [ ] Error messages clear and actionable

### For Question Generation
- [ ] >95% of generated questions parse successfully
- [ ] ≥90% of Sinhala questions pass quality review
- [ ] ≥90% of diagrams generate and display correctly
- [ ] Zero database encoding issues with Sinhala

### For Student Workflows
- [ ] Quiz timer accurate (±1 second)
- [ ] Auto-submit at time limit works reliably
- [ ] PDF download successful >99% of time
- [ ] Leaderboard loads and filters in <1 second

---

## Timeline Estimate

| Spec | Start | Duration | End |
|------|-------|----------|-----|
| Admin UI | Week 1 Day 1 | 17-23h | Week 1 Day 4 |
| Question Gen | Week 1 Day 1 | 14-19h | Week 1 Day 4 |
| Student Workflows | Week 2 Day 1 | TBD | TBD |
| **Total MVP** | | **31-42 hours** | **~2 weeks** |

(Estimates for two developers working in parallel)

---

## Known Constraints & Decisions

### Why Delimiter Format (not JSON)?
- JSON breaks with Sinhala characters due to encoding issues
- Delimiters are more forgiving of AI output variations
- Easier to debug and manually fix if needed
- Proven to work with current AI models

### Why Gemini 3.1 Flash Lite (not 2.5 Pro)?
- 2.5 Pro: Free tier quota exhausted
- 3.1 Flash Lite: Widely available, good quality, cost-effective
- Image generation: Separate model (Gemini 2.5 Flash Image)

### Why Manual Admin Review?
- 100% automation risky for educational content
- Admin provides quality control for Sinhala questions
- Builds trust in system accuracy

### Why Not Canvas Rendering?
- Initial attempt caused Windows build issues
- Gemini 2.5 Flash Image more reliable
- Produces better educational diagrams

---

## Next Steps

1. **Review & Approve**: User reviews these three specs
2. **Begin Admin UI** (Spec 1): Start with Phase 1 (Navigation)
3. **Begin Question Gen** (Spec 2): Verify models work, start Phase 1 tests
4. **Complete Student Workflows Spec** (Spec 3): Design phase
5. **PR & Code Review**: Each major phase gets reviewed before proceeding

---

## References

- **Admin UI Spec**: `admin-ui-improvements/`
- **Question Gen Spec**: `question-generation-images/`
- **Student Workflows Spec**: `student-workflows/`
- **Environment Config**: `.env` file with all API keys
- **Database Schema**: `prisma/schema.prisma`

---

## Questions & Clarifications

Before starting implementation, confirm:

1. **UI Framework**: Confirmed using Tailwind CSS, no external component libraries
2. **Sinhala Support**: Critical feature, manual QA required
3. **Image Format**: PNG diagrams generated on-demand (not pre-stored)
4. **PDF Download**: jsPDF for frontend, ReportLab considered for backend
5. **Timing**: Is 2-week MVP timeline acceptable?

---

**Created**: July 27, 2024
**Status**: Ready for Review
**Next Action**: User approval + start implementation
