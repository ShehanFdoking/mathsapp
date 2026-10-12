# Question Generation with Image Support Spec

## Overview
Implement robust question generation for math questions in English and Sinhala, with automatic diagram image generation for geometry questions.

## Scope
- Question generation API using Gemini 3.1 Flash Lite
- Parsing questions from delimiter-based text format
- Diagram image generation using Gemini 2.5 Flash Image
- Support for both MCQ (quiz) and STRUCTURED (paper) question types
- Difficulty levels: EASY, MEDIUM, HARD

## Key Components
1. **Question Generator** - Calls Gemini to generate questions
2. **Delimiter Parser** - Extracts questions from text format
3. **Diagram Generator** - Calls image API for geometric figures
4. **Admin UI** - Review and approve/reject questions
5. **Database** - Stores questions with approval status

## Status
To be detailed in design.md and implemented in tasks.md
