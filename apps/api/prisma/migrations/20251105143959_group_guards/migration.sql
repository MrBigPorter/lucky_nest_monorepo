/* ---------- 1) 预清理，避免后续约束失败 ---------- */
-- 人数边界预处理
UPDATE treasure_groups
SET current_members = GREATEST(current_members, 0);

UPDATE treasure_groups
SET max_members = GREATEST(max_members, 1);

UPDATE treasure_groups
SET current_members = LEAST(current_members, max_members);

-- 成员时间补齐，避免 NOT NULL 失败
UPDATE treasure_group_members
SET joined_at = COALESCE(joined_at, created_at, NOW())
WHERE joined_at IS NULL;

/* ---------- 2) 先删旧约束（若存在）再新增 ---------- */
ALTER TABLE treasure_groups
    DROP CONSTRAINT IF EXISTS chk_members_nonneg;

ALTER TABLE treasure_groups
    DROP CONSTRAINT IF EXISTS chk_members_capacity;

ALTER TABLE treasure_groups
    ADD CONSTRAINT chk_members_nonneg
        CHECK (current_members >= 0 AND max_members >= 1);

ALTER TABLE treasure_groups
    ADD CONSTRAINT chk_members_capacity
        CHECK (current_members <= max_members);

/* ---------- 3) 索引。以下 IF NOT EXISTS 在 PG 中是允许的 ---------- */
-- 同一团长+同一宝箱，只能有一个“进行中团”
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_group_per_leader_treasure
    ON treasure_groups (creator_id, treasure_id)
    WHERE group_status = 1;

-- 列表常用排序索引
CREATE INDEX IF NOT EXISTS idx_treasure_status_updated
    ON treasure_groups (treasure_id, group_status, updated_at DESC, group_id DESC);

-- 成员预览排序索引
CREATE INDEX IF NOT EXISTS idx_group_owner_joined
    ON treasure_group_members (group_id, is_owner DESC, joined_at ASC);

/* ---------- 4) 把 joined_at 设为 NOT NULL + 默认 ---------- */
ALTER TABLE treasure_group_members
    ALTER COLUMN joined_at SET DEFAULT NOW(),
ALTER COLUMN joined_at SET NOT NULL;