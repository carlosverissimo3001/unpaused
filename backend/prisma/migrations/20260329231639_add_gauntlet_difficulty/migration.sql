/*
  Warnings:

  - Added the required column `difficulty` to the `gauntlet_runs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GauntletDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- AlterTable
ALTER TABLE "gauntlet_runs" ADD COLUMN     "difficulty" "GauntletDifficulty" NOT NULL;
