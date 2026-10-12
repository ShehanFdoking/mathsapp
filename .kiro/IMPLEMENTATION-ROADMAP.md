# GoMath Implementation Roadmap

## Current Status

**Completed**:
✓ Fixed AI model selection issues (model availability, quota constraints)
✓ Implemented delimiter-based question parsing (robust Sinhala support)
✓ AI question generation API working with Gemini 3.1 Flash Lite
✓ Diagram image generation API ready (Gemini 2.5 Flash Image)
✓ Question review UI partially implemented
✓ Environment configured (API keys, database, auth)

**In Progress**:
→ Creating comprehensive specifications for implementation

**Not Started**:
□ Admin dashboard UI improvements
□ Student workflows (papers, quizzes, notes, leaderboard)

---

## Spec Structure

Three focused, detailed specifications have been created:

### 1. Admin UI Improvements (`admin-ui-improvements/`)
- **Effort**: 17-23 hours
- **Status**: Ready to implement
- **Files**: 
  - `requirements.md` - Detailed feature requirements
  - `design.md` - Architecture, UI layouts, data flows
  - `tasks.md` - 6 implementation phases with subtasks

**Quick Summary**:
- Admin navigation bar (sidebar with Dashboard, Upload, Manage, Students, Logout)
- Grade selection grid (6-11 with Sinhala/English buttons)
- Textbook upload flow with lesson separation
- Lesson management (edit, delete, manage questions)
- Question review with image generation

**Phases**:
1. Navigation & Layout (3-4h)
2. Textbook Upload Flow (4-5h)
3. Lesson Management (3-4h)
4. Question Review & Images (3-4h)
5. Sinhala Support (2-3h)
6. Polish & Testing (2-3h)

---

### 2. Question Generation with Images (`question-generation-images/`)
- **Effort**: 14-19 hours
- **Status**: Ready to implement (core logic exists, needs verification)
- **Files**:
  - `requirements.md` - Quality standards, API specs
  - `design.md` - Generation pipeline, parsing format, error handling
  - `tasks.md` - 8 implementation phases with verification steps

**Quick Summary**:
- Verify existing question generation works (Gemini 3.1 Flash Lite)
- Test delimiter-based parsing with English & Sinhala
- Verify image generation API (Gemini 2.5 Flash Image)
- Enhance UI for image preview and regeneration
- Manual QA on Sinhala questions (critical quality gate)
- Error handling and edge cases
- Performance optimization if needed
- Documentation

**Phases**:
1. Core Generation Verification (2-3h)
2. Image Generation Verification (2-3h)
3. Question Storage & Retrieval (1.5-2h)
4. UI Integration & Polish (2-3h)
5. Sinhala Quality Assurance (2-3h)
6. Error Handling & Edge Cases (1.5-2h)
7. Performance & Optimization (1-1.5h)
8. Documentation & Cleanup (1-1.5h)

**Key Innovation**: Delimiter-based format instead of JSON
- Avoids Sinhala text encoding issues in JSON
- More forgiving of AI output variations
- Easier to debug and manually fix

---

### 3. Student Workflows (`student-workflows/`)
- **Effort**: TBD (design phase)
- **Status**: Framework only, full spec in progress
- **Files**:
  - `README.md` - Overview (created)
  - `requirements.md` - To be detailed
  - `design.md` - To be detailed
  - `tasks.md` - To be detailed

**Quick Summary** (from user requirements):
- Student dashboard (grade-specific landing)
- Create papers (select lessons, choose difficulty, generate PDF)
- Create quizzes (timed, MCQ-based, instant grading, auto-submit)
- Create notes (lesson summaries with worked examples)
- Leaderboard (student rankings, filterable)

---

## Implementation Priority

### Must-Have (MVP)
1. **Admin UI Improvements** - Needed to manage content
2. **Question Generation** - Core feature for exam/quiz creation
3. **Student Dashboard** - Basic navigation and features

