/*
  Warnings:

  - You are about to drop the column `batch_year` on the `Section` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,semester_id]` on the table `Section` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `batch_id` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Section_name_batch_year_semester_id_key";

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "batch_year";

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "batch_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Batch_year_key" ON "Batch"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Section_name_semester_id_key" ON "Section"("name", "semester_id");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
