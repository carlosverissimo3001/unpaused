/*
  Warnings:

  - The primary key for the `stats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `stats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "stats" DROP CONSTRAINT "stats_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "stats_pkey" PRIMARY KEY ("user_id", "mode");
