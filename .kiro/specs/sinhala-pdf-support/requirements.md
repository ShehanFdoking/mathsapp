# Requirements Document

## Introduction

The Sinhala PDF Support feature enables proper rendering of Sinhala Unicode characters in generated PDF documents (practice papers and lesson notes) by fetching and embedding the Noto Sans Sinhala font from Google Fonts CDN at runtime. Currently, Sinhala text is sanitized to placeholder characters ('?') with disclaimers. This feature will render authentic Sinhala text while maintaining English text rendering with Helvetica, and will fail fast with error messages if font resources are unavailable.

## Glossary

- **PDF_Generator**: The system component responsible for creating PDF documents from structured content (papers, notes)
- **Font_Loader**: The subsystem that fetches and prepares font files for embedding
- **Google_Fonts_CDN**: The external Google Fonts content delivery network serving font files
- **Noto_Sans_Sinhala**: The Google font family supporting Sinhala Unicode characters (U+0D80 to U+0DFF)
- **Sinhala_Text**: Text content containing one or more Unicode characters in the Sinhala range (U+0D80-U+0DFF)
- **English_Text**: Text content containing only Latin characters, numbers, and common punctuation (U+0020-U+007E, U+00A0-U+00FF)
- **Font_Fetch_Failure**: A condition where the Google Fonts CDN request fails due to network errors, timeouts, or resource unavailability
- **Document_Generation_Request**: A user-initiated action to create a PDF for a practice paper or lesson note

## Requirements

### Requirement 1: Runtime Font Loading

**User Story:** As a system administrator, I want the PDF generator to fetch fonts dynamically at runtime, so that font files are not bundled into the application and stay up-to-date.

#### Acceptance Criteria

1.1. WHEN a Document_Generation_Request is received, THE Font_Loader SHALL fetch Noto_Sans_Sinhala font files from Google_Fonts_CDN before embedding fonts

1.2. THE Font_Loader SHALL fetch Noto_Sans_Sinhala font files via HTTPS requests to Google_Fonts_CDN

1.3. THE Font_Loader SHALL set a timeout of 10 seconds for font fetch requests

1.4. THE Font_Loader SHALL cache fetched font data in memory for the duration of the process lifecycle

### Requirement 2: Dual-Font Text Rendering

**User Story:** As a student, I want Sinhala text to display correctly in PDF documents while English text maintains its current appearance, so that I can read content in both languages naturally.

#### Acceptance Criteria

2.1. WHEN rendering text identified as Sinhala_Text, THE PDF_Generator SHALL use Noto_Sans_Sinhala font

2.2. WHEN rendering text identified as English_Text, THE PDF_Generator SHALL use Helvetica font

2.3. WHEN rendering text that contains both Sinhala and English characters, THE PDF_Generator SHALL segment the text and apply Noto_Sans_Sinhala to Sinhala_Text segments and Helvetica to English_Text segments

2.4. THE PDF_Generator SHALL detect Sinhala_Text by checking for Unicode characters in the range U+0D80 to U+0DFF

2.5. THE PDF_Generator SHALL preserve existing text formatting properties including size, weight, and color when switching between fonts

### Requirement 3: Disclaimer Removal

**User Story:** As a student, I want to see Sinhala content without disclaimers, so that I can read documents without confusion or visual clutter.

#### Acceptance Criteria

3.1. WHEN Sinhala_Text is successfully rendered with Noto_Sans_Sinhala, THE PDF_Generator SHALL NOT include disclaimer messages about Sinhala character limitations

3.2. THE PDF_Generator SHALL remove the function that sanitizes Sinhala characters to placeholder symbols

3.3. THE PDF_Generator SHALL NOT display messages stating "Sinhala characters shown as '?'" in generated documents

3.4. THE PDF_Generator SHALL NOT display messages stating "refer to online version for proper display" in generated documents

### Requirement 4: Font Fetch Error Handling

**User Story:** As a developer, I want the system to fail immediately with clear error messages when fonts cannot be loaded, so that I can diagnose and resolve font loading issues quickly.

#### Acceptance Criteria

4.1. IF Font_Fetch_Failure occurs, THEN THE PDF_Generator SHALL terminate document generation and return an error

4.2. IF Font_Fetch_Failure occurs, THEN THE PDF_Generator SHALL return an error message containing the text "Failed to load Sinhala font from Google Fonts CDN"

4.3. IF Font_Fetch_Failure occurs, THEN THE PDF_Generator SHALL include the HTTP status code or network error details in the error message

4.4. IF Font_Fetch_Failure occurs, THEN THE PDF_Generator SHALL log the font fetch URL, error type, and timestamp for debugging

4.5. IF Font_Fetch_Failure occurs, THEN THE PDF_Generator SHALL NOT fall back to character sanitization or placeholder rendering

4.6. IF Font_Fetch_Failure occurs, THEN THE PDF_Generator SHALL NOT return a partial or incomplete PDF document

### Requirement 5: Font Resource Specification

**User Story:** As a developer, I want the system to use the correct font variant from Google Fonts, so that Sinhala text renders consistently across all documents.

#### Acceptance Criteria

5.1. THE Font_Loader SHALL fetch Noto Sans Sinhala Regular weight (400) from Google_Fonts_CDN

5.2. THE Font_Loader SHALL request the TrueType font format (.ttf) from Google_Fonts_CDN

5.3. THE Font_Loader SHALL construct font URLs using the pattern "https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala"

5.4. THE Font_Loader SHALL parse the CSS response from Google_Fonts_CDN to extract the direct font file URL

### Requirement 6: Backward Compatibility

**User Story:** As a user, I want documents without Sinhala text to continue rendering as they do currently, so that existing functionality remains unaffected.

#### Acceptance Criteria

6.1. WHEN a document contains no Sinhala_Text, THE PDF_Generator SHALL use only Helvetica and Helvetica-Bold fonts

6.2. WHEN a document contains no Sinhala_Text, THE PDF_Generator SHALL NOT fetch Noto_Sans_Sinhala from Google_Fonts_CDN

6.3. THE PDF_Generator SHALL maintain existing page layout, margins, line heights, and text wrapping behavior for English_Text

6.4. THE PDF_Generator SHALL preserve the existing Writer class interface for generatePaperPdf, generateMcqPaperPdf, and generateNotePdf functions
