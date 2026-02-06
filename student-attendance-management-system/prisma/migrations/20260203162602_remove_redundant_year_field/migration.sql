/*
  Warnings:

  - You are about to drop the column `year` on the `Batch` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[start_year,department_id]` on the table `Batch` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Batch_year_idx";

-- DropIndex
DROP INDEX "Batch_year_key";

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "year";

-- CreateIndex
CREATE INDEX "Batch_start_year_idx" ON "Batch"("start_year");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_start_year_department_id_key" ON "Batch"("start_year", "department_id");
