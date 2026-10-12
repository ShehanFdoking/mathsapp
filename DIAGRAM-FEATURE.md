# Diagram Feature for Mathematical Questions

## Overview
The system now supports generating and rendering geometric diagrams directly in mathematical questions. This allows questions to include visual figures like rectangles, trapezoids, triangles, and composite shapes.

## How It Works

### 1. Question Generation with Diagrams
When generating questions, Gemini 3.1 Flash-Lite will include diagram specifications in the question text using this format:

```
Find the perimeter of the following figure.
[DIAGRAM: {type: "trapezoid", dimensions: {top: "3cm 2mm", bottom: "8cm 3mm", leftSide: "4cm 6mm", rightSide: "5cm"}, labels: {top: "3cm 2mm", bottom: "8cm 3mm", left: "4cm 6mm", right: "5cm"}}]
```

### 2. Supported Diagram Types

#### Rectangle
```json
{
  "type": "rectangle",
  "dimensions": {
    "width": "8cm",
    "height": "2cm"
  },
  "labels": {
    "top": "8cm",
    "left": "2cm"
  }
}
```

#### Triangle
```json
{
  "type": "triangle",
  "dimensions": {
    "bottom": "10cm",
    "height": "8cm"
  },
  "labels": {
    "bottom": "10cm",
    "leftSide": "9cm",
    "rightSide": "9cm"
  }
}
```

#### Trapezoid
```json
{
  "type": "trapezoid",
  "dimensions": {
    "top": "3cm 2mm",
    "bottom": "8cm 3mm",
    "leftSide": "4cm 6mm",
    "rightSide": "5cm"
  },
  "labels": {
    "top": "3cm 2mm",
    "bottom": "8cm 3mm",
    "left": "4cm 6mm",
    "right": "5cm"
  }
}
```

#### Composite Shape (L-shaped, etc.)
```json
{
  "type": "composite",
  "dimensions": {
    "segments": [
      {"width": "8cm", "height": "2cm"},
      {"width": "2cm", "height": "2cm", "position": "top-left-cutout"}
    ]
  },
  "labels": {
    "bottom": "8cm",
    "side1": "2cm"
  }
}
```

### 3. Rendering Process

1. **AI generates question** with `[DIAGRAM: {...}]` tag
2. **Frontend parses** the diagram specification
3. **Canvas renders** the diagram with proper dimensions and labels
4. **Question displays** with the rendered figure

## Files Modified

### New Files
- `lib/diagram-generator.ts` - Diagram generation utilities
- `components/DiagramRenderer.tsx` - React component to render diagrams on canvas

### Modified Files
- `lib/ai.ts` - Updated prompts to include diagram instructions
- `app/admin/questions/[lessonId]/page.tsx` - Added diagram parsing and rendering

## Example Usage

When generating questions, the AI will automatically include diagrams for geometry problems:

**Question Text:**
```
Find the perimeter of the following figure.
[DIAGRAM: {type: "trapezoid", dimensions: {top: "3cm 2mm", bottom: "8cm 3mm", leftSide: "4cm 6mm", rightSide: "5cm"}, labels: {top: "3cm 2mm", bottom: "8cm 3mm", left: "4cm 6mm", right: "5cm"}}]
```

**Rendered Output:**
- Question text: "Find the perimeter of the following figure."
- Visual diagram showing a trapezoid with all sides labeled

## Benefits

1. **Visual Learning** - Students can see the exact figure being referenced
2. **No Ambiguity** - Measurements are clearly labeled on the diagram
3. **Consistent Format** - All diagrams follow the same styling
4. **Programmatic** - Diagrams are generated from specifications, not uploaded images

## Future Enhancements

- [ ] Support for circles and ellipses
- [ ] Support for coordinate geometry graphs
- [ ] Support for number lines
- [ ] Support for angle measurements
- [ ] Export diagrams as SVG for better quality
- [ ] Interactive diagrams (drag vertices, change dimensions)

## Testing

To test the diagram feature:

1. Generate questions for a geometry lesson
2. Check the question text includes `[DIAGRAM: ...]` tags
3. View the questions in the admin panel
4. Verify diagrams render correctly with all labels

## Notes

- Measurements support formats like "3cm 2mm", "8cm", "5cm"
- Labels are automatically positioned around the shape
- Diagrams scale to fit a 400x300px canvas
- All diagrams use black stroke with white background for clarity