### Should-Have (Phase 2)
- Student papers (exam creation)
- Student quizzes (timed assessments)
- Leaderboard

### Nice-to-Have (Phase 3)
- Smart notes generation
- Chat with AI tutor
- Student performance analytics
- Mobile app

---

## Next Steps for You

### Immediate (Today)
1. Review the three specs:
   - `admin-ui-improvements/README.md`
   - `question-generation-images/README.md`
   - `student-workflows/README.md`

2. Check the overview:
   - `SPEC-OVERVIEW.md` - High-level summary

3. Provide feedback:
   - Any scope changes?
   - Any priorities different?
   - Any concerns about architecture?

### Before Implementation Starts
1. Confirm spec approach (break into 3 separate features? ✓ Confirmed)
2. Approve timeline (17-23h for Admin UI, 14-19h for Questions)
3. Identify any blockers or constraints

### Week 1 (Recommended)
1. **Admin UI - Phase 1**: Build navigation and layout
2. **Question Gen - Phase 1**: Verify AI generation works
3. Both can run in parallel if you have 2 developers

---

## How to Use These Specs

### For Developers
Each spec has three documents:

1. **requirements.md** - Read this first
   - What features are needed?
   - What are acceptance criteria?
   - What's out of scope?

2. **design.md** - Understand the architecture
   - How do components interact?
   - What data flows where?
   - What's the database schema?
   - UI mockups/layouts

3. **tasks.md** - Implementation guide
   - Break into phases
   - Each phase has specific tasks
   - Clear acceptance criteria for each task
   - Time estimates

### For Project Managers
- Check `SPEC-OVERVIEW.md` for timeline (31-42 hours for MVP)
- Each spec lists phases and estimated hours
- Tasks are ordered logically with dependencies

### For QA/Testing
- Each task has acceptance criteria
- Specs include testing checklists (questions, student workflows)
- Key quality metrics defined upfront

---

## Key Technical Decisions

### 1. Delimiter Format (Not JSON)
**Why**: Sinhala text causes encoding issues in JSON
- JSON spec doesn't handle Unicode well when values contain special chars
- Delimiters are simpler and more robust
- Example format:
```
---QUESTION START---
<question>
---OPTION_A---
<A>
...
---QUESTION END---
```

### 2. Two-Model AI Strategy
- **Text Generation**: Gemini 3.1 Flash Lite (stable, available)
- **Image Generation**: Gemini 2.5 Flash Image (separate quota)
- Tried Gemini 2.5 Pro but free tier quota exhausted

### 3. Manual Admin Review
- All generated content requires admin approval before students see it
- Especially important for Sinhala questions (grammar/accuracy)
- Admin can edit or reject questions

### 4. On-Demand Image Generation
- Diagrams generated when admin reviews question (not stored in DB)
- Saves storage, guarantees fresh images
- Falls back to text description if image generation fails

---

## Environment & Dependencies

### Already Configured
```
Database: PostgreSQL (DATABASE_URL in .env)
Auth: NextAuth.js with admin credentials
Storage: Cloudflare R2 (S3-compatible)
APIs: Gemini (text + image models)
```

### Node Packages
```
@google/genai - Gemini API
@prisma/client - Database ORM
next-auth - Authentication
jspdf - PDF generation (client)
```

### Not Yet Installed
- Report Lab or python-based PDF backend (optional, for server-side PDF gen)
- Canvas (attempted but removed due to Windows build issues)

---

## File Organization

