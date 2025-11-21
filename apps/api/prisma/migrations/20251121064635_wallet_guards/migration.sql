/* ========== 0) 预清理，防止旧脏数据触发约束失败 ========== */
UPDATE user_wallets
SET
    real_balance   = GREATEST(real_balance, 0),
    coin_balance   = GREATEST(coin_balance, 0),
    frozen_balance = GREATEST(frozen_balance, 0);

/* ========== 1) 钱包余额非负约束 ========== */
-- 先删掉同名约束（如果以前有手动加过）
ALTER TABLE user_wallets
DROP CONSTRAINT IF EXISTS chk_wallet_nonneg;

-- 再新增一条正式的约束
ALTER TABLE user_wallets
    ADD CONSTRAINT chk_wallet_nonneg
        CHECK (
            real_balance   >= 0
                AND coin_balance   >= 0
                AND frozen_balance >= 0
            );

/* ========== 2) 订单常用索引 ========== */
-- 按用户 + 创建时间 查订单列表
CREATE INDEX IF NOT EXISTS idx_orders_user
    ON orders (user_id, created_at DESC);

-- 按商品 + 创建时间 查订单列表
CREATE INDEX IF NOT EXISTS idx_orders_treasure
    ON orders (treasure_id, created_at DESC);