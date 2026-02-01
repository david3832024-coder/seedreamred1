# Supabase 登录注册与积分完整代码示例

本文档汇总项目中「注册、登录验证、积分更新和保存」的完整实现位置与用法。

## 前置条件

1. 已配置 `.env`：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`
2. 已在 Supabase 执行 `supabase-setup.sql`（含 `user_profiles` 表与触发器）
3. Supabase 控制台 → Authentication → Settings → **禁用** Email Confirmation

---

## 1. 类型与客户端（`src/services/supabaseClient.ts`）

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } }
);

export interface UserProfile {
  id: string;
  username: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  username: string;
  credits: number;
}

export interface SignUpData {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface SignInData {
  username: string;
  password: string;
}
```

---

## 2. 注册（用户名 + 两次密码，首次赠送 100 积分）

**实现位置**：`src/services/authService.ts` → `signUp`

流程概要：

- 校验：两次密码一致、密码≥6 位、用户名≥2 位
- 邮箱：使用 `用户名@local.app`（Supabase 要求邮箱格式）
- 调用 `supabase.auth.signUp`，并在 `options.data` 中传入 `username`
- 用户档案由数据库触发器 `handle_new_user()` 自动插入 `user_profiles` 并设置 `credits = 100`
- 注册成功后从 `user_profiles` 查询档案并返回 `AuthUser`

**在 Store 中调用**（`src/stores/useAuthStore.ts`）：

```typescript
const { signUp } = useAuthStore();

const success = await signUp({
  username: 'myuser',
  password: 'mypassword123',
  confirmPassword: 'mypassword123'
});
if (success) {
  // 已登录，user 已更新，含 credits: 100
}
```

---

## 3. 登录验证

**实现位置**：`src/services/authService.ts` → `signIn`

- 使用 `用户名@local.app` + 密码调用 `supabase.auth.signInWithPassword`
- 登录成功后从 `user_profiles` 拉取档案（含 `credits`）并返回 `AuthUser`

**在 Store 中调用**：

```typescript
const { signIn } = useAuthStore();

const success = await signIn({
  username: 'myuser',
  password: 'mypassword123'
});
if (success) {
  // 已登录，user 含最新 credits
}
```

---

## 4. 积分更新与保存

**实现位置**：`src/services/authService.ts`

- `updateCredits(userId, newCredits)`：直接写入 `user_profiles.credits` 与 `updated_at`
- `deductCredits(userId, amount)`：先查当前积分，不足返回错误；否则扣减并调用 `updateCredits`
- `addCredits(userId, amount)`：先查当前积分，加上 `amount` 后调用 `updateCredits`

积分持久化在 Supabase 表 `user_profiles` 的 `credits` 字段。

**在 Store 中调用**（`src/stores/useAuthStore.ts`）：

```typescript
const { user, deductCredits, addCredits, updateCredits } = useAuthStore();

// 扣除积分（如生成图片）
const ok = await deductCredits(20);
if (ok) {
  // 本地 user.credits 已更新，数据库已保存
}

// 增加积分（如充值回调）
const ok = await addCredits(100);

// 仅更新本地状态（通常由 deductCredits/addCredits 内部同步）
updateCredits(newValue);
```

---

## 5. 初始化与登出

**应用入口初始化**（`src/App.tsx` 中）：

```typescript
const initializeAuth = useAuthStore((s) => s.initializeAuth);

useEffect(() => {
  initializeAuth();
}, [initializeAuth]);
```

**登出**：

```typescript
const { signOut } = useAuthStore();
await signOut();
```

---

## 6. UI 入口

- **登录/注册弹窗**：`src/components/Auth/LoginModal.tsx`  
  - 注册：用户名、密码、确认密码；提交即调用 `signUp`，成功后关闭并提示 100 积分
  - 登录：用户名、密码；提交即调用 `signIn`
- **头部用户与积分**：`src/App.tsx` 中展示 `user?.credits`、打开 `LoginModal`、登出

---

## 7. 数据库要点（`supabase-setup.sql`）

- `user_profiles`：`id`（= auth.users.id）、`username`（唯一）、`credits`（默认 100）、`created_at`、`updated_at`
- 触发器 `on_auth_user_created`：在 `auth.users` 插入后执行 `handle_new_user()`，向 `user_profiles` 插入一行，`username` 取自 `raw_user_meta_data->>'username'`，`credits = 100`
- RLS：用户仅能 SELECT/UPDATE/INSERT 自己的 `user_profiles` 行

以上即项目中「注册、登录验证、积分更新和保存」的完整链路与代码位置。
