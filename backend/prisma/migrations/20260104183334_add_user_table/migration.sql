-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "spotify_user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_trusted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_spotify_user_id_key" ON "users"("spotify_user_id");
