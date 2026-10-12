# Question Generation with Images - Design

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Admin UI: Question Generation & Review                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Generate Form:                Generate Progress:      │
│  ├─ Lesson (dropdown)        ├─ Status text           │
│  ├─ Type (MCQ/Structured)    ├─ Progress bar          │
│  ├─ Difficulty (Easy/Med/Hard│ └─ Time estimate       │
│  ├─ Count (5-100)            │                        │
│  └─ [Generate Button]        │ Question Cards:        │
│                              ├─ Question text        │
│                              ├─ Options (MCQ)        │
│                              ├─ [Generate Image]btn  │
│                              ├─ [Approve/Reject]     │
│                              └─ [Edit] button        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│ Backend: Generation Pipeline                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ POST /api/admin/questions/generate                      │
│   ├─ Fetch lesson text from DB                         │
│   ├─ For count = 1 to N (batch of 10):                 │
│   │   ├─ Call generateQuestionBatch()                  │
│   │   │   └─ AI calls Gemini 3.1 Flash Lite           │
│   │   │       └─ Returns delimiter-formatted text      │
│   │   ├─ Parse with parseQuestionsFromText()           │
│   │   ├─ Store questions (status=PENDING) in DB        │
│   │   └─ Wait 1.5 seconds                             │
│   └─ Return count of generated                         │
│                                                          │
│ POST /api/admin/generate-diagram                        │
│   ├─ Receive [description1, description2, ...]         │
│   ├─ For each description:                             │
│   │   ├─ Call generateGeometricDiagram()              │
│   │   │   └─ AI calls Gemini 2.5 Flash Image         │
│   │   │       └─ Returns base64 image data             │
│   │   └─ Wait 1.1 seconds (rate limit)                │
│   └─ Return { images: {desc1: img1, ...} }            │
│                                                          │
│ PATCH /api/admin/questions/[id]                        │
│   ├─ Validate action (approve/reject)                  │
│   ├─ Update question status                            │
│   └─ Return updated question                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│ Database: Question Storage                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Question Table:                                        │
│  ├─ id: UUID                                           │
│  ├─ lessonId: UUID (FK)                                │
│  ├─ question: TEXT (Sinhala or English)               │
│  ├─ type: ENUM (MCQ | STRUCTURED)                      │
│  ├─ difficulty: ENUM (EASY | MEDIUM | HARD)            │
│  ├─ status: ENUM (PENDING | APPROVED | REJECTED)       │
│  ├─ options: JSON (for MCQ: [opt1, opt2, opt3, opt4]) │
│  ├─ answerIndex: INTEGER (0-3 for MCQ)                │
│  ├─ modelAnswer: TEXT (for STRUCTURED)                │
│  ├─ explanation: TEXT (for MCQ)                        │
│  ├─ hint: TEXT                                         │
│  ├─ marks: INTEGER (1-8)                              │
│  ├─ grade: INTEGER (6-11)                             │
│  ├─ medium: ENUM (ENGLISH | SINHALA)                   │
│  └─ createdAt: TIMESTAMP                               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Question Generation Flow

### Text Generation Pipeline

```
1. Admin clicks "Generate 10 Questions"
   ├─ Select: Lesson, Type (MCQ), Difficulty (Easy), Count (10)
   └─ System starts generation

2. Backend: generateQuestionBank()
   ├─ For i = 1 to 10 (batch size 10):
   │   ├─ Call generateQuestionBatch()
   │   │   ├─ Build prompt with:
   │   │   │   ├─ Lesson title
   │   │   │   ├─ Lesson content (first 8000 chars)
   │   │   │   ├─ Difficulty guide (EASY = direct application)
   │   │   │   ├─ Language instruction (Sinhala or English)
   │   │   │   ├─ Avoid list (questions not to repeat)
   │   │   │   └─ Format template (delimiter-based)
   │   │   │
   │   │   ├─ Call AI:
   │   │   │   ai.models.generateContent({
   │   │   │     model: "gemini-3.1-flash-lite",
   │   │   │     contents: prompt
   │   │   │   })
   │   │   │
   │   │   ├─ Receive response with delimiters:
   │   │   │   ---QUESTION START---
   │   │   │   <question text>
   │   │   │   ---QUESTION---
   │   │   │   <repeat question>
   │   │   │   ---OPTION_A---
   │   │   │   <option A>
   │   │   │   ---OPTION_B---
   │   │   │   <option B>
   │   │   │   ... etc
   │   │   │   ---ANSWER---
   │   │   │   A
   │   │   │   ---QUESTION END---
   │   │   │
   │   │   └─ Parse with parseQuestionsFromText()
   │   │       ├─ Split by "---QUESTION START---"
   │   │       ├─ For each block:
   │   │       │   ├─ Extract fields with extractDelimited()
   │   │       │   ├─ Map answer (A/B/C/D → 0/1/2/3)
   │   │       │   └─ Create GeneratedQuestion object
   │   │       └─ Return array of questions
   │   │
   │   ├─ Store in DB:
   │   │   prisma.question.createMany({
   │   │     data: [
   │   │       {
   │   │         question: "...",
   │   │         options: [...],
   │   │         answerIndex: 0,
   │   │         explanation: "...",
   │   │         hint: "...",
   │   │         marks: 1,
   │   │         status: "PENDING",
   │   │         ...
   │   │       },
   │   │       ...
   │   │     ]
   │   │   })
   │   │
   │   └─ Wait 1500ms before next batch

3. UI Updates
   ├─ Show: "Generated 10 questions ✓"
   └─ Refresh question list with PENDING status
```

---

## Image Generation Flow

### Diagram Image Generation

```
1. Admin reviews question with diagram:
   Question: "What is the area of this trapezoid?"
   [DIAGRAM: Trapezoid with parallel sides: top=3cm, bottom=8cm, height=5cm]
   Options: A) 27.5 cm² | B) 24 cm² | C) 55 cm² | D) 40 cm²

2. Admin sees [DIAGRAM: ...] tag
   ├─ Displays button: "Generate Image"
   └─ Clicks button

3. Frontend extracts description:
   extractDiagramDescriptions(question)
   ├─ Regex: /\[DIAGRAM:\s*([^\]]+)\]/g
   └─ Returns: ["Trapezoid with parallel sides: top=3cm, bottom=8cm, height=5cm"]

4. Frontend calls API:
   POST /api/admin/generate-diagram
   {
     "descriptions": ["Trapezoid with parallel sides..."]
   }

5. Backend: generateDiagramBatch()
   ├─ For each description:
   │   ├─ Call generateGeometricDiagram(description)
   │   │   ├─ Build prompt:
   │   │   │   "Generate a clean, educational geometric diagram...
   │   │   │    Description: Trapezoid with parallel sides..."
   │   │   │
   │   │   ├─ Call AI:
   │   │   │   ai.models.generateContent({
   │   │   │     model: "gemini-2.5-flash-image",
   │   │   │     contents: prompt
   │   │   │   })
   │   │   │
   │   │   └─ Extract image:
   │   │       response.candidates[0].content.parts[0].inlineData
   │   │       ├─ imageData.mimeType (e.g. "image/png")
   │   │       └─ imageData.data (base64 string)
   │   │       └─ Return: "data:image/png;base64,..."
   │   │
   │   └─ Wait 1100ms (rate limit)
   │
   └─ Return: { images: { "Trapezoid with...": "data:image/png;..." } }

6. Frontend displays image:
   ├─ Replace [DIAGRAM: ...] with <img src="data:image/png;...">
   ├─ Show image in styled container
   └─ Show buttons:
       ├─ [Regenerate] - calls API again
       ├─ [Accept] - keeps image with question
       └─ [Reject] - removes diagram, approves anyway

7. Admin approves question:
   ├─ Click "Approve" on question card
   └─ PATCH /api/admin/questions/[id]
       {
         "action": "approve"
       }
   └─ Question status changed to APPROVED
   └─ Question available to students
```

---

## Delimiter-Based Question Format

### Why Delimiters?
- **Avoids JSON parsing issues** with Sinhala/non-ASCII characters
- **More forgiving** of model formatting variations
- **Easier to debug** - can read raw response
- **Fallback parsing** - if some delimiters missing, can extract partial data

### Format Specification

```
---QUESTION START---
<exact question text here>
---QUESTION---
<repeat of question text for clarity>
---OPTION_A---
<Option A text>
---OPTION_B---
<Option B text>
---OPTION_C---
<Option C text>
---OPTION_D---
<Option D text>
---ANSWER---
<A or B or C or D - single letter>
---EXPLANATION---
<Step-by-step explanation of correct answer>
---HINT---
<Short hint without giving away answer>
---MARKS---
<Number: 1 for easy, 2 for medium, 3 for hard>
---QUESTION END---
```

### Example (MCQ)

```
---QUESTION START---
Find the derivative of f(x) = 3x² + 2x
---QUESTION---
Find the derivative of f(x) = 3x² + 2x
---OPTION_A---
f'(x) = 6x + 2
---OPTION_B---
f'(x) = 6x
---OPTION_C---
f'(x) = 3x + 2
---OPTION_D---
f'(x) = 9x + 2
---ANSWER---
A
---EXPLANATION---
Using power rule: d/dx(x^n) = n·x^(n-1)
For 3x²: d/dx = 3·2·x^1 = 6x
For 2x: d/dx = 2
Combined: f'(x) = 6x + 2
---HINT---
Remember the power rule for each term separately
---MARKS---
2
---QUESTION END---
```

### Example (STRUCTURED)

```
---QUESTION START---
A trapezoid has parallel sides of 5cm and 8cm, with height 4cm. Calculate the area.
---QUESTION---
A trapezoid has parallel sides of 5cm and 8cm, with height 4cm. Calculate the area.
---MODEL_ANSWER---
Area of trapezoid = (1/2) × (sum of parallel sides) × height
= (1/2) × (5 + 8) × 4
= (1/2) × 13 × 4
= 26 cm²
---HINT---
Use the trapezoid area formula: A = (1/2)(b₁ + b₂)h
---MARKS---
3
---QUESTION END---
```

### Parsing Logic

```typescript
function extractDelimited(text: string, key: string): string {
  const startMarker = `---${key}---`;
  const start = text.indexOf(startMarker);
  if (start === -1) return ""; // Not found
  
  const contentStart = start + startMarker.length;
  const nextMarker = text.indexOf("---", contentStart);
  
  if (nextMarker === -1) {
    return text.substring(contentStart).trim();
  }
  
  return text.substring(contentStart, nextMarker).trim();
}
```

---

## Error Handling Strategy

### Generation Failures

```
Scenario 1: Network/API Error
├─ Attempt 1: Generate fails with network timeout
├─ Retry after 2 seconds
├─ Attempt 2: Still fails
└─ Show error: "Failed to generate questions. Please try again."

Scenario 2: Rate Limited (429 error)
├─ Show: "API rate limit exceeded. Please wait 1 minute."
└─ Disable generate button for 60 seconds

Scenario 3: Invalid Response
├─ AI returns garbled/malformed text
├─ Delimiter extraction returns empty questions
├─ Show: "Generated 5 of 10 questions (5 failed to parse)"
└─ Continue with next batch

Scenario 4: Partial Batch Failure
├─ Generate 10 questions
├─ 7 parse successfully, 3 fail
├─ Store 7 successfully
└─ Show: "Generated 7 of 10 questions successfully"
```

---

## Sinhala Language Handling

### Quality Assurance

```
1. Generation Time
   ├─ Model: Gemini 3.1 Flash Lite (works with Sinhala)
   └─ Language instruction: "Write everything in Sinhala."

2. Character Encoding
   ├─ Prompt: UTF-8 encoded
   ├─ API Response: UTF-8 (handled by SDK)
   ├─ Database: UTF-8 collation
   └─ Frontend: Set <meta charset="utf-8">

3. Quality Review
   ├─ First batch: Manual review by admin
   ├─ Check: Grammar, spelling, mathematical accuracy
   ├─ If issues: Note for prompt improvement
   └─ Iterate on prompt until quality acceptable

4. Numeric Format
   ├─ Numbers: Use standard Arabic numerals (1, 2, 3)
   ├─ NOT Sinhala numerals (to avoid model confusion)
   └─ Measurements: Include unit (cm, m, degrees, etc.)
```

---

## Performance Considerations

### API Call Spacing

```
Gemini 3.1 Flash Lite (Text Generation):
├─ Quota: Generous (1M tokens/month free tier)
├─ Spacing: 1.5 seconds between batches
├─ Max concurrent: 1 (sequential for stability)
└─ Fallback: If fails, skip batch

Gemini 2.5 Flash Image (Diagram Generation):
├─ Quota: Limited (50 requests/day free tier)
├─ Spacing: 1.1 seconds between images
├─ Max concurrent: 1 (sequential)
└─ Fallback: If fails, show text description
```

### UI Responsiveness

```
Generation Progress:
├─ Show status: "Generating batch 3 of 5..."
├─ Show progress: [████████░░░░] 65%
├─ Show time: "Est. 2 minutes remaining"
└─ Allow cancel: [Stop Generation] button

Image Generation:
├─ Show spinner while loading
├─ Non-blocking: Questions load while images generate
├─ Show: "Image generating..." message
└─ Once ready: Fade in image smoothly
```

---

## Data Flow Diagrams

### Question Storage in DB

```
GeneratedQuestion (in memory)
├─ question: "Find the derivative..."
├─ options: ["6x + 2", "6x", "3x + 2", "9x + 2"]
├─ answerIndex: 0
├─ explanation: "Using power rule..."
├─ hint: "Remember power rule..."
├─ marks: 2
└─ [saved to DB]
         │
         ▼
Question (DB record)
├─ id: "uuid-1234..."
├─ lessonId: "uuid-5678..."
├─ question: "Find the derivative..."
├─ type: "MCQ"
├─ difficulty: "MEDIUM"
├─ options: ["6x + 2", "6x", "3x + 2", "9x + 2"]
├─ answerIndex: 0
├─ explanation: "Using power rule..."
├─ hint: "Remember power rule..."
├─ marks: 2
├─ grade: 9
├─ medium: "ENGLISH"
├─ status: "PENDING"
└─ createdAt: "2024-07-27T12:34:56Z"
```
