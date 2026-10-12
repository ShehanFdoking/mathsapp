import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    name: z.string().min(2),
    age: z.number().int().min(9).max(20),
    grade: z.number().int().min(6).max(11),
    medium: z.enum(["ENGLISH", "SINHALA"]),
    school: z.string().min(2),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(6),
  })
  .refine((data) => data.phone || data.email, {
    message: "Provide either a phone number or an email",
    path: ["phone"],
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          data.email ? { email: data.email } : undefined,
          data.phone ? { phone: data.phone } : undefined,
        ].filter(Boolean) as any,
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this phone/email already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        age: data.age,
        grade: data.grade,
        medium: data.medium as any,
        school: data.school,
        phone: data.phone || null,
        email: data.email || null,
        password: hashed,
      },
    });

    return NextResponse.json({ id: user.id, name: user.name });
  } catch (err: any) {
    // Log the full error server-side (visible in your terminal) so the real
    // cause (DB connection, missing Prisma client, etc.) is easy to find,
    // while still returning valid JSON to the browser instead of crashing.
    console.error("REGISTER ERROR:", err);
    return NextResponse.json(
      { error: "Something went wrong while registering. Check the server logs for details." },
      { status: 500 }
    );
  }
}
