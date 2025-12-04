# 优惠券功能设计与优化 (Coupon Feature Design and Optimization)

基于现有的数据库结构，本文档详细阐述了优惠券功能的设计、工作流程和与现有系统的集成方案。

## 1. 核心数据模型

核心数据模型依赖于两张表：`coupons` (优惠券模板) 和 `user_coupons` (用户持有的优惠券)。现有设计已相当完善，覆盖了优惠券的核心属性和生命周期管理。

- **`coupons`**: 定义了优惠券的规则，如类型（满减、折扣）、面额、使用条件（最低消费）、适用范围（指定商品/分类）、有效期规则和发放规则。
- **`user_coupons`**: 记录了用户与优惠券的关联，包括优惠券的状态（未使用、已使用、已过期）、有效期和使用记录。

## 2. 优惠券核心工作流程

### 2.1. 流程总览

```
+----------------+     +-------------------+     +----------------+
|   Admin        | --> |   创建优惠券模板    | --> |   发放/投放     |
| (后台管理)      |     |   (coupons 表)    |     |   (多种方式)    |
+----------------+     +-------------------+     +-------+--------+
                                                         |
                                                         v
+----------------+     +-------------------+     +-------+--------+
|   用户         | <-- |   领取优惠券        | <-- |   营销活动/推送   |
| (App)          |     | (user_coupons 表) |     +----------------+
+-------+--------+     +-------------------+
        |
        v
+----------------+     +-------------------+     +----------------+
|   选择商品并下单   | --> |   选择并使用优惠券    | --> |   后端验证      |
| (orders 表)    |     |   (App-API)       |     |   (有效性/适用性) |
+----------------+     +-------------------+     +-------+--------+
                                                         |
                                                         v
+----------------+     +-------------------+     +----------------+
|   订单金额计算   | --> |   更新优惠券状态      | --> |   完成支付      |
| (final_amount) |     | (user_coupons)    |     |   (payments 表) |
+----------------+     +-------------------+     +----------------+
```

### 2.2. 详细流程

#### 步骤 1: 创建优惠券模板 (Admin)

管理员在后台系统中创建优惠券模板 (`coupons` 表)。

- **场景**: 运营人员为“新年活动”创建一张“满₱1000减₱100”的优惠券。
- **操作**:
  1.  在后台填写优惠券信息：名称、类型（满减）、`min_purchase_amount` (1000), `discount_value` (100)。
  2.  设置发放方式 (`issue_type`)，例如“活动领取”。
  3.  设置使用范围 (`use_scope`)，例如“全场通用”。
  4.  设置有效期 (`valid_type`)，例如“固定日期范围”。
  5.  设置发行量 (`total_quantity`)。
- **数据库交互**: 在 `coupons` 表中插入一条新记录。

#### 步骤 2: 发放与领取 (System/User)

优惠券通过不同渠道触达用户，用户领取后将在 `user_coupons` 表中创建记录。

- **发放方式**:
  1.  **系统自动发放**:
      - **场景**: 新用户注册成功后，自动发放一张“新人专享券”。
      - **实现**: 在用户注册成功后的业务逻辑中，触发一个事件。该事件的监听器会为新用户在 `user_coupons` 表中插入一条记录。`receive_type` 设为 `1` (系统发放)。
  2.  **用户主动领取**:
      - **场景**: 用户在活动页面点击“领取优惠券”。
      - **实现**: 前端调用“领取优惠券”API。后端检查用户领取资格（是否已达上限 `per_user_limit`，优惠券是否还有库存 `issued_quantity < total_quantity`）。验证通过后，在 `user_coupons` 表创建记录，并增加 `coupons.issued_quantity`。`receive_type` 设为 `2` (主动领取)。
  3.  **兑换码兑换**:
      - **场景**: 用户输入一个兑换码（如 `WELCOME2025`）来获取优惠券。
      - **实现**: 后端提供“兑换码”API。API根据 `coupons.coupon_code` 查找优惠券，并执行与“主动领取”类似的资格验证，然后创建 `user_coupons` 记录。`receive_type` 设为 `3` (兑换码)。
  4.  **邀请/活动奖励**:
      - **场景**: 用户成功邀请一位好友并好友完成首充，邀请人获得一张奖励券。
      - **实现**: 在 `user_invitations` 表的状态更新为“已完成首充”时，触发奖励发放逻辑，为邀请人在 `user_coupons` 表创建记录。`receive_type` 设为 `4` (邀请奖励)。

