/**
 * Diagram generation for mathematical questions
 * Supports geometric shapes, graphs, and mathematical figures
 */

export type DiagramType =
    | "rectangle"
    | "triangle"
    | "circle"
    | "polygon"
    | "trapezoid"
    | "composite_shape"
    | "graph"
    | "number_line";

export interface DiagramSpec {
    type: DiagramType;
    dimensions?: {
        width?: number;
        height?: number;
        radius?: number;
        sides?: number[];
        labels?: Record<string, string>;
    };
    style?: {
        strokeWidth?: number;
        strokeColor?: string;
        fillColor?: string;
        fontSize?: number;
    };
}

/**
 * Generates a URL for a geometric diagram using QuickChart.io
 * This is a free service that renders charts and diagrams
 */
export function generateDiagramUrl(spec: DiagramSpec): string {
    const baseUrl = "https://quickchart.io/chart";

    // Convert diagram spec to Chart.js config
    const chartConfig = diagramSpecToChartConfig(spec);

    // Encode the config
    const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));

    return `${baseUrl}?c=${encodedConfig}&width=400&height=300&backgroundColor=white`;
}

/**
 * Generates SVG markup for a geometric diagram
 * This can be embedded directly in questions
 */
export function generateDiagramSVG(spec: DiagramSpec): string {
    const { type, dimensions, style } = spec;
    const strokeWidth = style?.strokeWidth || 2;
    const strokeColor = style?.strokeColor || "#000000";
    const fillColor = style?.fillColor || "none";
    const fontSize = style?.fontSize || 14;

    let svgContent = "";
    const width = 400;
    const height = 300;
    const centerX = width / 2;
    const centerY = height / 2;

    switch (type) {
        case "rectangle":
            const rectWidth = dimensions?.width || 100;
            const rectHeight = dimensions?.height || 60;
            svgContent = generateRectangle(
                centerX - rectWidth / 2,
                centerY - rectHeight / 2,
                rectWidth,
                rectHeight,
                dimensions?.labels || {},
                strokeWidth,
                strokeColor,
                fillColor,
                fontSize
            );
            break;

        case "triangle":
            svgContent = generateTriangle(
                centerX,
                centerY,
                dimensions?.sides || [100, 100, 100],
                dimensions?.labels || {},
                strokeWidth,
                strokeColor,
                fillColor,
                fontSize
            );
            break;

        case "trapezoid":
            const sides = dimensions?.sides || [80, 120, 50, 50];
            svgContent = generateTrapezoid(
                centerX,
                centerY,
                sides,
                dimensions?.labels || {},
                strokeWidth,
                strokeColor,
                fillColor,
                fontSize
            );
            break;

        case "composite_shape":
            // For complex shapes like the L-shaped figure in the image
            svgContent = generateCompositeShape(
                centerX,
                centerY,
                dimensions?.sides || [],
                dimensions?.labels || {},
                strokeWidth,
                strokeColor,
                fillColor,
                fontSize
            );
            break;

        default:
            svgContent = `<text x="${centerX}" y="${centerY}" text-anchor="middle">Unsupported diagram type</text>`;
    }

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${svgContent}
  </svg>`;
}

function generateRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    labels: Record<string, string>,
    strokeWidth: number,
    strokeColor: string,
    fillColor: string,
    fontSize: number
): string {
    return `
    <rect x="${x}" y="${y}" width="${width}" height="${height}" 
          stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="${fillColor}" />
    
    <!-- Top label -->
    ${labels.top ? `<text x="${x + width / 2}" y="${y - 10}" text-anchor="middle" font-size="${fontSize}">${labels.top}</text>` : ""}
    
    <!-- Bottom label -->
    ${labels.bottom ? `<text x="${x + width / 2}" y="${y + height + 20}" text-anchor="middle" font-size="${fontSize}">${labels.bottom}</text>` : ""}
    
    <!-- Left label -->
    ${labels.left ? `<text x="${x - 10}" y="${y + height / 2}" text-anchor="end" font-size="${fontSize}">${labels.left}</text>` : ""}
    
    <!-- Right label -->
    ${labels.right ? `<text x="${x + width + 10}" y="${y + height / 2}" text-anchor="start" font-size="${fontSize}">${labels.right}</text>` : ""}
  `;
}

function generateTriangle(
    centerX: number,
    centerY: number,
    sides: number[],
    labels: Record<string, string>,
    strokeWidth: number,
    strokeColor: string,
    fillColor: string,
    fontSize: number
): string {
    const [a, b, c] = sides;
    const height = Math.sqrt(c * c - (a * a) / 4);

    const x1 = centerX - a / 2;
    const y1 = centerY + height / 2;
    const x2 = centerX + a / 2;
    const y2 = centerY + height / 2;
    const x3 = centerX;
    const y3 = centerY - height / 2;

    return `
    <polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" 
             stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="${fillColor}" />
    
    <!-- Side labels -->
    ${labels.side1 ? `<text x="${(x1 + x2) / 2}" y="${y1 + 20}" text-anchor="middle" font-size="${fontSize}">${labels.side1}</text>` : ""}
    ${labels.side2 ? `<text x="${(x2 + x3) / 2 + 15}" y="${(y2 + y3) / 2}" text-anchor="start" font-size="${fontSize}">${labels.side2}</text>` : ""}
    ${labels.side3 ? `<text x="${(x3 + x1) / 2 - 15}" y="${(y3 + y1) / 2}" text-anchor="end" font-size="${fontSize}">${labels.side3}</text>` : ""}
  `;
}

function generateTrapezoid(
    centerX: number,
    centerY: number,
    sides: number[],
    labels: Record<string, string>,
    strokeWidth: number,
    strokeColor: string,
    fillColor: string,
    fontSize: number
): string {
    const [topWidth, bottomWidth, height, slantSide] = sides;

    const x1 = centerX - bottomWidth / 2;
    const y1 = centerY + height / 2;
    const x2 = centerX + bottomWidth / 2;
    const y2 = centerY + height / 2;
    const x3 = centerX + topWidth / 2;
    const y3 = centerY - height / 2;
    const x4 = centerX - topWidth / 2;
    const y4 = centerY - height / 2;

    return `
    <polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}" 
             stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="${fillColor}" />
    
    <!-- Side labels -->
    ${labels.top ? `<text x="${(x3 + x4) / 2}" y="${y3 - 10}" text-anchor="middle" font-size="${fontSize}">${labels.top}</text>` : ""}
    ${labels.bottom ? `<text x="${(x1 + x2) / 2}" y="${y1 + 20}" text-anchor="middle" font-size="${fontSize}">${labels.bottom}</text>` : ""}
    ${labels.left ? `<text x="${(x1 + x4) / 2 - 15}" y="${(y1 + y4) / 2}" text-anchor="end" font-size="${fontSize}">${labels.left}</text>` : ""}
    ${labels.right ? `<text x="${(x2 + x3) / 2 + 15}" y="${(y2 + y3) / 2}" text-anchor="start" font-size="${fontSize}">${labels.right}</text>` : ""}
  `;
}

function generateCompositeShape(
    centerX: number,
    centerY: number,
    points: number[],
    labels: Record<string, string>,
    strokeWidth: number,
    strokeColor: string,
    fillColor: string,
    fontSize: number
): string {
    // Generate L-shaped or other composite shapes
    // This is a simplified version - extend as needed
    const pointsStr = points.map((p, i) => {
        if (i % 2 === 0) {
            return `${centerX + p}`;
        } else {
            return `${centerY + p}`;
        }
    }).join(",");

    return `
    <polygon points="${pointsStr}" 
             stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="${fillColor}" />
    
    <!-- Labels for composite shape -->
    ${Object.entries(labels).map(([key, value], idx) =>
        `<text x="${centerX + idx * 30}" y="${centerY + idx * 20}" font-size="${fontSize}">${value}</text>`
    ).join("")}
  `;
}

function diagramSpecToChartConfig(spec: DiagramSpec): any {
    // Convert to Chart.js config for QuickChart
    // This is a simplified implementation
    return {
        type: "scatter",
        data: {
            datasets: [{
                label: spec.type,
                data: [],
            }]
        },
        options: {
            scales: {
                x: { display: false },
                y: { display: false }
            },
            plugins: {
                legend: { display: false }
            }
        }
    };
}

/**
 * Generate diagram description for AI to create appropriate diagrams
 */
export function createDiagramPrompt(figureDescription: string): string {
    return `
IMPORTANT: Include a geometric diagram in this question using the following format:

[DIAGRAM: ${figureDescription}]

The diagram should be described in precise geometric terms so it can be rendered programmatically.

Example format:
[DIAGRAM: Rectangle with width 8cm labeled at bottom, height 2cm labeled on left side, with two 2cm x 2cm square cutouts at the top]

or

[DIAGRAM: Trapezoid with parallel sides: top = 3cm 2mm, bottom = 8cm 3mm, left slant side = 4cm 6mm, right slant side = 5cm, all sides labeled with measurements]

Ensure the diagram description is clear enough that a rendering engine can recreate the exact figure.
`;
}
