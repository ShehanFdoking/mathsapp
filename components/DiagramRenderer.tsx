"use client";

import { useEffect, useRef } from "react";

export interface DiagramSpec {
    type: "rectangle" | "triangle" | "trapezoid" | "composite" | "circle" | "polygon";
    dimensions?: {
        width?: string;
        height?: string;
        top?: string;
        bottom?: string;
        leftSide?: string;
        rightSide?: string;
        radius?: string;
        segments?: Array<{
            width: string;
            height: string;
            position?: string;
        }>;
    };
    labels?: Record<string, string>;
}

interface DiagramRendererProps {
    spec: DiagramSpec | string;
    width?: number;
    height?: number;
}

export function DiagramRenderer({ spec, width = 400, height = 300 }: DiagramRendererProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);

        // Parse spec if it's a string
        let diagramSpec: DiagramSpec;
        if (typeof spec === "string") {
            try {
                diagramSpec = JSON.parse(spec);
            } catch {
                // If parsing fails, show error
                ctx.fillStyle = "red";
                ctx.font = "14px Arial";
                ctx.fillText("Invalid diagram specification", 20, height / 2);
                return;
            }
        } else {
            diagramSpec = spec;
        }

        // Render the diagram
        renderDiagram(ctx, diagramSpec, width, height);
    }, [spec, width, height]);

    return (
        <div className="my-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <canvas ref={canvasRef} width={width} height={height} className="mx-auto" />
        </div>
    );
}

function renderDiagram(
    ctx: CanvasRenderingContext2D,
    spec: DiagramSpec,
    canvasWidth: number,
    canvasHeight: number
) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.font = "14px Arial";
    ctx.fillStyle = "#000000";

    switch (spec.type) {
        case "rectangle":
            renderRectangle(ctx, centerX, centerY, spec);
            break;
        case "triangle":
            renderTriangle(ctx, centerX, centerY, spec);
            break;
        case "trapezoid":
            renderTrapezoid(ctx, centerX, centerY, spec);
            break;
        case "composite":
            renderComposite(ctx, centerX, centerY, spec);
            break;
        default:
            ctx.fillText(`Unsupported diagram type: ${spec.type}`, centerX - 100, centerY);
    }
}

function parseLength(length: string | undefined): number {
    if (!length) return 50;

    // Parse measurements like "8cm", "3cm 2mm", "5cm"
    const match = length.match(/(\d+)cm\s*(\d+)?mm?/);
    if (match) {
        const cm = parseInt(match[1]) || 0;
        const mm = parseInt(match[2]) || 0;
        return cm * 10 + mm; // Scale: 1cm = 10px
    }

    const cmMatch = length.match(/(\d+)cm/);
    if (cmMatch) {
        return parseInt(cmMatch[1]) * 10;
    }

    return 50;
}

function renderRectangle(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    spec: DiagramSpec
) {
    const width = parseLength(spec.dimensions?.width || "80");
    const height = parseLength(spec.dimensions?.height || "40");

    const x = centerX - width / 2;
    const y = centerY - height / 2;

    // Draw rectangle
    ctx.strokeRect(x, y, width, height);

    // Draw labels
    const labels: any = spec.labels || spec.dimensions;
    if (labels) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Top label
        if (labels.top || labels.width) {
            ctx.fillText(labels.top || labels.width || "", centerX, y - 15);
        }

        // Bottom label
        if (labels.bottom || labels.width) {
            ctx.fillText(labels.bottom || labels.width || "", centerX, y + height + 15);
        }

        // Left label
        ctx.textAlign = "right";
        if (labels.left || labels.height) {
            ctx.fillText(labels.left || labels.height || "", x - 10, centerY);
        }

        // Right label
        ctx.textAlign = "left";
        if (labels.right || labels.height) {
            ctx.fillText(labels.right || labels.height || "", x + width + 10, centerY);
        }
    }
}