- **数据库交互**:
  - `INSERT INTO user_coupons` (设置 `user_id`, `coupon_id`, `valid_start_time`, `valid_end_time`, `use_status=0`)。
  - `UPDATE coupons SET issued_quantity = issued_quantity + 1`。
  - 整个过程需要在一个数据库事务中完成，以保证数据一致性。

#### 步骤 3: 订单中使用优惠券 (User/System)

用户在下单时选择使用优惠券。

- **操作**:
  1.  **查询可用优惠券**: 用户进入订单确认页面时，App 调用 API，传入 `user_id` 和订单商品信息（`treasure_id` 列表、总金额）。
  2.  **后端筛选**: API 根据以下条件在 `user_coupons` 表中筛选可用优惠券：
      - `user_id` 匹配。
      - `use_status` 为 `0` (未使用)。
      - 当前时间在 `valid_start_time` 和 `valid_end_time` 之间。
      - 订单总金额 >= `coupons.min_purchase_amount`。
      - 订单商品符合 `coupons.use_scope` (全场/指定分类/指定商品)。
  3.  **前端展示**: API 返回可用优惠券列表，前端展示给用户选择。
  4.  **用户选择**: 用户选择一张优惠券后，前端将 `user_coupon_id` 连同订单信息一起提交。

- **数据库交互**:
  - `SELECT` from `user_coupons` JOIN `coupons` on `user_coupons.coupon_id = coupons.coupon_id` with a complex `WHERE` clause.

#### 步骤 4: 创建订单与锁定优惠券

用户提交订单后，后端进行最终验证并创建订单。

- **操作**:
  1.  **最终验证**: 后端在创建订单前，再次验证用户选择的 `user_coupon_id` 的有效性，防止在用户选择到提交的间隙，优惠券状态发生变化。
  2.  **计算金额**:
      - `original_amount`: 商品总价。
      - `coupon_amount`: 根据优惠券规则计算出的抵扣金额。
      - `final_amount`: `original_amount` - `coupon_amount` - `coin_amount` ...
  3.  **创建订单**: 在 `orders` 表中创建一条记录，`order_status` 为 `1` (待支付)。同时，将 `user_coupon_id` 存入 `orders.coupon_id` 字段（**注意：这里建议将 `orders.coupon_id` 改为 `orders.user_coupon_id` 以精确关联到用户优惠券实例，而非优惠券模板**）。
  4.  **更新优惠券状态**: 将 `user_coupons` 表中对应记录的 `use_status` 更新为 `1` (已使用)，并记录 `order_id`。

- **数据库交互**:
  - `BEGIN TRANSACTION;`
  - `SELECT ... FOR UPDATE` on the `user_coupons` row to lock it.
  - `INSERT INTO orders` (with `user_coupon_id`, `coupon_amount`, etc.)
  - `UPDATE user_coupons SET use_status = 1, order_id = ?, used_at = NOW()`
  - `COMMIT;`

#### 步骤 5: 订单支付与取消

