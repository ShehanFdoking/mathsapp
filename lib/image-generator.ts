/**
 * Extract diagram descriptions from question text
 * CLIENT-SAFE - No API key needed
 */
export function extractDiagramDescriptions(questionText: string): string[] {
    const diagramRegex = /\[DIAGRAM:\s*([^\]]+)\]/g;
    const descriptions: string[] = [];
    let match;

    while ((match = diagramRegex.exec(questionText)) !== null) {
        descriptions.push(match[1].trim());
    }

    return descriptions;
}

/**
 * Generate diagram prompt for AI to include in questions
 * CLIENT-SAFE
 */
export function createDiagramInstructionForAI(): string {
    return `
DIAGRAM INSTRUCTIONS FOR GEOMETRY/VISUAL QUESTIONS:
For ANY question involving shapes, angles, measurements, or geometric reasoning, ALWAYS include a diagram placeholder using this format:

[DIAGRAM: Clear, detailed description of the geometric figure with all measurements and labels]

IMPORTANT: Even simple geometry questions should have diagrams. Examples:
- [DIAGRAM: Trapezoid with parallel sides: top = 3cm, bottom = 8cm, left slant side = 4cm, right slant side = 5cm. All sides labeled with measurements.]
- [DIAGRAM: L-shaped figure: main rectangle 8cm wide × 2cm tall, with two 2cm × 2cm square cutouts at top left and top right. Label all dimensions.]
- [DIAGRAM: Right triangle with base 10cm on the bottom, vertical height 8cm on the left, hypotenuse connecting them. Mark 90° angle at bottom-left. Label all three sides.]
- [DIAGRAM: Circle with radius 5cm. Draw a chord of length 6cm. Mark the radius from center to the chord endpoint.]
- [DIAGRAM: Parallelogram ABCD with base 8cm, slant height 6cm. Draw height as dashed line perpendicular to base. Label all sides and height.]

The diagram will be automatically generated as an image for the student to help them understand the question.
`;
}
