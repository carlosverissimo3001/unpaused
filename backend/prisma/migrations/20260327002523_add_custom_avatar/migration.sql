-- CreateEnum
CREATE TYPE "AvatarSource" AS ENUM ('SPOTIFY', 'CUSTOM');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_source" "AvatarSource" NOT NULL DEFAULT 'SPOTIFY',
ADD COLUMN     "custom_avatar_url" TEXT;
