/*
  Warnings:

  - The values [PLAYLIST] on the enum `GameMode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GameMode_new" AS ENUM ('DAILY', 'ALL');
ALTER TABLE "public"."stats" ALTER COLUMN "mode" DROP DEFAULT;
ALTER TABLE "stats" ALTER COLUMN "mode" TYPE "GameMode_new" USING ("mode"::text::"GameMode_new");
ALTER TYPE "GameMode" RENAME TO "GameMode_old";
ALTER TYPE "GameMode_new" RENAME TO "GameMode";
DROP TYPE "public"."GameMode_old";
ALTER TABLE "stats" ALTER COLUMN "mode" SET DEFAULT 'ALL';
COMMIT;

-- AlterTable
ALTER TABLE "stats" ALTER COLUMN "mode" SET DEFAULT 'ALL';
