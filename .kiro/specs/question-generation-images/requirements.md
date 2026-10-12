# Question Generation with Images - Requirements

## 1. Question Generation

### Requirement 1.1: Question Types
- **MCQ (Multiple Choice)**: 
  - 4 options, one correct answer
  - Clear explanation of correct answer
  - Hint without revealing answer
  - 1-3 marks per question
- **STRUCTURED (Essay/Paper)**:
  - Open-ended question
  - Full worked solution (model answer/marking scheme)
  - Hint for student
  - 1-8 marks per question
- **Priority**: P0 (core feature)

### Requirement 1.2: Difficulty Levels
- **EASY**: 
  - Direct application of single concept
  - Minimal steps (1-2)
  - Clear wording
  - 1 mark MCQ, 1-2 marks structured
- **MEDIUM**:
  - Combines 1-2 concepts
  - Moderate steps (3-4)
  - Some interpretation required
  - 2 marks MCQ, 2-4 marks structured
- **HARD**:
  - Multi-step problem solving
  - Combines multiple concepts
  - Requires deeper reasoning
  - 3 marks MCQ, 4-8 marks structured
- **Priority**: P0

### Requirement 1.3: Language Support
- **English**: Generate questions in English
- **Sinhala**: Generate questions in Sinhala with proper grammar
- **Both**: Independently selectable per lesson
- **Character Encoding**: Preserve UTF-8/Unicode for Sinhala
- **Priority**: P0 (critical for market differentiation)

### Requirement 1.4: Batch Generation
- **Count**: Generate 5-100 questions per batch
- **Avoid Duplicates**: Don't repeat recently generated questions
- **Spacing**: 1.5-2 second delay between API calls
- **Retry**: If one batch fails, skip and continue with next
- **Progress**: Show status to admin during generation
- **Priority**: P0

---

## 2. Diagram/Image Support

### Requirement 2.1: Diagram Detection
- **Format**: Questions include `[DIAGRAM: description]` placeholder
- **When Generated**: AI includes this when geometry question needs visual
- **Example**: `[DIAGRAM: Right triangle with base 10cm, height 8cm, hypotenuse labeled. Mark 90° angle.]`
- **Priority**: P0

### Requirement 2.2: Image Generation
- **API**: Gemini 2.5 Flash Image
- **Input**: Diagram description text
- **Output**: Clean 2D mathematical diagram as image
- **Style**: Black lines on white background, professional appearance
- **Timing**: Optional - generated on-demand during admin review
- **Priority**: P0

### Requirement 2.3: Image Generation UX
- **Flow**:
  1. Admin reviews question with `[DIAGRAM: ...]` tag
  2. Clicks "Generate Image" button
  3. Shows loading spinner
  4. On success: displays generated image
  5. Admin can: Accept image, Regenerate, Reject and approve anyway
- **Rate Limit**: 1-2 second minimum between regenerate attempts
- **Fallback**: If image gen fails, show description text instead
- **Priority**: P0

---

## 3. Question Generation Quality

### Requirement 3.1: Correctness
- **Math Accuracy**: All answers must be mathematically correct
- **Explanation Quality**: Step-by-step, easy to follow
- **Hint Usefulness**: Guides without giving away answer
- **Priority**: P0 (critical - affects student learning)

### Requirement 3.2: Variety
- **No Repetition**: Generated questions should be diverse
- **Avoid Recent**: If generating second batch, don't repeat first batch
- **Concept Coverage**: Questions should test different aspects of lesson
- **Priority**: P1 (nice-to-have, use prompting guidance)

### Requirement 3.3: Sinhala-Specific Quality
- **Grammar**: Proper Sinhala grammar and spelling
- **Numerals**: Use correct Sinhala/Arabic numerals as appropriate
- **Context**: Relevant to Sinhala curriculum and culture
- **Manual Review**: Admin should review Sinhala questions before approval
- **Priority**: P0 (market critical)

---

## 4. Database & Storage

### Requirement 4.1: Question Storage
- **Model**: Store in Prisma `Question` table
- **Fields**:
  - `question` (text) - question text
  - `options` (JSON array) - for MCQ only
  - `answerIndex` (integer) - which option is correct (0-3)
  - `modelAnswer` (text) - for structured only
  - `explanation` (text) - for MCQ
  - `hint` (text) - for both types
  - `marks` (integer) - point value
  - `difficulty` - EASY/MEDIUM/HARD
  - `type` - MCQ/STRUCTURED
  - `status` - PENDING/APPROVED/REJECTED
  - `lessonId` - which lesson
  - `grade`, `medium` - for filtering
- **Priority**: P0

### Requirement 4.2: Image Storage
- **Option A**: Embed in question as base64 (simple, limited scale)
- **Option B**: Store in S3 with reference (scalable, recommended)
- **Current**: Will use Option A for MVP (images are generated on-demand)
- **Priority**: P1 (defer if time-limited)

