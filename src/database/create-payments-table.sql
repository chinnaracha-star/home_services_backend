-- Run this once for databases that already have the orders tables.
CREATE TABLE IF NOT EXISTS payments (
  payment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL,
  payment_method VARCHAR(100) NOT NULL,
  payment_status VARCHAR(50) NOT NULL,
  payment_intent_id VARCHAR(255),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS payments_intent_id_uidx
  ON payments(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;
