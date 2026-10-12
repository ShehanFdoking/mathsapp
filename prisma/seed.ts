/**
 * Optional dev seed. Admin login uses ADMIN_USERNAME/ADMIN_PASSWORD from
 * .env directly (see lib/auth.ts) so no admin DB row is needed.
 *
 * This script just creates one demo student per grade so you can see the
 * dashboard/leaderboard working before uploading real textbooks.
 *
 * Run with: npm run seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  for (const grade of [6, 7, 8, 9, 10, 11]) {
    await prisma.user.upsert({
      where: { email: `demo.grade${grade}@example.com` },
      update: {},
      create: {
        name: `Demo Student G${grade}`,
        age: grade + 5,
        grade,
        medium: "ENGLISH",
        school: "Demo High School",
        email: `demo.grade${grade}@example.com`,
        password,
        role: "STUDENT",
      },
    });
  }

  console.log("Seeded demo students (password: password123 for all).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
