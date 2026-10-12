# AI Image Generation for Mathematical Questions

## Overview
The system now uses **Gemini 2.5 Flash Image** (nicknamed "Nano Banana") to automatically generate geometric diagrams for mathematics questions. This provides students with visual representations of geometry problems.

## How It Works

### 1. Question Generation
When Gemini 2.5 Flash generates questions, it includes diagram placeholders:

```
Find the perimeter of the following figure.
[DIAGRAM: Trapezoid with parallel sides: top = 3cm 2mm, bottom = 8cm 3mm, left slant side = 4cm 6mm, right slant side = 5cm. All sides labeled with measurements.]
```

### 2. Image Generation
When questions are displayed:
1. System detects `[DIAGRAM: ...]` tags
2. Sends descriptions to Gemini 2.5 Flash Image API
3. Receives generated diagram images
4. Displays images inline with questions

### 3. Rendering
Questions show:
- Question text
- Generated diagram image
- Diagram description as caption

## Models Used

### Gemini 2.5 Flash
- **Purpose:** Text generation (questions, notes, chat)
- **Model:** `gemini-2.5-flash`
- **Files:** `lib/ai.ts`

### Gemini 2.5 Flash Image  
- **Purpose:** Geometric diagram generation
- **Model:** `gemini-2.5-flash-image`
- **Files:** `lib/image-generator.ts`
- **Rate Limit:** 60 requests per minute (free tier)
- **Cost:** ~$0.039 per image (paid tier)

## Files Created/Modified

### New Files
- `lib/image-generator.ts` - Image generation utilities
- `app/api/admin/generate-diagram/route.ts` - API endpoint for diagram generation

### Modified Files
- `lib/ai.ts` - Added diagram instructions to prompts
- `app/admin/questions/[lessonId]/page.tsx` - Added image rendering component

## API Endpoints

### POST /api/admin/generate-diagram
Generates diagrams from descriptions.

**Request:**
```json
{
  "descriptions": [
    "Trapezoid with top = 3cm, bottom = 8cm, left = 4cm, right = 5cm",
    "Right triangle with base 10cm and height 8cm"
  ]
}
```

**Response:**
```json
{
  "images": {
    "Trapezoid with top = 3cm...": "data:image/png;base64,...",
    "Right triangle with base...": "data:image/png;base64,..."
  }
}
```

## Example Usage

### Generated Question
```
(c) Find the perimeters of following figures.

(i) [DIAGRAM: L-shaped figure: main rectangle 8cm wide × 2cm tall, with two 2cm × 2cm square cutouts at top left and top right. Label all dimensions.]

(ii) [DIAGRAM: Trapezoid with parallel sides: top = 3cm 2mm, bottom = 8cm 3mm, left slant side = 4cm 6mm, right slant side = 5cm. All sides labeled with measurements.]
```

### Rendered Output
- Question text: "(c) Find the perimeters of following figures."
- Two generated diagram images with labels
- Students can solve using the visual diagrams

## Rate Limits & Costs

### Free Tier (Google AI Studio)
- **Requests:** 60 per minute
- **Daily:** ~1,500 requests
- **Cost:** Free

### Paid Tier
- **Cost:** $0.039 per image
- **Pricing:** $30 per 1 million output tokens
- **Image Size:** 1290 output tokens per image

## Benefits

1. **Visual Learning** - Students see exact geometric figures
2. **Consistency** - AI-generated diagrams follow mathematical conventions
3. **Scalability** - Automatic generation for thousands of questions
4. **Accuracy** - Measurements and labels are precise
5. **No Manual Work** - No need to draw or upload diagrams manually

## Limitations

1. **Generation Time** - Each image takes ~1-2 seconds to generate
2. **Rate Limits** - Max 60 images per minute (free tier)
3. **Quality** - May not match hand-drawn textbook diagrams exactly
4. **Complex Figures** - Very complex composite shapes may be challenging

## Testing

To test the feature:

1. Generate questions for a geometry lesson
2. Check if questions include `[DIAGRAM: ...]` tags
3. View questions in admin panel
4. Verify images are generated and displayed correctly
5. Check image quality and label accuracy

## Troubleshooting

### Images Not Generating
- Check API key is valid
- Verify rate limits not exceeded
- Check browser console for errors
- Ensure descriptions are clear and detailed

### Poor Image Quality
- Make diagram descriptions more specific
- Include exact measurements and labels
- Specify line drawing style in prompt

### Rate Limit Errors
- Add delays between generations (1100ms)
- Reduce batch sizes
- Consider paid tier for higher limits

## Future Enhancements

- [ ] Cache generated images to avoid regeneration
- [ ] Add image editing capabilities
- [ ] Support for coordinate geometry graphs
- [ ] Support for statistical charts and graphs
- [ ] Interactive diagrams with adjustable measurements
- [ ] Export diagrams as SVG for better quality

## Notes

- Images are generated on-demand when viewing questions
- Original diagram descriptions are preserved in question text
- Fallback to text description if image generation fails
- Admin can review and approve generated images before student use
