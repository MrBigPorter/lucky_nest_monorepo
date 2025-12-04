# 优惠券功能项目实施指南

本文档旨在指导开发人员如何在现有项目中集成和实现优惠券功能。

## 步骤 1: 数据库结构更新 (Database Schema Update)

第一步是根据 `database_coupon_design.md` 中的优化建议，更新现有的数据表结构。

### 1.1. 修改 `orders` 表

我们需要将 `orders` 表中的 `coupon_id` 字段重命名为 `user_coupon_id`，并确保它正确地关联到 `user_coupons` 表的实例，而不是 `coupons` 表的模板。

**执行以下 SQL 命令:**

```sql
-- 1. 将字段 coupon_id 重命名为 user_coupon_id
ALTER TABLE orders
CHANGE COLUMN coupon_id user_coupon_id BIGINT COMMENT '使用的用户优惠券ID (ID of the user coupon instance used)';

-- 2. (可选) 如果之前存在不正确的外键，先删除它
-- ALTER TABLE orders DROP FOREIGN KEY your_previous_fk_name;

-- 3. 添加正确的外键约束，关联到 user_coupons 表
ALTER TABLE orders
ADD CONSTRAINT fk_order_user_coupon
FOREIGN KEY (user_coupon_id) REFERENCES user_coupons(user_coupon_id)
ON DELETE SET NULL;
```

**目的**:

- **精确追踪**: 明确知道是哪一个用户持有的优惠券实例被用在了哪个订单上。
- **数据一致性**: 确保订单只能关联到真实存在的用户优惠券实例。
- **便于管理**: 在订单取消或退款时，可以轻松地通过 `user_coupon_id` 找到并返还对应的优惠券。

### 1.2. 修改 `coupons` 表

为了更好地追踪优惠券的来源和进行活动效果分析，我们建议在 `coupons` 表中增加一个字段来关联营销活动。

**执行以下 SQL 命令:**

```sql
-- 1. 在 coupons 表中添加 activity_id 字段
ALTER TABLE coupons
ADD COLUMN activity_id BIGINT NULL COMMENT '关联的营销活动ID (Related marketing activity ID)' AFTER coupon_code;

-- 2. 添加外键约束，关联到 marketing_activities 表
ALTER TABLE coupons
ADD CONSTRAINT fk_coupon_activity
FOREIGN KEY (activity_id) REFERENCES marketing_activities(activity_id)
ON DELETE SET NULL;
```

**目的**:

- **来源追踪**: 可以直接从优惠券模板追溯到它是由哪个营销活动创建的。
- **效果分析**: 便于统计特定营销活动发放的优惠券的使用率和效果。

### 1.3. 创建推荐的索引

为了提升查询性能，特别是在订单页面查询可用优惠券时，需要在 `user_coupons` 表上创建复合索引。

**执行以下 SQL 命令:**

```sql
-- 为用户查询可用优惠券创建复合索引
CREATE INDEX idx_user_status_validity ON user_coupons(user_id, use_status, valid_end_time);
```

**目的**:

- **查询加速**: 当用户在下单时，后端需要快速筛选出“属于该用户、未使用且在有效期内”的优惠券。此索引能极大提升该查询的效率。

---

## 步骤 2: 后端 API 开发 (Backend API Development)

接下来，我们需要开发一系列 API 来支持优惠券的整个生命周期。

### 2.1. 管理后台 API (Admin APIs)

这些接口供运营人员在后台管理系统使用。

#### `POST /api/admin/coupons` - 创建优惠券模板

- **功能**: 创建一个新的优惠券模板 (`coupons` 表)。
- **请求体 (Request Body)**:
  ```json
  {
    "coupon_name": "新年满减券",
    "coupon_type": 1, // 1-满减券 2-折扣券 3-固定金额券
    "discount_value": 100.0,
    "min_purchase_amount": 1000.0,
    "total_quantity": 5000,
    "per_user_limit": 1,
    "issue_type": 2, // 1-系统发放 2-活动领取 ...
    "valid_type": 1, // 1-固定日期 2-领取后N天
    "valid_start_time": 1767216000000, // 时间戳
    "valid_end_time": 1769807999000,
    "use_scope": 1, // 1-全部产品 2-指定分类 3-指定产品
    "activity_id": 584280123456789012 // 关联的营销活动ID
  }
  ```
