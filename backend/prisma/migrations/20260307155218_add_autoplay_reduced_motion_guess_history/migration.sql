-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "auto_play" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reduced_motion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_guess_history" BOOLEAN NOT NULL DEFAULT true;