- **支付成功**: 订单支付成功后，流程正常结束。
- **订单取消/支付超时**:
  - **场景**: 用户未支付，订单在30分钟后自动取消。
  - **实现**: 需要一个机制来处理订单取消事件（可以是定时任务扫描，也可以是取消操作触发的事件）。
  - **优惠券返还**: 当订单状态变为 `3` (已取消) 或 `4` (已退款) 时，检查该订单是否使用了优惠券 (`orders.user_coupon_id` 是否有值)。如果有，则将对应的 `user_coupons` 记录的 `use_status` 重置为 `0` (未使用)，并清空 `order_id` 和 `used_at`。
  - **注意**: 需要检查返还的优惠券是否已过期，如果已过期，则状态应设为 `2` (已过期)。

- **数据库交互**:
  - `UPDATE user_coupons SET use_status = 0, order_id = NULL, used_at = NULL WHERE order_id = ?`

## 3. 设计优化建议

### 3.1. 数据库表结构优化

1.  **明确 `orders.coupon_id` 的含义**:
    - **问题**: `orders` 表中的 `coupon_id` 字段可能引起混淆，它应该关联到 `coupons` (模板) 还是 `user_coupons` (实例)？
    - **建议**: 将 `orders.coupon_id` 重命名为 `user_coupon_id`，并添加外键约束 `FOREIGN KEY (user_coupon_id) REFERENCES user_coupons(user_coupon_id)`。这可以更精确地追踪是哪一张优惠券被用在了哪个订单上，便于管理和数据分析。

    ```sql
    -- 建议的 orders 表修改
    ALTER TABLE orders CHANGE COLUMN coupon_id user_coupon_id BIGINT COMMENT '使用的用户优惠券ID';
    -- 如果之前没有外键，可以加上
    ALTER TABLE orders ADD CONSTRAINT fk_user_coupon FOREIGN KEY (user_coupon_id) REFERENCES user_coupons(user_coupon_id) ON DELETE SET NULL;
    ```

2.  **增加优惠券活动关联**:
    - **问题**: 当前设计无法直接从优惠券追溯到它是由哪个具体营销活动产生的。
    - **建议**: 在 `coupons` 表中增加一个 `activity_id` 字段，关联到 `marketing_activities` 表。

    ```sql
    -- 建议的 coupons 表修改
    ALTER TABLE coupons ADD COLUMN activity_id BIGINT COMMENT '关联的营销活动ID' AFTER coupon_code;
    ALTER TABLE coupons ADD CONSTRAINT fk_activity FOREIGN KEY (activity_id) REFERENCES marketing_activities(activity_id) ON DELETE SET NULL;
    ```

### 3.2. 性能与扩展性

1.  **优惠券可用性查询性能**:
    - **问题**: 步骤 3.2 中筛选可用优惠券的查询可能会很复杂且耗时，尤其当用户持有大量优惠券时。
    - **建议**:
      - **建立复合索引**: 在 `user_coupons` 表上为 `(user_id, use_status, valid_end_time)` 创建复合索引，可以大大加快查询速度。
      - **缓存**: 可以将用户的可用优惠券列表缓存一小段时间（如1分钟），避免每次进入订单页都进行复杂的数据库查询。当用户领取、使用或有优惠券过期时，需要清除缓存。

2.  **高并发领取**:
    - **问题**: 在热门活动中，优惠券的领取可能面临高并发挑战，简单的 `UPDATE coupons SET issued_quantity = issued_quantity + 1` 可能会导致锁竞争。
    - **建议**:
      - **使用 Redis**: 将优惠券的库存 (`total_quantity` - `issued_quantity`) 存入 Redis。利用 Redis 的原子操作 `DECR` 来扣减库存，可以高效地处理高并发请求。当 Redis 库存不足时，直接拒绝请求。数据库中的 `issued_quantity` 可以通过定时任务或消息队列异步更新，作为最终一致性的保证。

## 4. 总结

现有的优惠券数据库设计已经非常扎实。通过上述的流程细化和几点优化建议（特别是将 `orders.coupon_id` 重命名为 `user_coupon_id` 并增加外键），可以使优惠券系统在功能上更健壮、逻辑上更清晰，并具备应对高并发场景的潜力。
