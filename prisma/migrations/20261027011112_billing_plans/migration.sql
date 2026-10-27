-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'GROWTH', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "brand" ADD COLUMN     "billing_interval" TEXT,
ADD COLUMN     "current_period_end" TIMESTAMP(3),
ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'STARTER',
ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_subscription_id" TEXT,
ADD COLUMN     "subscription_status" TEXT,
ADD COLUMN     "trial_ends_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "stripe_event" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brand_stripe_customer_id_key" ON "brand"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "brand_stripe_subscription_id_key" ON "brand"("stripe_subscription_id");


-- ---------------------------------------------------------------------------
-- Hand-written: plans and billing.
-- ---------------------------------------------------------------------------
-- Everyone already using Rootline keeps every feature they have today.
UPDATE "brand" SET "plan" = 'GROWTH';

-- The app may never change a brand's plan or billing columns itself (not even
-- for its own brand): only Stripe's webhook can, through apply_subscription()
-- below. Column-level UPDATE rights cover every other column.
REVOKE UPDATE ON "brand" FROM rootline_app;
GRANT UPDATE ("industry", "name", "location", "latitude", "longitude", "timezone", "logo_path", "photo_paths",
              "color_primary", "color_accent", "quote", "video_url", "updated_at") ON "brand" TO rootline_app;

-- Webhook idempotency. No policies: only the function below touches it.
ALTER TABLE "stripe_event" ENABLE ROW LEVEL SECURITY;

-- Records a Stripe event id; returns false if it was already handled.
CREATE FUNCTION stripe_event_claim(p_id text, p_type text) RETURNS boolean
  LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    WITH inserted AS (
      INSERT INTO stripe_event (id, type) VALUES (p_id, p_type) ON CONFLICT (id) DO NOTHING RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM inserted);
  $$;
REVOKE ALL ON FUNCTION stripe_event_claim(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION stripe_event_claim(text, text) TO rootline_app;

-- Applies a Stripe subscription to one brand. It can only change the billing
-- columns; returns false when the brand does not exist.
CREATE FUNCTION apply_subscription(
  p_brand uuid, p_plan "Plan", p_customer text, p_subscription text, p_status text, p_interval text, p_period_end timestamp
) RETURNS boolean
  LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    WITH changed AS (
      UPDATE brand SET
        plan = p_plan,
        stripe_customer_id = p_customer,
        stripe_subscription_id = p_subscription,
        subscription_status = p_status,
        billing_interval = p_interval,
        current_period_end = p_period_end,
        updated_at = now() AT TIME ZONE 'UTC'
      WHERE id = p_brand
      RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM changed);
  $$;
REVOKE ALL ON FUNCTION apply_subscription(uuid, "Plan", text, text, text, text, timestamp) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_subscription(uuid, "Plan", text, text, text, text, timestamp) TO rootline_app;
