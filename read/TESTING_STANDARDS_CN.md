# 测试用例编写规范

> 根据 Phase 5.5 / Phase 6 修复经验总结，下次遇到这些问题直接对照此文档。

---

## 一、高频错误速查表

| 错误现象 | 根本原因 | 解决方案 |
|---------|---------|---------|
| `react/display-name` | `vi.mock` 里用内联对象写 `React.forwardRef` | 改用工厂函数 + `.displayName = '...'` |
| `@typescript-eslint/no-unused-vars` | 解构时丢弃的 prop（如 `variant: _variant`） | 用 `/* eslint-disable/enable */` 块包裹整段 |
| `prettier/prettier: Delete ⏎` | 文件末尾多余空行 / CRLF 混入 | 保证文件以**单个 `\n`** 结尾，不要两行空行 |
| 测试断言错误（参数数量不对） | 旧版 describe 块没删干净（duplicate） | **提交前搜一遍同名 `describe`，只保留最新版** |
| `toHaveBeenCalledWith` 匹配失败 | Mock 响应缺少新增字段（如 `userInfo`） | API 签名改变时同步更新所有相关 mock |

---

## 二、vi.mock 编写规范

### ✅ 正确：工厂函数 + displayName

```typescript
vi.mock('@/components/UIComponents', () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const Button = ({
    children,
    onClick,
    type,
    isLoading,
    disabled,
    variant: _variant,   // 故意丢弃，避免传给原生 DOM
    size: _size,
    className: _className,
    ...rest
  }: React.PropsWithChildren<{ ... }>) => (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled || isLoading} {...rest}>
      {isLoading ? 'Loading…' : children}
    </button>
  );

  const Input = React.forwardRef(
    ({ error, className: _className, ...props }: ..., ref) => (
      <div>
        <input ref={ref} {...props} />
        {error && <span role="alert">{error}</span>}
      </div>
    ),
  );
  /* eslint-enable @typescript-eslint/no-unused-vars */
  Input.displayName = 'Input';   // ← 必须！否则报 react/display-name

  return { Button, Input };
});
```

### ❌ 错误：内联对象 + React.forwardRef（会报 react/display-name）

```typescript
vi.mock('@/components/UIComponents', () => ({
  Input: React.forwardRef((...) => <div>...</div>),  // ← 缺少 displayName
}));
```

---

## 三、Mock 数据与函数签名同步规范

**每次修改以下内容，必须同步更新对应测试文件：**

| 修改位置 | 必须同步更新 |
|---------|-------------|
| API 响应结构新增字段（如 `userInfo`） | 所有 `mockXxx.mockResolvedValue(...)` |
| store action 函数签名新增参数（如 `login(token, role, userInfo)`） | 所有 `toHaveBeenCalledWith(...)` 断言 |
| 组件 placeholder / 文案修改 | `getByPlaceholderText` / `getByText` 对应正则 |
| 路由跳转目标修改 | `toHaveBeenCalledWith('/')` 等路由断言 |

### 示例：login store 签名升级

```typescript
// ❌ 旧断言（签名更新前，只传 1 个参数）
expect(mockLogin).toHaveBeenCalledWith('jwt-abc');

// ✅ 新断言（签名变为 login(token, role, userInfo)）
expect(mockLogin).toHaveBeenCalledWith(
  'jwt-abc',
  'SUPER_ADMIN',
  expect.objectContaining({ id: 'admin-1', role: 'SUPER_ADMIN' }),
);
```

---

## 四、禁止遗留重复 describe 块

> **这是导致本次 Login.test.tsx 失败的直接原因。**

当你需要升级/重写一批测试时，**务必删除旧的 describe 块**，不要两个并存。

```
// ✅ 只保留一个
describe('Login page', () => { ... });

// ❌ 严禁两个同名 describe 共存（旧的会用错误的 mock 一直失败）
describe('Login page', () => { ... });  // 新版
describe('Login page', () => { ... });  // 旧版 ← DELETE THIS
```

**提交前检查命令：**
```bash
# 在测试文件里搜同名 describe，发现两个立刻删旧的
grep -n "describe(" src/__tests__/views/Login.test.tsx
```

---

## 五、Prettier 格式规范（printWidth: 80）

项目配置：`singleQuote: true` / `trailingComma: "all"` / `printWidth: 80`

### 长函数调用超过 80 字符必须拆行

```typescript
// ❌ 超过 80 字符
await user.type(screen.getByPlaceholderText(/email address/i), 'john@company.com');

// ✅ 拆行 + trailing comma
await user.type(
  screen.getByPlaceholderText(/email address/i),
  'john@company.com',
);
```

```typescript
// ❌
fireEvent.click(screen.getByRole('button', { name: /submit application/i }));

// ✅ 拆行 + trailing comma
fireEvent.click(
  screen.getByRole('button', { name: /submit application/i }),
);
```

### 文件末尾

- **只允许一个 `\n`**（编辑器保存时自动加）
- **禁止** 文件末尾有 2 个以上空行

---

## 六、测试结构模板

每个 view 测试文件的标准结构：

```typescript
// 1. 基础 import
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { framerMotionMock } from '../mocks/view-helpers';

// 2. vi.hoisted — 必须在所有 vi.mock 之前
const mockXxx = vi.hoisted(() => vi.fn());

// 3. vi.mock — 按依赖顺序，外部库优先
vi.mock('framer-motion', () => framerMotionMock);
vi.mock('next/link', () => ({ default: ({ href, children, ...r }) => <a href={href} {...r}>{children}</a> }));
vi.mock('@/api', () => ({ xxxApi: { method: mockXxx } }));
vi.mock('@/components/UIComponents', () => { /* 工厂函数写法 */ });

// 4. subject import — 放在所有 mock 之后（vitest 会自动 hoist，顺序只是语义上的）
import { MyView } from '@/views/MyView';

// 5. 共用 helper
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) { ... }

// 6. 单个 describe，内部按功能分组
describe('MyView', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  // ── rendering ──────────────────────────────────────────────────
  it('renders ...', () => { ... });

  // ── validation ────────────────────────────────────────────────
  it('shows error when ...', async () => { ... });

  // ── success ───────────────────────────────────────────────────
  it('submits and shows success', async () => { ... });

  // ── error handling ────────────────────────────────────────────
  it('shows server error', async () => { ... });
});
// ← 文件结束，只有这一个 describe，末尾一个 \n
```

---

## 七、常用 Accessible Role 速查

| 元素 | role | 查询方式 |
|------|------|---------|
| `<button>` | `button` | `getByRole('button', { name: /文字/i })` |
| `<a href="...">` | `link` | `getByRole('link', { name: /文字/i })` |
| `<input>` | `textbox` / `password` | `getByPlaceholderText(...)` 更直观 |
| `<span role="alert">` | `alert` | `getAllByRole('alert')` |
| `<select>` | `combobox` | `getByRole('combobox', { name: /标签/i })` |

---

## 八、`waitFor` 使用原则

```typescript
// ✅ 异步验证用 waitFor
await waitFor(() => expect(screen.getByText(/success/i)).toBeInTheDocument());

// ✅ 多个断言放同一个 waitFor，避免竞态
await waitFor(() => {
  expect(mockSubmit).toHaveBeenCalled();
  expect(mockRouterPush).toHaveBeenCalledWith('/');
});

// ❌ 不要多个串行 waitFor（后一个可能在前一个完成前就超时）
await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/'));  // 可能超时
```

