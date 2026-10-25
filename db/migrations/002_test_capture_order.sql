-- Order context returned by openTestDispute (items, tracking), copied onto the case when its
-- dispute arrives so the agent and the UI have the order at once.
ALTER TABLE test_captures ADD COLUMN IF NOT EXISTS order_ctx jsonb;
