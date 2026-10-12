# Grade Maths — Learning Platform (Grades 6–11)

A mobile-friendly Next.js app where students register by grade/medium, study
AI-generated lesson notes, chat with an AI tutor, generate randomized practice
papers and quizzes from the actual textbook content, and compete on a
GPA-style leaderboard. Admins upload textbook PDFs and the system automatically
detects lessons and generates smart notes.

## AI question bank & admin review pipeline

This is the core content pipeline, and it matches a strict rule: **students
never see an AI-generated question that an admin hasn't approved.**

1. **Upload textbook** (admin) — PDF stored, text extracted page-by-page.
2. **AI understands the book** — Gemini 2.5 Pro reads the extracted text and
   splits it into lessons (title + page range), detecting formulas, worked
   examples, exercises, and objectives along the way (`segmentTextbookIntoLessons`
   in `lib/ai.ts`).
3. **AI generates questions** — from the admin's lesson page, click **Manage
   question bank**, pick a difficulty and a count, and Gemini generates that
   many MCQs *with* the correct answer, a step-by-step explanation, and a
   hint — all grounded in that lesson's actual textbook text
   (`generateQuestionBank` → `/api/admin/questions/generate`). Large counts
   are generated in batches of 10 (to stay under output/rate limits) and
   saved as they come back, so nothing is lost if a run is interrupted.
4. **Admin review** — `/admin/questions/[lessonId]` shows every question,
   filterable by difficulty and status (Pending / Approved / Rejected). Admin
   can **Approve**, **Edit** (question text, options, correct answer,
   explanation, hint, marks) then approve, or **Reject** each one.
5. **Storage** — only the question row itself is stored (with a `status`
   field); nothing extra needed since edits happen in place before approval.
6. **Student requests a paper or quiz** — `/api/generate-paper` and
   `/api/generate-quiz` pull a **random sample of only `APPROVED`** questions
   matching the selected lessons + difficulty. If there aren't enough
   approved questions yet, the student gets a clear message asking them to
   check back once the admin has approved more — the system never falls back
   to generating live, unreviewed content for students.

Because of this, **the AI never talks to students directly for questions** —
only for the lesson chatbot and smart notes, which are lower-stakes and
regenerable by the admin at any time.

## Sinhala textbook OCR fallback

Many Sri Lankan textbook PDFs are typeset with legacy, non-Unicode Sinhala
fonts (FM Abhaya, Malithi Web, etc.) where each glyph maps to an arbitrary
Latin code point. Normal PDF text extraction on these comes out garbled
(e.g. "iuñ;sh" instead of an actual Sinhala word) — this is not fixable by
reading the text layer differently, since the font itself doesn't use real
Sinhala Unicode codepoints.

For Sinhala uploads, `app/api/admin/upload-textbook/route.ts` now checks
each page's extracted text for a healthy proportion of real Sinhala Unicode
characters (`lib/pdf-extract.ts` → `looksLikeGarbledSinhala`). Any page that
fails this check gets OCR'd instead (`lib/pdf-ocr.ts`) — rendering the page
to an image and reading it with Tesseract's Sinhala-trained model, which
works from the rendered glyphs directly and isn't affected by the font's
internal encoding. Well-encoded pages are left alone (fast path); only
genuinely garbled pages pay the OCR cost (a few seconds each), so this
scales reasonably even though OCR itself is slow.

**Windows note**: `canvas` is listed as an *optional* dependency — `npm install`
will succeed even if it fails to build, and the OCR fallback simply won't be
available (uploads/edits still work fine; garbled Sinhala pages just won't
get auto-corrected). Getting `canvas` to actually build on Windows requires
the full GTK/Cairo development toolchain (not just Visual Studio Build
Tools) — see [the official Windows guide](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows)
if you want to attempt it, but it's a heavier install than most of this
project's other dependencies. In practice, the simplest path for most people
is to skip it and use the admin "Edit title/pages" tool (`/admin/textbooks/[grade]/[medium]`)
to manually fix any lesson whose Sinhala text looks garbled after upload.

## Two question types: quiz MCQs vs paper questions

Per-lesson, the question bank now generates and stores two genuinely
different content types (`Question.type` in the schema):

- **MCQ** — quiz questions: 4 options, one correct `answerIndex`, an
  `explanation` of the right answer. Used only by `/api/generate-quiz`.
