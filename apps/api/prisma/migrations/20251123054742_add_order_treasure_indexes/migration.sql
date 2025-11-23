-- Add indexes for user purchase limit aggregation
-- 用于统计某个用户在某个宝箱上，已支付且有效的总购买份数
CREATE INDEX IF NOT EXISTS idx_orders_user_treasure_paid
    ON orders (user_id, treasure_id, pay_status, order_status, refund_status);

-- Add index for treasure stock check & update
-- 用于快速定位某个宝箱 + 状态，并优化库存相关查询/更新
CREATE INDEX IF NOT EXISTS idx_treasures_state_shelves_buy
    ON treasures (state, treasure_id, seq_shelves_quantity, seq_buy_quantity);