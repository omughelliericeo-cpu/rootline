-- CreateTable
CREATE TABLE "recall_subscriber" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "consent_text" TEXT NOT NULL,
    "consent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribe_token" TEXT NOT NULL,
    "unsubscribed_at" TIMESTAMP(3),

    CONSTRAINT "recall_subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recall_message" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recall_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recall_subscriber_unsubscribe_token_key" ON "recall_subscriber"("unsubscribe_token");

-- CreateIndex
CREATE UNIQUE INDEX "recall_subscriber_batch_id_email_key" ON "recall_subscriber"("batch_id", "email");

-- CreateIndex
CREATE INDEX "recall_message_batch_id_sent_at_idx" ON "recall_message"("batch_id", "sent_at");

-- AddForeignKey
ALTER TABLE "recall_subscriber" ADD CONSTRAINT "recall_subscriber_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recall_message" ADD CONSTRAINT "recall_message_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written: ROW LEVEL SECURITY for recall alerts.
--  - The brand reads its subscribers (to count and email them) and manages
--    its recall messages.
--  - The public may ADD a subscriber to a published batch (insert only; the
--    app inserts without reading back). Emails are never publicly readable.
--  - The public may read a published batch's recall messages: they are shown
--    as a warning on its story page.
-- ---------------------------------------------------------------------------
ALTER TABLE "recall_subscriber" ENABLE ROW LEVEL SECURITY;
CREATE POLICY recall_subscriber_own_brand ON "recall_subscriber" TO rootline_app
  USING (EXISTS (SELECT 1 FROM "batch" b WHERE b.id = recall_subscriber.batch_id AND b.brand_id::text = current_setting('app.brand_id', true)))
  WITH CHECK (EXISTS (SELECT 1 FROM "batch" b WHERE b.id = recall_subscriber.batch_id AND b.brand_id::text = current_setting('app.brand_id', true)));
CREATE POLICY recall_subscriber_public_insert ON "recall_subscriber" FOR INSERT TO rootline_app
  WITH CHECK (current_setting('app.public', true) = 'on'
    AND EXISTS (SELECT 1 FROM "batch" b WHERE b.id = recall_subscriber.batch_id AND b.status IN ('LIVE', 'SOLD_OUT')));

ALTER TABLE "recall_message" ENABLE ROW LEVEL SECURITY;
CREATE POLICY recall_message_own_brand ON "recall_message" TO rootline_app
  USING (EXISTS (SELECT 1 FROM "batch" b WHERE b.id = recall_message.batch_id AND b.brand_id::text = current_setting('app.brand_id', true)))
  WITH CHECK (EXISTS (SELECT 1 FROM "batch" b WHERE b.id = recall_message.batch_id AND b.brand_id::text = current_setting('app.brand_id', true)));
CREATE POLICY recall_message_public_read ON "recall_message" FOR SELECT TO rootline_app
  USING (current_setting('app.public', true) = 'on'
    AND EXISTS (SELECT 1 FROM "batch" b WHERE b.id = recall_message.batch_id AND b.status IN ('LIVE', 'SOLD_OUT')));

-- Unsubscribe links: the only way to change a subscriber without logging in.
-- SECURITY DEFINER runs as the table owner, but the function can do exactly
-- one thing: mark the subscriber holding this secret token as unsubscribed.
-- Returns true when the token is valid (also when already unsubscribed).
CREATE FUNCTION recall_unsubscribe(p_token text) RETURNS boolean
  LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    WITH changed AS (
      UPDATE recall_subscriber SET unsubscribed_at = now()
      WHERE unsubscribe_token = p_token AND unsubscribed_at IS NULL
      RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM changed)
        OR EXISTS (SELECT 1 FROM recall_subscriber WHERE unsubscribe_token = p_token);
  $$;
REVOKE ALL ON FUNCTION recall_unsubscribe(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION recall_unsubscribe(text) TO rootline_app;
