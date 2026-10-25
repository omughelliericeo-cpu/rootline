-- CreateTable
CREATE TABLE "brand" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "industry" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT NOT NULL DEFAULT 'America/Vancouver',
    "logo_path" TEXT,
    "photo_paths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "color_primary" TEXT NOT NULL DEFAULT '#2F4A3A',
    "color_accent" TEXT NOT NULL DEFAULT '#8A5A3B',
    "quote" TEXT,
    "video_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_person" (
    "id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "photo_path" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_person_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brand_owner_user_id_key" ON "brand"("owner_user_id");

-- CreateIndex
CREATE INDEX "brand_person_brand_id_idx" ON "brand_person"("brand_id");

-- AddForeignKey
ALTER TABLE "brand_person" ADD CONSTRAINT "brand_person_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- App database role and ROW LEVEL SECURITY (hand-written).
--
-- The running app connects as "rootline_app", which is NOT the table owner and
-- cannot bypass RLS. Before each query, src/lib/db.ts (withTenant) sets:
--   app.user_id  = the logged-in Supabase user id
--   app.brand_id = that user's brand id
-- If a setting is missing, current_setting(..., true) returns NULL/'' and the
-- policies below match nothing, so the default is "see no rows".
-- The role is created without a password; give it one once per environment:
--   ALTER ROLE rootline_app WITH LOGIN PASSWORD '...';
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rootline_app') THEN
    CREATE ROLE rootline_app NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO rootline_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rootline_app;
-- Tables created by later migrations get the same grants automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rootline_app;
-- The app never needs Prisma's own bookkeeping table. (It does not exist yet in
-- Prisma's temporary "shadow" database, hence the check.)
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    REVOKE ALL ON TABLE "_prisma_migrations" FROM rootline_app;
  END IF;
END
$$;

-- A brand is visible only to its owner.
ALTER TABLE "brand" ENABLE ROW LEVEL SECURITY;
CREATE POLICY brand_owner_only ON "brand" TO rootline_app
  USING (owner_user_id::text = current_setting('app.user_id', true))
  WITH CHECK (owner_user_id::text = current_setting('app.user_id', true));

-- People belong to the current brand only.
ALTER TABLE "brand_person" ENABLE ROW LEVEL SECURITY;
CREATE POLICY brand_person_own_brand ON "brand_person" TO rootline_app
  USING (brand_id::text = current_setting('app.brand_id', true))
  WITH CHECK (brand_id::text = current_setting('app.brand_id', true));
