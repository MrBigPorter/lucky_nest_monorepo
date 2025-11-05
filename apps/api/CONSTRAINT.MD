# 1.开团 约束与索引(group_guards)
## 在 Prisma schema 里无法直接表达的约束与索引，需要手动写 SQL 迁移来实现.
## 生成一个空迁移
---
docker exec -it lucky-backend-dev sh -lc "cd apps/api && yarn prisma migrate dev --create-only -n group_guards"
---
## 打开新生成的：apps/api/prisma/migrations/<timestamp>_group_guards/migration.sql

---
-- 人数边界
ALTER TABLE treasure_groups
  ADD CONSTRAINT IF NOT EXISTS chk_members_nonneg
  CHECK (current_members >= 0 AND max_members >= 1);
ALTER TABLE treasure_groups
  ADD CONSTRAINT IF NOT EXISTS chk_members_capacity
  CHECK (current_members <= max_members);

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
---