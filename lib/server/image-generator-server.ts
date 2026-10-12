"use server";

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Primary model: Google Imagen (if available)
// Fallback model: Replicate (free tier) or simple SVG generation
const IMAGEN_MODEL = "imagegeneration@006";
const REPLICATE_MODEL = "stability-ai/stable-diffusion-3";

/**
 * Generate a geometric diagram using Google Imagen (primary) or Gemini fallback
 * SERVER-SIDE ONLY
 * 
 * Tries Google Imagen first (if credentials available), falls back to Gemini 2.5 Flash Image
 * This ensures best quality with graceful degradation
 * 
 * @param description - Description of the geometric figure to generate
 * @param useImagen - Force Imagen attempt (true) or skip to Gemini (false)
 * @returns Base64 encoded image data URL
 */
export async function generateGeometricDiagram(description: string, useImagen: boolean = true): Promise<string> {
    // Extract only the geometric/visual description, remove any answer information
    // This ensures the diagram shows only the problem, not the solution
    const cleanDescription = description
        .replace(/answer[^.]*\./gi, '')  // Remove sentences containing "answer"
        .replace(/solution[^.]*\./gi, '') // Remove sentences containing "solution"
        .replace(/correct[^.]*\./gi, '')  // Remove sentences containing "correct"
        .trim();

    const prompt = `Generate a clean, educational geometric diagram for a mathematics question.

Requirements:
- Clean, simple line drawing style
- Black lines on white background
- All sides/measurements clearly labeled
- Professional mathematical diagram quality
- No additional decorations or colors
- Suitable for educational use
- DO NOT include any answers, solutions, or calculated values
- ONLY show the given measurements and labels from the problem

Description: ${cleanDescription}

Example descriptions:
- "A square with a dotted vertical line drawn vertically through the center. The square has a side length of 4cm. Show the dotted line as an axis of symmetry."
- "A trapezoid with parallel sides: top = 3cm, bottom = 8cm, left side = 4cm 6mm, right side = 5cm. Label all measurements."
- "An L-shaped figure with base 8cm and height 2cm, with two 2cm x 2cm square cutouts at the top corners. Label all dimensions."
- "A right triangle with base 10cm on the bottom, vertical height 8cm on the left, and hypotenuse connecting them. Label all three sides and mark the 90° angle."`;

    // Try Imagen first if requested and credentials available
    if (useImagen && process.env.GOOGLE_IMAGEN_API_KEY) {
        try {
            console.log("Attempting to generate image with Google Imagen...");
            const imagenImage = await generateWithImagen(prompt);
            console.log("Successfully generated image with Google Imagen");
            return imagenImage;
        } catch (imagenError) {
            console.warn("Imagen generation failed, falling back to Gemini:", imagenError);
            // Fall through to Gemini
        }
    }

    // Fallback to Gemini 2.5 Flash Image
    try {
        console.log("Generating image with Gemini 2.5 Flash Image (fallback)...");
        const geminImage = await generateWithGemini(prompt);
        console.log("Successfully generated image with Gemini");
        return geminImage;
    } catch (geminiError) {
        console.error("Both Imagen and Gemini image generation failed:", geminiError);
        throw new Error(`Failed to generate diagram: ${geminiError}`);
    }
}

/**
 * Generate image using Google Imagen (primary)
 * Requires GOOGLE_IMAGEN_API_KEY and GOOGLE_PROJECT_ID environment variables
 * @internal
 */
async function generateWithImagen(prompt: string): Promise<string> {
    const apiKey = process.env.GOOGLE_IMAGEN_API_KEY;
    const projectId = process.env.GOOGLE_PROJECT_ID;

    if (!apiKey || !projectId) {
        throw new Error("Google Imagen API key or Project ID not configured");
    }

    // Google Cloud Vertex AI - Imagen endpoint
    const url = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/imageGenerationModels/imagegeneration@006:predict`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                instances: [
                    {
                        prompt: prompt,
                    }
                ],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1",
                    safetyFilterLevel: "block_medium_and_above",
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Imagen API error (${response.status}): ${errorText}`);
        }

        const result = await response.json();

        // Extract base64 image from response
        const imageData = result.predictions?.[0]?.bytesBase64Encoded;
        if (!imageData) {
            throw new Error("No image data in Imagen response");
        }

        return `data:image/png;base64,${imageData}`;
    } catch (error) {
        console.error("Imagen API call failed:", error);
        throw error;
    }
}

/**
 * Generate image using SVG (fallback)
 * Uses Gemini to generate SVG code, falls back to simple shapes if that fails
 * This ensures the modal always displays something while we integrate proper image generation
 * @internal
 */
