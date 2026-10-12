# Image Generation Setup Guide

## Overview

GoMath uses a **two-tier image generation system** for creating educational math diagrams:

1. **Google Imagen** (Primary) - Better quality, more specialized for diagrams
2. **Gemini 2.5 Flash Image** (Fallback) - Reliable backup if Imagen unavailable

When an admin reviews a math question with a diagram placeholder (`[DIAGRAM: ...]`), they can click **"Generate Image"** to create a clean 2D educational diagram.

---

## System Architecture

```
Admin Question Review Page
         │
         ▼
    [Generate Image] Button
         │
         ▼
/api/admin/generate-diagram (POST)
         │
         ▼
    generateDiagramBatch()
         │
         ├─→ Try Google Imagen (if configured)
         │   └─→ Success: Return image ✓
         │   └─→ Fail: Fallback to Gemini
         │
         └─→ Try Gemini 2.5 Flash Image
             └─→ Success: Return image ✓
             └─→ Fail: Show error

Result: Admin sees image, can Regenerate, Download, or Approve
```

---

## Setting Up Google Imagen (Optional)

### Prerequisites
- Google Cloud account
- Enable Vertex AI API
- Service account with Imagen permissions

### Step 1: Get Google Cloud Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Vertex AI API**:
   - Search "Vertex AI" in APIs
   - Click "Enable"

4. Create a Service Account:
   - Go to **IAM & Admin** → **Service Accounts**
   - Click **Create Service Account**
   - Name: `imagen-service`
   - Grant role: `Vertex AI User`
   - Create a key (JSON format)
   - Save the JSON file

5. Extract credentials from JSON:
   - `project_id`: Your Google Cloud project ID
   - Create an access token from the service account

### Step 2: Configure Environment Variables

Add to `.env`:

```env
# Google Imagen (Optional - for primary image generation)
GOOGLE_IMAGEN_API_KEY="<your-access-token>"
GOOGLE_PROJECT_ID="<your-project-id>"
```

**Note**: Leave these empty to use only Gemini fallback (works fine, no additional setup needed).

### Step 3: Test Imagen Integration

Generate a question with a diagram:
```
[DIAGRAM: A square with side length 4cm and a vertical dotted line through the center]
```

Click **"Generate Image"** button:
- If Imagen configured: Uses Imagen API first
- If Imagen fails: Automatically falls back to Gemini
- If both fail: Shows error with description text

---

## Using Gemini Fallback (Recommended for MVP)

Gemini 2.5 Flash Image is already configured and works reliably.

**No additional setup needed** - it works out of the box:

1. Diagram descriptions included in generated questions via `[DIAGRAM: ...]`
2. Admin clicks "Generate Image"
3. System calls Gemini 2.5 Flash Image API
4. Clean diagram displayed in UI
5. Admin can regenerate or download

### Gemini Limitations
- Less specialized for technical diagrams than Imagen
- May need more detailed prompts for complex figures
- Still produces acceptable educational diagrams

---

## Image Generation Workflow

### For Admins

1. **Review Question**: Question has `[DIAGRAM: description...]` tag
2. **Click Generate**: See blue box with "✨ Generate Image" button
3. **Wait**: Spinner shows while generating (5-15 seconds)
4. **View Result**: Image displays in white box
5. **Options**:
   - ✓ **Approve**: Accept question with diagram
   - 🔄 **Regenerate**: Try again (new API call)
   - ⬇ **Download**: Save PNG to computer
   - ✗ **Reject**: Remove diagram, approve question without it

### For Question Generation

When Gemini generates questions, it includes diagram descriptions:

```
Question: "Looking at the figure above, is the dotted line an axis of symmetry?"

[DIAGRAM: A square with a dotted line drawn vertically through the center. 
The square has a side length of 4cm. Show the dotted line as an axis of symmetry.]

Model Answer: "Yes, it is an axis of symmetry because when the figure is folded 
along that dotted line, the two resulting parts coincide with each other."
```

---

## Prompt Format for Diagrams

Questions should include diagram descriptions like this:

```
[DIAGRAM: <detailed description of the geometric figure>]
```

### Example Prompts

**Good ✓**:
```
[DIAGRAM: A square with side length 4cm. Draw a vertical dotted line through 
the center. Label "4cm" on the sides. Mark the vertical line as an axis of symmetry.]
```

**Good ✓**:
```
[DIAGRAM: A right triangle. Base = 10cm (horizontal, labeled), 
Height = 8cm (vertical, labeled), Hypotenuse connecting them. 
Mark the 90° angle at the corner. Label all three sides.]
```

**Good ✓**:
```
[DIAGRAM: A trapezoid. Parallel sides: top = 3cm, bottom = 8cm. 
Left side = 4cm 6mm, right side = 5cm. Label all measurements. 
Draw height line with dashed line to show perpendicular distance.]
```

**Poor ✗** (too vague):
```
[DIAGRAM: A shape]
```

**Poor ✗** (too complex):
```
[DIAGRAM: A 3D cube with rotation, perspective view, shadows, 
colors, and multiple views]
```

---

## API Endpoints

### Generate Diagram Images

**Endpoint**: `POST /api/admin/generate-diagram`

**Request**:
```json
{
  "descriptions": [
    "A square with side 4cm and vertical dotted line through center",
    "A right triangle with base 10cm and height 8cm"
  ]
}
```