- **核心逻辑**:
  1.  验证输入数据的有效性。
  2.  在 `coupons` 表中插入一条新记录。
  3.  记录操作日志到 `admin_operation_logs`。

### 2.2. 用户端 API (User-Facing APIs)

这些接口供 App 或前端调用。

#### `POST /api/user/coupons/claim` - 用户领取优惠券

- **功能**: 用户通过活动页面等入口主动领取优惠券。
- **请求体 (Request Body)**:
  ```json
  {
    "coupon_id": 584262123456789012 // 优惠券模板ID
  }
  ```
- **核心逻辑**:
  1.  **开启事务**。
  2.  查询 `coupons` 表，使用 `SELECT ... FOR UPDATE` 锁定该行，检查 `issued_quantity < total_quantity`。
  3.  检查用户领取次数是否已达 `per_user_limit` 上限。
  4.  如果验证通过，`UPDATE coupons SET issued_quantity = issued_quantity + 1`。
  5.  在 `user_coupons` 表中为该用户创建一条新记录，状态为 `0` (未使用)。
  6.  **提交事务**。
  7.  返回成功或失败信息。

#### `POST /api/user/coupons/redeem` - 兑换码兑换优惠券

- **功能**: 用户使用兑换码获取优惠券。
- **请求体 (Request Body)**:
  ```json
  {
    "coupon_code": "WELCOME2025"
  }
  ```
- **核心逻辑**:
  1.  根据 `coupon_code` 在 `coupons` 表中查找对应的优惠券模板。
  2.  如果找到，执行与 `claim` 接口类似的逻辑（检查库存、用户限领等）。
  3.  成功后创建 `user_coupons` 记录。

#### `GET /api/user/coupons` - 查询我的优惠券

- **功能**: 用户在“我的优惠券”页面查看持有的优惠券。
- **Query 参数**: `status=0` (0-未使用, 1-已使用, 2-已过期)
- **核心逻辑**:
  1.  根据 `user_id` 和 `status` 在 `user_coupons` 表中查询。
  2.  `JOIN` `coupons` 表以获取优惠券的详细信息（名称、面额、使用条件等）。
  3.  返回优惠券列表。

#### `GET /api/order/available-coupons` - 查询订单可用的优惠券

- **功能**: 在订单确认页面，为当前订单筛选出所有可用的优惠券。
- **Query 参数**:
  - `order_amount`: 订单商品总金额。
  - `treasure_ids`: 订单中所有商品的 ID 列表 (e.g., `10,11,12`)。
  - `category_ids`: 订单中所有商品所属分类的 ID 列表 (e.g., `18,20`)。
- **核心逻辑**:
  1.  查询用户所有“未使用”的优惠券 (`user_coupons.use_status = 0`)。
  2.  在应用层或数据库中进行二次过滤：
      - 检查是否在有效期内。
      - 检查 `order_amount >= coupons.min_purchase_amount`。
      - 检查商品或分类是否满足 `coupons.use_scope` 和 `scope_value`。
  3.  返回可用的优惠券列表及每个优惠券预计可抵扣的金额。

### 2.3. 核心业务逻辑集成

#### 订单创建流程

- **文件**: (找到您处理订单创建的后端服务文件，例如 `OrderService.java` 或 `order_controller.py`)
- **修改点**: 在创建 `orders` 记录的逻辑中：
  1.  接收前端传入的 `user_coupon_id`。
  2.  **在事务中**，再次验证该 `user_coupon_id` 的有效性（`user_id` 匹配, `use_status = 0`）。
  3.  计算 `coupon_amount`。
  4.  将 `user_coupon_id` 和 `coupon_amount` 保存到新的 `orders` 记录中。
  5.  将 `user_coupons` 表中对应的记录状态更新为 `1` (已使用)，并记录 `order_id`。

#### 订单取消/退款流程

- **文件**: (找到您处理订单取消或退款的后端服务文件)
- **修改点**: 在订单状态变为“已取消”或“已退款”后：
  1.  检查 `orders` 记录的 `user_coupon_id` 字段是否有值。
  2.  如果有，根据 `user_coupon_id` 找到对应的 `user_coupons` 记录。
  3.  **返还优惠券**:
      - 检查该优惠券的 `valid_end_time` 是否已过。
      - 如果未过期，将 `use_status` 更新为 `0` (未使用)，并清空 `order_id` 和 `used_at`。
      - 如果已过期，将 `use_status` 更新为 `2` (已过期)。