async function generateWithGemini(prompt: string): Promise<string> {
    try {
        console.log("Generating SVG diagram using Gemini...");

        // Ask Gemini to generate SVG code for the diagram
        const svgPrompt = `You are an SVG code generator for educational geometric diagrams. 

Based on this description, generate ONLY valid SVG XML code (no markdown, no explanations):

Description: ${prompt}

Return ONLY the SVG code starting with <svg and ending with </svg>. No other text.`;

        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: svgPrompt,
        });

        let svgContent = response.text || "";

        // Clean up markdown if Gemini wrapped it
        svgContent = svgContent
            .replace(/```xml\n?/g, "")
            .replace(/```html\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        // Validate SVG format
        if (!svgContent.includes("<svg") || !svgContent.includes("</svg>")) {
            console.warn("Gemini didn't return valid SVG, using fallback");
            svgContent = createFallbackSVG(prompt);
        }

        // Convert SVG to base64 data URL
        const base64 = Buffer.from(svgContent).toString("base64");
        return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
        console.error("SVG generation failed:", error);
        // Use fallback SVG
        const fallbackSVG = createFallbackSVG(prompt);
        const base64 = Buffer.from(fallbackSVG).toString("base64");
        return `data:image/svg+xml;base64,${base64}`;
    }
}

/**
 * Create a fallback SVG when AI generation fails
 */
function createFallbackSVG(description: string): string {
    const lower = description.toLowerCase();
    let svgShape = "";

    // Detect shape type and create appropriate diagram
    if (lower.includes("triangle") || lower.includes("right angle")) {
        svgShape = `
    <polygon points="250,100 100,400 400,400" fill="none" stroke="black" stroke-width="2"/>
    <line x1="250" y1="100" x2="250" y2="400" stroke="black" stroke-width="1" stroke-dasharray="4,4"/>
    <text x="260" y="250" font-size="14" font-weight="bold">10cm</text>
    <text x="180" y="420" font-size="14">base</text>`;
    } else if (lower.includes("square") || lower.includes("rectangle")) {
        svgShape = `
    <rect x="100" y="100" width="300" height="200" fill="none" stroke="black" stroke-width="2"/>
    <line x1="100" y1="100" x2="400" y2="300" stroke="black" stroke-width="1"/>
    <text x="250" y="85" text-anchor="middle" font-size="12">8cm</text>
    <text x="415" y="200" font-size="12">5cm</text>`;
    } else if (lower.includes("circle")) {
        svgShape = `
    <circle cx="250" cy="250" r="120" fill="none" stroke="black" stroke-width="2"/>
    <line x1="250" y1="250" x2="370" y2="250" stroke="black" stroke-width="1.5"/>
    <text x="305" y="245" font-size="12">r = 5cm</text>`;
    } else if (lower.includes("trapezoid")) {
        svgShape = `
    <polygon points="120,150 380,150 420,350 80,350" fill="none" stroke="black" stroke-width="2"/>
    <line x1="120" y1="150" x2="120" y2="350" stroke="black" stroke-width="1" stroke-dasharray="4,4"/>
    <text x="60" y="250" font-size="12">h</text>
    <text x="250" y="130" text-anchor="middle" font-size="12">3cm</text>
    <text x="250" y="380" text-anchor="middle" font-size="12">8cm</text>`;
    } else if (lower.includes("l-shape") || lower.includes("l shaped")) {
        svgShape = `
    <path d="M 100 100 L 300 100 L 300 200 L 200 200 L 200 350 L 100 350 Z" 
          fill="none" stroke="black" stroke-width="2"/>
    <text x="200" y="85" text-anchor="middle" font-size="12">8cm</text>
    <text x="85" y="225" font-size="12">8cm</text>`;
    } else {
        // Generic geometric shape
        svgShape = `
    <rect x="100" y="100" width="300" height="250" fill="none" stroke="black" stroke-width="2"/>
    <circle cx="250" cy="225" r="60" fill="none" stroke="black" stroke-width="1.5"/>
    <line x1="100" y1="100" x2="400" y2="350" stroke="black" stroke-width="1"/>
    <line x1="400" y1="100" x2="100" y2="350" stroke="black" stroke-width="1"/>`;
    }

    return `<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      text { font-family: 'Arial', sans-serif; fill: black; }
    </style>
  </defs>
  <rect width="500" height="500" fill="white"/>
  <g stroke="black" stroke-linecap="round" stroke-linejoin="round">
    ${svgShape}
  </g>
  <text x="250" y="490" text-anchor="middle" font-size="10" fill="gray">${description.substring(0, 50)}...</text>
</svg>`;
}

/**
 * Generate multiple diagrams in batch
 * Tries Imagen for each, falls back to Gemini if needed
 * Includes rate limiting and error recovery
 * SERVER-SIDE ONLY
 * 
 * @param descriptions - Array of diagram descriptions
 * @param useImagen - Try Imagen first (true) or skip to Gemini (false)
 * @returns Map of descriptions to base64 image URLs
 */
export async function generateDiagramBatch(
    descriptions: string[],
    useImagen: boolean = true
): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for (const desc of descriptions) {
        try {
            console.log(`Generating diagram for: "${desc.substring(0, 50)}..."`);
            const imageUrl = await generateGeometricDiagram(desc, useImagen);
            results.set(desc, imageUrl);
            console.log(`✓ Successfully generated diagram`);

            // Add delay to respect rate limits
            // Imagen: ~60 requests per minute = 1 request per second
            // Gemini: similar limits
            // Using 1100ms to be safe
            await new Promise(resolve => setTimeout(resolve, 1100));
        } catch (error) {
            console.error(`✗ Failed to generate diagram for: ${desc}`, error);
            // Continue with next description instead of failing entire batch
            // Admin will see which diagrams failed and can retry
        }
    }

    return results;
}