- **STRUCTURED** — paper/exam questions: open-ended, no options, marked
  against a `modelAnswer` (full worked solution/marking scheme) instead —
  matching how real exam papers are actually written. Used only by
  `/api/generate-paper`, and rendered in the PDF with working space
  proportional to marks, plus a model-answer key at the end.

The admin review page (`/admin/questions/[lessonId]`) has a tab to switch
between generating/reviewing MCQs and paper questions — they're generated,
reviewed, and approved completely separately, since they're different content.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router, TypeScript) | SSR + API routes in one project, great mobile performance |
| Styling | Tailwind CSS | Fast, consistent, mobile-first |
| Database | MongoDB + Prisma ORM | Flexible schema, native array support (great fit for lessonIds/options), easy free-tier hosting via Atlas |
| Auth | NextAuth.js (Credentials) | Student login by phone/email, separate fixed-credential admin login |
| AI | Google Gemini API via `@google/genai` (current unified SDK; `@google/generative-ai` is deprecated) — model `gemini-3.5-flash-lite` | Reads textbooks, splits them into lessons, writes questions with full solutions/explanations/hints, generates smart notes, powers the lesson chatbot |
| PDF generation | `pdf-lib` | Renders generated papers/notes as downloadable PDFs |
| PDF text extraction | `pdfjs-dist` | Extracts per-page text from uploaded textbook PDFs |
| Sinhala OCR fallback | `tesseract.js` + `canvas` | Reads pages where legacy-font Sinhala text extraction comes out garbled |
| File storage | S3-compatible bucket (AWS S3 / Cloudflare R2) via `@aws-sdk/client-s3` | Stores textbook PDFs and generated paper/note PDFs |
| State/data fetching | TanStack Query | Client-side data fetching where needed |

## Project structure