---

## 步骤 3: 前端集成 (Frontend Integration)

前端需要开发以下界面和交互逻辑来配合优惠券功能。

### 3.1. "我的优惠券" 页面

- **位置**: 通常在 "我的" -> "我的优惠券" 或 "钱包" 内。
- **功能**:
  1.  **Tab 切换**: 提供 "未使用"、"已使用"、"已过期" 三个 Tab。
  2.  **调用 API**: 页面加载时，根据当前选择的 Tab 调用 `GET /api/user/coupons?status={status}` 来获取列表。
  3.  **渲染列表**:
      - 每个优惠券以卡片形式展示。
      - **卡片内容**:
        - 面额 (e.g., `₱100`, `10% OFF`)。
        - 名称 (e.g., "新人专享券")。
        - 使用门槛 (e.g., "满 ₱1000 可用")。
        - 有效期 (e.g., "有效期至: 2025-12-31")。
        - 适用范围 (e.g., "全场通用", "指定商品可用")。
      - 对于“已使用”和“已过期”的券，卡片应置灰显示。
  4.  **空状态**: 如果列表为空，显示友好的提示信息 (e.g., "您还没有可用的优惠券")。
  5.  **(可选) 兑换入口**: 在页面右上角提供一个“兑换优惠券”的入口，点击后弹出输入框，让用户输入兑换码，并调用 `POST /api/user/coupons/redeem`。

### 3.2. 订单确认页面

- **位置**: 用户选择商品，点击“立即购买”后进入的页面。
- **功能**:
  1.  **优惠券入口**: 在订单总金额下方，增加一个“优惠券”或“折扣”的条目。
      - 默认显示“N张可用”或最佳优惠券的抵扣金额。
      - 点击该条目，会弹出一个优惠券选择列表。
  2.  **优惠券选择列表 (弹窗/新页面)**:
      - **调用 API**: 页面加载时，调用 `GET /api/order/available-coupons`，传入当前订单的金额和商品信息。
      - **渲染列表**:
        - 列表顶部提供一个 "不使用优惠券" 的选项。
        - 列出所有可用的优惠券，并清晰地展示每张券可以抵扣的金额。
        - (可选) 对于不可用的优惠券，可以置灰显示在列表底部，并注明原因（如“未达到使用门槛”）。
      - **用户选择**: 用户点击选择一张优惠券后，关闭弹窗/返回订单确认页。
  3.  **更新订单金额**:
      - 返回订单确认页后，页面上的“优惠券”条目更新为已选优惠券的抵扣金额。
      - `final_amount` (最终支付金额) 重新计算并更新。
  4.  **提交订单**: 用户点击“提交订单”时，将选择的 `user_coupon_id` 一同发送给后端。

### 3.3. 活动页面/商品详情页

- **位置**: 营销活动页面或特定商品详情页。
- **功能**:
  1.  **展示可领取优惠券**: 如果有与该活动或商品相关的优惠券，应直接展示出来。
  2.  **领取按钮**: 每个可领取的优惠券旁边都有一个“领取”按钮。
  3.  **调用 API**: 用户点击“领取”时，调用 `POST /api/user/coupons/claim` 接口。
  4.  **更新状态**: 领取成功后，按钮变为“已领取”或“去使用”，并给出成功提示。领取失败（如已达上限或已领完）时，给出相应提示。

---

## 步骤 4: 后台任务 (Background Jobs)

为了确保系统的健壮性，需要开发一些后台定时任务。

### 4.1. 优惠券过期处理任务

- **频率**: 建议每天凌晨执行一次。
- **功能**:
  1.  扫描 `user_coupons` 表。
  2.  找出所有 `use_status = 0` (未使用) 且 `valid_end_time < NOW()` 的记录。
  3.  将这些记录的 `use_status` 更新为 `2` (已过期)。
- **目的**: 确保用户的优惠券状态是准确的，避免前端展示错误的可用券数量。

### 4.2. (可选) 优惠券库存同步任务

- **适用场景**: 如果采用了 Redis 方案来处理高并发领取。
- **频率**: 可以每隔几分钟或使用消息队列异步执行。
- **功能**: 将 Redis 中记录的已发放数量同步回 `coupons` 表的 `issued_quantity` 字段。
- **目的**: 保证数据库中的数据最终一致性。

---

**实施完成**: 遵循以上四个步骤，您就可以在项目中完整地实现优惠券功能。
