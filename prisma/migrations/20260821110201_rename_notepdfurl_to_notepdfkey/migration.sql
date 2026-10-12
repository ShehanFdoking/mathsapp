/*
  Warnings:

  - You are about to drop the column `notePdfUrl` on the `Lesson` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "notePdfUrl",
ADD COLUMN     "notePdfKey" TEXT;