```
app/
  page.tsx                     landing page
  register/, login/            student auth pages
  dashboard/                   grade-specific lesson list
  lesson/[id]/                 smart note + AI chatbot
  create-paper/, my-papers/    paper generation + downloads
  create-notes/                combined notes PDF generation
  quiz/, quiz/[id]/            quiz setup + timed MCQ taking
  leaderboard/                 GPA-style leaderboard, per grade
  admin/login/, admin/dashboard/
  admin/textbooks/[grade]/[medium]/   textbook upload + lesson review
  admin/students/              student management
  api/...                      all backend routes (see below)
lib/
  auth.ts            NextAuth config (student + admin providers)
  prisma.ts          Prisma client singleton
  ai.ts              All Gemini API calls (notes, chatbot, question gen, textbook segmentation)
  pdf-generate.ts    Paper/note PDF rendering (pdf-lib)
  pdf-extract.ts     Textbook PDF -> per-page text (pdfjs-dist)
  storage.ts         S3 upload/signed URL helpers
  grading.ts         Difficulty -> credits/duration, GPA-style average calc
components/
  BottomNav.tsx, LessonChat.tsx, MarkdownLite.tsx
prisma/
  schema.prisma      Full data model
  seed.ts            Optional demo data
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables** — copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — a MongoDB connection string. Easiest option: create a free
     cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas), add a database
     user + allow your IP, then copy the connection string (looks like
     `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/mathsapp?retryWrites=true&w=majority`).
     A local `mongodb://localhost:27017/mathsapp` also works if you have MongoDB installed.
   - `NEXTAUTH_SECRET` — any long random string (`openssl rand -base64 32`, or on
     Windows: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
   - `NEXTAUTH_URL` — match whatever port your dev server actually runs on, e.g. `http://localhost:3000`
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` — defaults to `admin` / `admin123` as requested
   - `GEMINI_API_KEY` — free, from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   - `S3_*` — an S3-compatible bucket for storing PDFs (Cloudflare R2 has a generous free tier)

3. **Push the schema to MongoDB**
   MongoDB has no migration engine in Prisma, so instead of `migrate dev` you push
   the schema directly:
   ```bash
   npx prisma db push
   npx prisma generate
   npm run seed   # optional demo students
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

5. **Log in as admin** at `/admin/login` with `admin` / `admin123`, go to
   **Upload Text Books**, pick a grade + medium, and upload each part of the
   textbook PDF. The system will:
   - extract text page by page,
   - ask Claude to detect lesson/chapter boundaries (title + page range) — this
     handles textbooks split into multiple parts, since you upload and process
     each part separately and lessons accumulate in order,
   - save each lesson with its page range and raw text.
   Then click **Generate smart note** on each lesson to produce the
   student-facing note (grounded in that lesson's actual textbook examples).

6. **Register a student** at `/register`, pick their grade/medium, and their
   dashboard will show the lessons you just uploaded for that grade.

## Key behaviours implemented (per your spec)

- **Registration**: name, age, grade (6–11), medium, school, phone-or-email, password.
- **Dashboard**: shows lessons for the student's own grade/medium only.
- **Lesson page**: AI-generated understandable note (with textbook-grounded worked
  examples) + a chatbot scoped to that lesson's content and chat history.
- **Create paper**: select multiple lessons → choose Easy (30 min) / Medium (45 min)
  / Hard (60 min) → Claude generates a paper whose difficulty and content genuinely
  differ (easy = direct single-concept questions, medium = combined concepts,
  hard = multi-step reasoning) → rendered to PDF → saved under "My Papers" with a
  download link.
- **Create notes**: same lesson-selection flow, merges the selected lessons'
  smart notes into one downloadable PDF.
- **Quiz**: select lessons + difficulty → 10 MCQs, timed (20/30/40 min by
  difficulty), auto-submits when time runs out or on manual submit, shows
  results (score + correct answers) immediately.
- **GPA-style average**: Easy = 2 credits, Medium = 3, Hard = 4. A student's
  average is the credit-weighted mean of all their quiz percentages — exactly
  like a course-credit GPA — computed in `lib/grading.ts`.
- **Leaderboard**: per grade, top 10 by that weighted average, shows name,
  school, and medium; viewable by any logged-in student for any grade.
- **Admin**: fixed `admin`/`admin123` login; "Upload Text Books" nav item with
  a grade × (English/Sinhala) grid; multi-part textbook upload; auto lesson
  detection; per-lesson "view allocated pages as PDF" (extracted live from the
  original textbook) and "generate smart note" actions; student management table.

## Notes on production-readiness

- **Admin credentials**: currently compared against plain env vars per your
  requirement. For real production use, consider hashing them or moving to a
  proper admin accounts table with 2FA.
- **AI generation cost/latency**: paper/quiz/note generation calls Claude
  synchronously inside the API route. For a smoother mobile UX at scale,
  move these to a background job (e.g. a queue) and poll/notify the client
  when ready, rather than blocking the request.
- **Textbook segmentation accuracy**: Claude's lesson-boundary detection from
  raw extracted text works well for typically-formatted textbooks but should
  be spot-checked by the admin after each upload (page ranges are visible and
  can be corrected directly in the DB or via a future "edit lesson" admin UI).
- **Storage**: `lib/storage.ts` targets S3-compatible storage. For local dev
  without a bucket, swap it to write into `/public/uploads` (see the comment
  at the bottom of that file) — just remember serverless hosts have ephemeral
  disks, so switch back to S3/R2 before deploying.
- **MongoDB replica set requirement**: Prisma needs MongoDB running as a replica
  set for transactions and some multi-document writes (e.g. the `createMany` call
  in the chat route). MongoDB Atlas clusters are replica sets by default, so this
  is a non-issue there. If you run MongoDB locally instead, initialize it as a
  single-node replica set (`mongod --replSet rs0` then `rs.initiate()` in `mongosh`),
  or just use Atlas for simplicity.
- **Gemini model/SDK churn**: Google has been rotating Gemini model names and
  SDKs quickly (the 2.x generation, including 2.5 Flash/Pro, is being retired
  for new API keys in favor of 3.x models; the old `@google/generative-ai`
  package is deprecated in favor of `@google/genai`). This app already uses
  the current SDK and a current GA model (`gemini-3.5-flash-lite` in
  `lib/ai.ts`), but if you hit a 404 "model no longer available" error again
  in the future, check [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models)
  for the current model list and swap the `MODEL` constant — nothing else
  in the code needs to change.
- **Schema changed again**: `Question` now has a `type` field (MCQ /
  STRUCTURED) and `options`/`answerIndex` are nullable (structured questions
  don't have them; they use `modelAnswer` instead). Run
  `npx prisma migrate dev` again after pulling these changes. As before, if
  you hit a "drift detected" prompt and don't have real data worth keeping,
  it's safe to accept the reset in development.
- **This scaffold was written without running `npm install` or a dev server**
  (no network access in the environment that generated it), so do a first
  `npm run build` locally and fix any straggling type errors before deploying.