**Response** (Success):
```json
{
  "images": {
    "A square with side 4cm...": "data:image/png;base64,iVBORw0KG...",
    "A right triangle with...": "data:image/png;base64,iVBORw0KG..."
  }
}
```

**Response** (Partial Failure):
```json
{
  "images": {
    "A square with side 4cm...": "data:image/png;base64,iVBORw0KG..."
  }
}
```
(Second diagram failed, but first succeeded)

**Error** (All Failed):
```json
{
  "error": "Failed to generate diagrams"
}
```

---

## Rate Limiting

Both Imagen and Gemini APIs have rate limits:

- **Imagen**: ~60 requests/minute (Google Cloud)
- **Gemini**: ~60 requests/minute (free tier)

The system automatically adds **1.1 second delays** between requests to stay within limits.

**Batch Behavior**:
- 3 images: ~3-4 seconds total
- 10 images: ~12-15 seconds total

---

## Troubleshooting

### "Generating diagram..." spinner doesn't stop

**Problem**: Image generation timed out or failed silently

**Solution**:
1. Check server logs for errors
2. Click **Regenerate** button
3. If persistent, check API keys and quotas

### Image looks wrong / doesn't match description

**Problem**: AI misinterpreted the diagram description

**Solution**:
1. Click **Regenerate** to try again
2. If still wrong, consider:
   - Editing question to clarify diagram description
   - Rejecting diagram and approving question without it
   - Manual editing of diagram description for next attempt

### "Google Imagen API key or Project ID not configured"

**Problem**: Imagen credentials missing

**Solution**:
- This is normal if you didn't set up Imagen
- System automatically falls back to Gemini
- No action needed - diagrams will still generate

### API rate limit exceeded

**Problem**: Generated too many diagrams too quickly

**Solution**:
- Wait 1-2 minutes before generating more
- Increase delay in `lib/server/image-generator-server.ts` if needed

---

## Configuration Options

### Using Only Gemini (Recommended for MVP)

Leave Imagen variables empty in `.env`:
```env
GOOGLE_IMAGEN_API_KEY=""
GOOGLE_PROJECT_ID=""
```

System will skip Imagen and use Gemini directly.

### Forcing Gemini Even If Imagen Configured

In code: Call with `useImagen: false`:
```typescript
await generateGeometricDiagram(description, false);
```

### Monitoring API Usage

Check server logs to see which API is being used:
```
Attempting to generate image with Google Imagen...  // Trying Imagen
Successfully generated image with Google Imagen      // Worked

// OR

Imagen generation failed, falling back to Gemini     // Imagen failed
Generating image with Gemini 2.5 Flash Image        // Using fallback
Successfully generated image with Gemini             // Worked
```

---

## Implementation Details

### Key Files

- **`lib/server/image-generator-server.ts`**: Core generation logic
  - `generateGeometricDiagram()` - Single image
  - `generateDiagramBatch()` - Multiple images
  - `generateWithImagen()` - Imagen API call
  - `generateWithGemini()` - Gemini fallback

- **`app/api/admin/generate-diagram/route.ts`**: API endpoint
  - Receives array of descriptions
  - Calls generateDiagramBatch()
  - Returns images map

- **`app/admin/questions/[lessonId]/page.tsx`**: UI component
  - `QuestionWithDiagram` component
  - Displays images, regenerate button
  - Download functionality

### Flow Diagram

```
Admin clicks "Generate Image"
    ↓
fetch('/api/admin/generate-diagram', {descriptions: [...]})
    ↓
generateDiagramBatch(descriptions, useImagen=true)
    ↓
For each description:
    ├─ Try generateGeometricDiagram(desc, useImagen=true)
    │   ├─ If useImagen=true:
    │   │   └─ generateWithImagen() → Success? Return image
    │   └─ If failed or useImagen=false:
    │       └─ generateWithGemini() → Try Gemini
    ├─ Collect results
    └─ Wait 1.1s before next
    ↓
Return { images: { desc1: img1, desc2: img2, ... } }
    ↓
Frontend displays images in UI
    ↓
Admin can: Approve / Regenerate / Download / Reject
```

---

## Best Practices

1. **Include Detailed Descriptions**: More specific = better images
   - ✓ "A square with 4cm sides and vertical dashed line through center"
   - ✗ "A square with a line"

2. **Include Measurements**: Helps AI create proportional diagrams
   - ✓ "Right triangle: base 10cm, height 8cm"
   - ✗ "Right triangle"

3. **Specify Label Locations**: Clarify what to label
   - ✓ "Label all sides: top=3cm, bottom=8cm, height=5cm"
   - ✗ "Label it"

4. **Use Standard Notation**: Math symbols and conventions
   - ✓ "90° angle", "√", "dashed line", "axis of symmetry"
   - ✗ "right angle", "square root", "dotty line", "mirror line"

5. **Test Diagrams Before Approving**: Regenerate if needed
   - Click Regenerate 2-3 times if image doesn't match
   - Only approve if diagram is correct and educational

---

## Future Enhancements

- [ ] Store generated images in database (currently on-demand)
- [ ] Batch pre-generation for all pending questions
- [ ] Admin preferences for Imagen vs Gemini
- [ ] Image quality settings (size, style, complexity)
- [ ] Custom diagram templates for common math figures
- [ ] Admin dashboard showing API usage and costs

---

**Last Updated**: July 27, 2024
**Status**: Production Ready