```
.kiro/specs/
├── SPEC-OVERVIEW.md (← Start here)
├── admin-ui-improvements/
│   ├── README.md
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── question-generation-images/
│   ├── README.md
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
└── student-workflows/
    ├── README.md
    ├── requirements.md (to be created)
    ├── design.md (to be created)
    └── tasks.md (to be created)

app/
├── admin/
│   ├── layout.tsx (navigation - to build)
│   ├── dashboard/
│   ├── textbooks/
│   ├── lessons/
│   └── questions/
├── api/
│   ├── admin/
│   │   ├── upload-textbook/
│   │   ├── lessons/
│   │   ├── questions/
│   │   └── generate-diagram/
│   └── (student routes - to build)
└── (student pages - to build)

lib/
├── ai.ts (question generation - exists)
├── image-generator.ts (diagram helpers - exists)
├── server/image-generator-server.ts (image API - exists)
└── (other utilities)
```

---

## Success Criteria

### Admin UI
✓ Navigation appears on all admin pages
✓ Can upload textbook and see lessons appear
✓ Can edit lesson title and page ranges
✓ Can delete lesson
✓ Can navigate to question review page
✓ Can generate questions (MCQ and Structured)
✓ Can approve/reject/edit questions
✓ Can generate and preview diagram images

### Question Generation
✓ English questions generate correctly
✓ Sinhala questions generate correctly and are quality-acceptable (≥90%)
✓ MCQ format with 4 options works
✓ Structured format with model answer works
✓ Batch generation works with proper spacing
✓ Questions store in DB with all fields
✓ Diagram descriptions generate images
✓ No database encoding issues
✓ Error handling is graceful

### Student Workflows (When Built)
✓ Student can login
✓ Student can select lessons and create paper
✓ Paper generates with random questions and downloads as PDF
✓ Student can create quiz with time limit
✓ Quiz timer works and auto-submits
✓ Student sees results
✓ Student can view leaderboard

---

## Known Limitations & Workarounds

| Issue | Status | Workaround |
|-------|--------|-----------|
| Sinhala in JSON | ✓ Solved | Use delimiter format |
| Gemini 2.5 Pro quota | ✓ Solved | Use Gemini 3.1 Flash Lite |
| Gemini 2.5 Flash unavailable | ✓ Solved | Use Gemini 3.1 Flash Lite for backup |
| Canvas on Windows | ✓ Accepted | Use Gemini 2.5 Flash Image |
| Image storage | Deferred | Generate on-demand (no storage) |
| Adaptive difficulty | Out of scope | Future feature |

---

## Support & Documentation

### For Questions During Implementation
1. Refer to spec's **design.md** for architecture questions
2. Refer to spec's **tasks.md** for implementation questions
3. Check existing code in `lib/ai.ts` for examples

### For Code Review
1. Verify spec requirements are met
2. Check acceptance criteria in tasks.md
3. Ensure error handling is in place

### For Testing
1. Use acceptance criteria from task definitions
2. Follow testing checklists in spec files
3. Manual QA important for Sinhala content

---

## Timeline Summary

| Week | Focus | Hours | Deliverable |
|------|-------|-------|------------|
| Week 1 | Admin UI (P1-3) + Question Gen (P1) | 15-18h | Working admin nav + lesson mgmt + verified AI |
| Week 1 | Admin UI (P4-6) + Question Gen (P2-5) | 15-18h | Working question generation + UI + Sinhala QA |
| Week 2 | Question Gen (P6-8) + Student WF (design) | 10-15h | Polished questions + student spec ready |
| Week 2+ | Student Workflows (impl) | 20-30h+ | Papers, quizzes, notes, leaderboard |
| **MVP Total** | | **31-42 hours** | **Fully functional admin + student platform** |

---

## Final Checklist Before Starting

- [ ] All three spec files reviewed and approved
- [ ] Timeline expectations clear (31-42 hours for MVP)
- [ ] Tech stack confirmed (Next.js, Prisma, Gemini, Tailwind)
- [ ] Sinhala quality expectations understood (manual QA required)
- [ ] Database accessible and configured
- [ ] API keys available and working
- [ ] Development environment running (npm run dev)
- [ ] Git repo ready for feature branches

---

**Status**: Ready to implement
**Last Updated**: July 27, 2024
**Next Action**: User approval + start Phase 1 of Admin UI Spec
