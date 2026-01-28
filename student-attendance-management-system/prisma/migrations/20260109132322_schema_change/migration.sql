/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[number,department_id]` on the table `Semester` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `department_id` to the `Semester` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Semester" ADD COLUMN     "department_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_number_department_id_key" ON "Semester"("number", "department_id");

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
