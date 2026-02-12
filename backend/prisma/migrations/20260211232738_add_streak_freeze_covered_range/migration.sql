/*
  Warnings:

  - Added the required column `covered_from` to the `streak_freeze_usages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `covered_to` to the `streak_freeze_usages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "streak_freeze_usages" ADD COLUMN     "covered_from" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "covered_to" TIMESTAMP(3) NOT NULL;
