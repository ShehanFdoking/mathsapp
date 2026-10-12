# Textbook Processing Improvements Spec

This spec addresses critical weaknesses in the textbook processing pipeline:

## Problems to Solve

### 1. Lesson Separation (Issue #1)
**Current:** Lesson separation misses textbook order, misses lessons, doesn't track actual textbook page numbers properly.

**Impact:** Students may miss lessons, page references are incorrect, multi-part textbooks aren't handled.

### 2. Sinhala Text Handling (Issue #2)
**Current:** Lesson names don't display properly in Sinhala, translation and text style is poor.

**Impact:** Sinhala-medium students can't properly use the system, AI-generated content may be garbled.

### 3. Figure Handling in Questions (Issue #3)
**Current:** Question generation doesn't properly handle figures - questions may reference figures without describing them.

**Impact:** Students can't answer questions without seeing original figures, questions are incomplete.

## Spec Structure

This spec follows Kiro's requirements → design → tasks workflow:

1. **requirements.md** - What needs to be fixed (business requirements)
2. **design.md** - How to fix it (technical design with code examples)
3. **tasks.md** - Step-by-step implementation tasks
4. **README.md** - This file

## How to Use This Spec

1. **Review requirements** - Ensure the requirements match your needs
2. **Review design** - Check the technical approach is sound
3. **Review tasks** - Track implementation progress
4. **Implement tasks** - Follow the step-by-step instructions
5. **Test** - Verify all acceptance criteria are met

## Prerequisites

- Working knowledge of Next.js 14
- Understanding of PDF.js and Tesseract.js
- Access to Google Gemini API
- Database access for schema updates

## Estimated Effort

- Phase 1 (Lesson Segmentation): 8-12 hours
- Phase 2 (Sinhala Text): 6-8 hours
- Phase 3 (Figure Handling): 8-10 hours
- Phase 4 (Testing): 4-6 hours

**Total:** ~26-36 hours

## Related Files

### Modified Files
- `lib/ai.ts` - Enhanced prompts and lesson segmentation
- `lib/pdf-extract.ts` - Textbook page detection, figure detection
- `lib/pdf-ocr.ts` - Enhanced OCR configuration
- `app/api/admin/upload-textbook/route.ts` - Remove page limits
- `app/globals.css` - Sinhala font support
- `app/admin/questions/[lessonId]/page.tsx` - Figure notices

### Created Files
- None (all changes to existing files)

## Known Challenges

1. **Token Limits:** Processing 200+ page textbooks may hit AI token limits - consider pagination
2. **Canvas Installation:** Windows users need Python and build tools for canvas package
3. **Figure Detection:** Detecting figures in scanned PDFs is complex - may need heuristics
4. **Sinhala Fonts:** Legacy font encoding may require OCR fallback for all pages

## Next Steps

1. Review this spec with the team
2. Prioritize tasks based on urgency
3. Assign tasks to developers
4. Begin implementation
5. Test incrementally with real textbooks

## Questions?

Contact the spec author or raise an issue in the repository.