function renderTriangle(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    spec: DiagramSpec
) {
    const base = parseLength(spec.dimensions?.bottom || "100");
    const height = parseLength(spec.dimensions?.height || "80");

    const x1 = centerX - base / 2;
    const y1 = centerY + height / 2;
    const x2 = centerX + base / 2;
    const y2 = centerY + height / 2;
    const x3 = centerX;
    const y3 = centerY - height / 2;

    // Draw triangle
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.stroke();

    // Draw labels
    const labels: any = spec.labels || spec.dimensions;
    if (labels) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Base label
        if (labels.bottom) {
            ctx.fillText(labels.bottom, centerX, y1 + 20);
        }

        // Left side label
        ctx.textAlign = "right";
        if (labels.left || labels.leftSide) {
            ctx.fillText(labels.left || labels.leftSide || "", (x1 + x3) / 2 - 10, (y1 + y3) / 2);
        }

        // Right side label
        ctx.textAlign = "left";
        if (labels.right || labels.rightSide) {
            ctx.fillText(labels.right || labels.rightSide || "", (x2 + x3) / 2 + 10, (y2 + y3) / 2);
        }
    }
}

function renderTrapezoid(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    spec: DiagramSpec
) {
    const topWidth = parseLength(spec.dimensions?.top || "60");
    const bottomWidth = parseLength(spec.dimensions?.bottom || "120");
    const height = parseLength(spec.dimensions?.height || "50");

    const x1 = centerX - bottomWidth / 2;
    const y1 = centerY + height / 2;
    const x2 = centerX + bottomWidth / 2;
    const y2 = centerY + height / 2;
    const x3 = centerX + topWidth / 2;
    const y3 = centerY - height / 2;
    const x4 = centerX - topWidth / 2;
    const y4 = centerY - height / 2;

    // Draw trapezoid
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.stroke();

    // Draw labels
    const labels: any = spec.labels || spec.dimensions;
    if (labels) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Top label
        if (labels.top) {
            ctx.fillText(labels.top, centerX, y3 - 15);
        }

        // Bottom label
        if (labels.bottom) {
            ctx.fillText(labels.bottom, centerX, y1 + 15);
        }

        // Left side label
        ctx.textAlign = "right";
        if (labels.left || labels.leftSide) {
            ctx.fillText(labels.left || labels.leftSide || "", (x1 + x4) / 2 - 10, (y1 + y4) / 2);
        }

        // Right side label
        ctx.textAlign = "left";
        if (labels.right || labels.rightSide) {
            ctx.fillText(labels.right || labels.rightSide || "", (x2 + x3) / 2 + 10, (y2 + y3) / 2);
        }
    }
}

function renderComposite(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    spec: DiagramSpec
) {
    // Render L-shaped or other composite shapes
    // This is a simplified implementation for the example shown in the image

    const segments = spec.dimensions?.segments || [];
    if (segments.length === 0) {
        ctx.fillText("No segments defined for composite shape", centerX - 100, centerY);
        return;
    }

    // Draw the main rectangle
    const mainWidth = parseLength(segments[0]?.width || "80");
    const mainHeight = parseLength(segments[0]?.height || "20");

    const x = centerX - mainWidth / 2;
    const y = centerY;

    ctx.strokeRect(x, y, mainWidth, mainHeight);

    // Draw cutouts or additional segments
    for (let i = 1; i < segments.length; i++) {
        const seg = segments[i];
        const segWidth = parseLength(seg.width);
        const segHeight = parseLength(seg.height);

        if (seg.position === "top-left-cutout") {
            // Draw a cutout
            ctx.strokeRect(x, y - segHeight, segWidth, segHeight);
        } else if (seg.position === "top-right-cutout") {
            ctx.strokeRect(x + mainWidth - segWidth, y - segHeight, segWidth, segHeight);
        }
    }

    // Draw labels
    const labels = spec.labels || {};
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    Object.entries(labels).forEach(([key, value], idx) => {
        ctx.fillText(value, x + idx * 40, y - 30);
    });
}