---

## 5. API Endpoints

### Requirement 5.1: Generate Questions Batch
- **Endpoint**: `POST /api/admin/questions/generate`
- **Input**:
  ```json
  {
    "lessonId": "uuid",
    "type": "MCQ" | "STRUCTURED",
    "difficulty": "EASY" | "MEDIUM" | "HARD",
    "count": 10
  }
  ```
- **Output**: `{ generated: 10 }`
- **Side Effect**: Creates 10 questions with status=PENDING in DB
- **Priority**: P0 (exists, needs verification)

### Requirement 5.2: Generate Diagram Images
- **Endpoint**: `POST /api/admin/generate-diagram`
- **Input**: 
  ```json
  {
    "descriptions": ["description1", "description2"]
  }
  ```
- **Output**: 
  ```json
  {
    "images": {
      "description1": "data:image/png;base64,...",
      "description2": "data:image/png;base64,..."
    }
  }
  ```
- **Priority**: P0 (exists, may need rate limit tuning)

### Requirement 5.3: Review Questions
- **Endpoint**: `PATCH /api/admin/questions/[id]`
- **Input**:
  ```json
  {
    "action": "approve" | "reject",
    "edits": { /* optional modified fields */ }
  }
  ```
- **Output**: `{ status: "approved" | "rejected" }`
- **Side Effect**: Updates status in DB
- **Priority**: P0 (exists)

---

## 6. AI Model Selection

### Requirement 6.1: Text Generation Model
- **Primary**: Gemini 3.1 Flash Lite
- **Reason**: Proven to work, widely available, good balance of speed/quality
- **Backup**: If unavailable, use Gemini 1.5 Flash
- **DO NOT**: Try Gemini 2.5 Pro (quota limited on free tier)
- **Priority**: P0

### Requirement 6.2: Image Generation Model
- **Model**: Gemini 2.5 Flash Image
- **Purpose**: Generate clean 2D math diagrams
- **Separate Quota**: Different from text generation
- **Fallback**: If fails, show text description only
- **Priority**: P0

---

## 7. Error Handling

### Requirement 7.1: Generation Failures
- **Network Error**: Retry once, show error if still fails
- **Rate Limit**: Show message "Please wait before generating more"
- **Invalid Input**: Return 400 with specific error message
- **Unknown Error**: Log full error, show generic message to admin
- **Priority**: P0

### Requirement 7.2: Partial Batch Failures
- **Scenario**: 10 questions requested, 7 generated, 3 failed
- **Behavior**: 
  - Save 7 questions
  - Retry 3 failed ones
  - If all fail, show count: "Generated 7 of 10"
- **Priority**: P1

---

## 8. Performance Requirements

### Requirement 8.1: Generation Speed
- **Single Question**: ~5-10 seconds
- **Batch of 10**: ~20-30 seconds (with 1.5s spacing)
- **UI**: Show progress and estimated time remaining
- **Priority**: P1 (nice-to-have for UX)

### Requirement 8.2: Image Generation Speed
- **Per Image**: ~5-15 seconds
- **Batch of 3**: ~30-60 seconds
- **Non-Blocking**: Don't block question review while generating
- **Priority**: P1

---

## 9. Testing Requirements

### Requirement 9.1: Unit Tests
- Test question parsing (delimiter format)
- Test model selection logic
- Test batch generation loop
- Priority: P2 (defer if time-limited)

### Requirement 9.2: Integration Tests
- Test full generate → approve → store flow
- Test Sinhala questions end-to-end
- Test image generation with diagram descriptions
- Priority: P1

### Requirement 9.3: Manual Testing
- Generate 20 questions (English) and review quality
- Generate 20 questions (Sinhala) and review grammar
- Test image generation with various diagram descriptions
- Test reject/regenerate workflow
- Priority: P0 (must do before shipping)

---

## 10. Constraints & Assumptions

### Assumptions
- Database is UTF-8 encoded (supports Sinhala)
- Gemini APIs have sufficient quota
- Student won't manipulate generated questions before approval
- Admin will review all questions (at least Sinhala ones)

### Constraints
- Free tier API quota limits (managed by spacing)
- Image generation costs money (use sparingly)
- Sinhala language quality depends on Gemini model capability
- Generated questions won't be 100% perfect (admin review needed)

---

## Dependencies

- **Core AI**: `lib/ai.ts` functions (`generateQuestionBatch`, `parseQuestionsFromText`)
- **Images**: `lib/server/image-generator-server.ts` 
- **DB**: Prisma `Question` model
- **APIs**: `/api/admin/questions/generate`, `/api/admin/generate-diagram`
- **UI**: Already partially built in `/admin/questions/[lessonId]`

---

## Out of Scope

- Student question review/feedback
- Adaptive difficulty based on student performance
- Auto-categorization of questions by topic
- Question editing templates
- Batch export of questions
