-- An address is only proved once someone follows a link sent to it. Existing
-- accounts stay null: they made the same unproved claim as everyone else, and
-- marking them verified on trust would defeat the point of asking.
ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMP(3);

CREATE TYPE "AuthTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

CREATE TABLE "auth_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_tokens_token_hash_key" ON "auth_tokens"("token_hash");
CREATE INDEX "auth_tokens_user_id_type_idx" ON "auth_tokens"("user_id", "type");
CREATE INDEX "auth_tokens_expires_at_idx" ON "auth_tokens"("expires_at");

ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
