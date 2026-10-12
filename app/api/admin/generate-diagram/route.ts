import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateDiagramBatch } from "@/lib/server/image-generator-server";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { descriptions } = await req.json();

        if (!descriptions || !Array.isArray(descriptions)) {
            return NextResponse.json({ error: "Invalid descriptions" }, { status: 400 });
        }

        // Generate diagrams using Gemini 2.5 Flash Image
        const images = await generateDiagramBatch(descriptions);

        // Convert Map to object for JSON response
        const imagesObject: Record<string, string> = {};
        images.forEach((value, key) => {
            imagesObject[key] = value;
        });

        return NextResponse.json({ images: imagesObject });
    } catch (err: any) {
        console.error("GENERATE DIAGRAM ERROR:", err);
        return NextResponse.json(
            { error: err?.message || "Failed to generate diagrams" },
            { status: 500 }
        );
    }
}
