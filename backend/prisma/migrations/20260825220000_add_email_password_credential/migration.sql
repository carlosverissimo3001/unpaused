-- A second credential alongside Spotify. Both nullable: an anonymous player has
-- neither, and an account may have either or both.
ALTER TABLE "users" ADD COLUMN "email" TEXT;
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;

-- Postgres allows many NULLs under a unique index, so this constrains only the
-- rows that actually carry an email.
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
