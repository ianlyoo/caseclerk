-- What the seller ended up with on a resolved case (W1 computeCaseMoney: PayPal fund_movements +
-- the capture's seller_receivable_breakdown). Written once, when PayPal states it; never updated.
CREATE TABLE IF NOT EXISTS case_money (
  case_id text PRIMARY KEY,
  money jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
