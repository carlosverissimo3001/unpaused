-- AlterTable
ALTER TABLE "stats" ADD COLUMN     "last_win_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "answered_question_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "streak_freezes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "streak_quiz_questions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correct_answer_index" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "context" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "added_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streak_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streak_freeze_usages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "freezes_used" INTEGER NOT NULL,
    "gap_days" INTEGER NOT NULL,
    "streak_at_time" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streak_freeze_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "streak_freeze_usages_user_id_idx" ON "streak_freeze_usages"("user_id");

-- AddForeignKey
ALTER TABLE "streak_freeze_usages" ADD CONSTRAINT "streak_freeze_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
