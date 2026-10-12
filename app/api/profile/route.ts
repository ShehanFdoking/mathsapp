import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await req.json();

        const { name, age, grade, school, phone, email } = body;

        // Validation
        if (!name || !age || !grade || !school) {
            return NextResponse.json(
                { error: "Name, age, grade, and school are required" },
                { status: 400 }
            );
        }

        // Validate at least one contact method
        if (!phone && !email) {
            return NextResponse.json(
                { error: "At least one contact method (phone or email) is required" },
                { status: 400 }
            );
        }

        // Check if phone/email is already taken by another user
        if (phone) {
            const existingPhone = await prisma.user.findFirst({
                where: {
                    phone,
                    id: { not: userId },
                },
            });
            if (existingPhone) {
                return NextResponse.json(
                    { error: "Phone number is already in use by another account" },
                    { status: 400 }
                );
            }
        }

        if (email) {
            const existingEmail = await prisma.user.findFirst({
                where: {
                    email,
                    id: { not: userId },
                },
            });
            if (existingEmail) {
                return NextResponse.json(
                    { error: "Email is already in use by another account" },
                    { status: 400 }
                );
            }
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                age: Number(age),
                grade: Number(grade),
                school,
                phone: phone || null,
                email: email || null,
            },
            select: {
                id: true,
                name: true,
                age: true,
                grade: true,
                medium: true,
                school: true,
                phone: true,
                email: true,
            },
        });

        return NextResponse.json({
            success: true,
            user: updatedUser,
        });
    } catch (error: any) {
        console.error("Profile update error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update profile" },
            { status: 500 }
        );
    }
}
