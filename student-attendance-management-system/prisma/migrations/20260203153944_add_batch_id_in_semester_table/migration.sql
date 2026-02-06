/*
  Warnings:

  - You are about to alter the column `number` on the `Semester` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - A unique constraint covering the columns `[name,batch_id,semester_id]` on the table `Section` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `section_id` to the `AttendanceSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department_id` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_year` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_year` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `batch_id` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ACTIVITY_TYPE" ADD VALUE 'PROMOTE';
ALTER TYPE "ACTIVITY_TYPE" ADD VALUE 'ARCHIVE';

-- DropIndex
DROP INDEX "Section_name_semester_id_key";

-- DropIndex
DROP INDEX "Subject_code_semester_id_key";

-- AlterTable
ALTER TABLE "AttendanceSession" ADD COLUMN     "end_time" TIMESTAMP(3),
ADD COLUMN     "is_cancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "section_id" TEXT NOT NULL,
ADD COLUMN     "start_time" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "department_id" TEXT NOT NULL,
ADD COLUMN     "end_year" INTEGER NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "start_year" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "batch_id" TEXT NOT NULL,
ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Semester" ADD COLUMN     "name" TEXT,
ALTER COLUMN "number" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "current_semester" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "credit_hours" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "description" TEXT;

-- CreateIndex
CREATE INDEX "AttendanceSession_section_id_idx" ON "AttendanceSession"("section_id");

-- CreateIndex
CREATE INDEX "Batch_year_idx" ON "Batch"("year");

-- CreateIndex
CREATE INDEX "Batch_is_active_idx" ON "Batch"("is_active");

-- CreateIndex
CREATE INDEX "Batch_department_id_idx" ON "Batch"("department_id");

-- CreateIndex
CREATE INDEX "Department_name_idx" ON "Department"("name");

-- CreateIndex
CREATE INDEX "Section_batch_id_idx" ON "Section"("batch_id");

-- CreateIndex
CREATE INDEX "Section_department_id_idx" ON "Section"("department_id");

-- CreateIndex
CREATE INDEX "Section_semester_id_idx" ON "Section"("semester_id");

-- CreateIndex
CREATE UNIQUE INDEX "Section_name_batch_id_semester_id_key" ON "Section"("name", "batch_id", "semester_id");

-- CreateIndex
CREATE INDEX "Semester_department_id_idx" ON "Semester"("department_id");

-- CreateIndex
CREATE INDEX "Semester_number_idx" ON "Semester"("number");

-- CreateIndex
CREATE INDEX "Student_section_id_idx" ON "Student"("section_id");

-- CreateIndex
CREATE INDEX "Student_batch_id_idx" ON "Student"("batch_id");

-- CreateIndex
CREATE INDEX "Student_current_semester_idx" ON "Student"("current_semester");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE INDEX "Subject_department_id_idx" ON "Subject"("department_id");

-- CreateIndex
CREATE INDEX "Subject_semester_id_idx" ON "Subject"("semester_id");

-- CreateIndex
CREATE INDEX "Teacher_user_id_idx" ON "Teacher"("user_id");

-- CreateIndex
CREATE INDEX "TeachingAssignment_section_id_idx" ON "TeachingAssignment"("section_id");

-- CreateIndex
CREATE INDEX "TeachingAssignment_subject_id_idx" ON "TeachingAssignment"("subject_id");

-- CreateIndex
CREATE INDEX "TeachingAssignment_teacher_id_idx" ON "TeachingAssignment"("teacher_id");

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
