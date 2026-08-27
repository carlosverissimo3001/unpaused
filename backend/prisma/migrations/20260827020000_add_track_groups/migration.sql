CREATE TYPE "TrackGroupType" AS ENUM ('DECADE', 'GENRE', 'FAME');

CREATE TABLE "track_groups" (
    "id" TEXT NOT NULL,
    "type" "TrackGroupType" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "track_groups_slug_key" ON "track_groups"("slug");
CREATE UNIQUE INDEX "track_groups_type_name_key" ON "track_groups"("type", "name");
CREATE INDEX "track_groups_type_idx" ON "track_groups"("type");

CREATE TABLE "track_group_tracks" (
    "track_id" TEXT NOT NULL,
    "track_group_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_group_tracks_pkey" PRIMARY KEY ("track_id", "track_group_id")
);

CREATE INDEX "track_group_tracks_track_group_id_idx" ON "track_group_tracks"("track_group_id");

ALTER TABLE "track_group_tracks" ADD CONSTRAINT "track_group_tracks_track_id_fkey"
    FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "track_group_tracks" ADD CONSTRAINT "track_group_tracks_track_group_id_fkey"
    FOREIGN KEY ("track_group_id") REFERENCES "track_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Decade is derivable from pool_tracks.year, so seeding it is a query rather
-- than a job: one row per decade the pool actually covers, and one membership
-- per song. Genre will need the job machinery; this does not.
INSERT INTO "track_groups" ("id", "type", "name", "slug")
SELECT gen_random_uuid(), 'DECADE', decade || 's', decade || 's'
FROM (SELECT DISTINCT ("year" / 10) * 10 AS decade FROM "pool_tracks") d
ON CONFLICT ("type", "name") DO NOTHING;

INSERT INTO "track_group_tracks" ("track_id", "track_group_id")
SELECT t."id", g."id"
FROM "pool_tracks" p
JOIN "tracks" t ON t."id" = p."id"
JOIN "track_groups" g
  ON g."type" = 'DECADE' AND g."name" = (((p."year" / 10) * 10) || 's')
ON CONFLICT DO NOTHING;
