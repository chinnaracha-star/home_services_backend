ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS checkout_request_id VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS orders_user_checkout_request_uidx
  ON orders (user_id, checkout_request_id)
  WHERE checkout_request_id IS NOT NULL;

DO $$
BEGIN
  IF to_regclass('public.payment') IS NOT NULL THEN
    ALTER TABLE payment ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);
    CREATE UNIQUE INDEX IF NOT EXISTS payment_intent_id_uidx
      ON payment (payment_intent_id)
      WHERE payment_intent_id IS NOT NULL;
  END IF;

  IF to_regclass('public.payments') IS NOT NULL THEN
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);
    CREATE UNIQUE INDEX IF NOT EXISTS payments_intent_id_uidx
      ON payments (payment_intent_id)
      WHERE payment_intent_id IS NOT NULL;
  END IF;
END $$;
