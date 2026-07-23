# src/app/ — 前端规范

## App Router 规则

### 页面与布局

- 每个路由目录必须包含 `page.tsx`，这是唯一的入口文件
- `layout.tsx` 仅在需要共享 UI（导航栏、侧边栏）时添加
- 根 `layout.tsx` 负责：`<html>` / `<body>` 标签、字体加载、全局 Provider
- 子路由 `layout.tsx` 只做该路由段的共享布局，不重复根布局职责
- `loading.tsx` 为每个有数据获取的页面提供骨架屏
- `error.tsx` 为每个路由提供错误边界 UI

### Server vs Client Component

| 特征 | Server Component | Client Component |
|------|------------------|------------------|
| 标记 | 无 `"use client"` | 文件顶部 `"use client"` |
| 适用 | 静态展示、数据获取、SEO | 表单交互、useState、onClick |
| 数据源 | 直接 `db.query()` | props / Server Action |

**划分原则**：
- 最小化 `"use client"` 范围 — 只在真正需要交互的组件上加
- Server Component 禁止使用 `useState`, `useEffect`, 事件处理函数
- 数据展示优先在 Server Component 中直接查 DB（不走 API fetch）
- 数据提交走 Server Action 或 API 路由

---

### API 路由 (`route.ts`)

- 仅用于串联多步服务调用（如 scraper → deepseek → db）
- 纯数据查询/读取优先用 Server Component 直接查 DB，不走 `/api/*`
- 每个 `route.ts` 导出标准 HTTP 方法函数：`GET`, `POST`, `DELETE`
- 返回使用 `NextResponse.json()`，不用原生 `Response`

**错误响应格式（统一）**：
```json
{ "error": "具体错误描述", "code": "SCRAPE_FAILED" }
```

---

## 组件规范

### 文件结构顺序

```typescript
// 1. "use client" 标记（仅在需要时）
"use client";

// 2. 导入（按全局规范分组）
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSummary } from "@/lib/db/queries";
import type { Summary } from "@/lib/db/schema";

// 3. Props interface（必须显式定义）
interface UrlInputFormProps {
  onSuccess: (result: Summary) => void;
}

// 4. 组件函数
export default function UrlInputForm({ onSuccess }: UrlInputFormProps) {
  // ...
}
```

### Props 定义

- 所有组件 Props 必须定义独立 `interface`，不使用 inline 类型
- Props 命名：`XxxProps`（组件名 + Props）
- 回调 Props 命名：`onXxx` — `onSuccess`, `onClick`, `onChange`

```typescript
// ✅
interface SummaryCardProps {
  title: string;
  summaries: {
    oneSentence: string;
    short: string;
    detailed: string;
  };
}

// ❌ 不允许 inline
function SummaryCard({ title }: { title: string }) { ... }
```

### 组件拆分

- 页面组件 (`page.tsx`) 负责数据获取和布局编排，不内嵌复杂交互逻辑
- 交互组件（表单、按钮组）独立为 `Client Component` 文件
- 展示组件（卡片、列表项）独立为 `Server Component` 文件
- 单组件不超过 80 行 JSX，超过则拆分子组件

---

## 状态管理

- 数据提交：优先使用 **Server Actions**（`"use server"`）
- 表单状态：用 React 19 的 `useActionState`
- URL 状态：用 `useSearchParams`（搜索、分页参数）
- 不引入 Zustand / Redux / Jotai 等外部状态库

### Server Action 示例

```typescript
// src/app/actions.ts
"use server";

import { createSummary } from "@/lib/db/queries";
import { revalidatePath } from "next/cache";

export async function submitUrl(formData: FormData) {
  const url = formData.get("url") as string;
  // ... 业务逻辑
  revalidatePath("/"); // 刷新首页数据
}
```

---

## Tailwind CSS 规范

### 核心规则

- **不自定义 CSS class** — 全部使用 Tailwind 原子类
- `globals.css` 仅放 Tailwind 指令（`@import "tailwindcss"`）和 CSS 变量
- 不使用 `@apply` 在组件中抽象组合类（直接写原子类更透明）
- 颜色只用 Tailwind 默认色板（blue, gray, green, red 等）
- 不自定义 `tailwind.config.ts` 的 `theme.extend.colors`

### 常用 UI 模式

```typescript
// 卡片容器
className="rounded-lg border bg-white p-4 shadow-sm"

// 主按钮
className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"

// 输入框
className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"

// 骨架屏
className="animate-pulse rounded-md bg-gray-200"

// 错误提示
className="rounded-md bg-red-50 p-3 text-sm text-red-700"

// 页面容器
className="mx-auto max-w-3xl px-4 py-8"
```

### 响应式断点

- `sm: 640px` — 移动端横屏
- `md: 768px` — 平板
- `lg: 1024px` — 桌面（默认设计基准）
- `xl: 1280px` — 大屏

**规则**：桌面优先设计，移动端用 `sm:` / `md:` 覆盖。

### 暗色模式

- **当前不实现暗色模式**
- 所有页面仅 light theme
- 颜色选择确保白色背景上可读

---

## 页面结构模式

### 首页 (`page.tsx`)

```
┌───────────────────────────────────┐
│         URL 输入表单              │  ← Client Component (UrlInputForm)
│         [提交按钮]                │
├───────────────────────────────────┤
│         摘要结果展示              │  ← Server/Client Component
│   ┌──────────┐ ┌──────────┐      │     三种长度的摘要卡片
│   │ 一句话   │ │ 短摘要   │      │
│   └──────────┘ └──────────┘      │
│   ┌──────────────────────────┐   │
│   │       详细摘要            │   │
│   └──────────────────────────┘   │
├───────────────────────────────────┤
│         最近历史记录              │  ← Server Component (直接查 DB)
│   title | date | →查看详情       │
└───────────────────────────────────┘
```

- 摘要生成期间显示加载状态（骨架屏 / spinner）
- 生成失败显示 inline 错误提示，不跳转
- 提交按钮禁用状态防止重复提交

### 历史页 (`history/page.tsx`)

```
┌───────────────────────────────────┐
│         历史记录列表              │  ← Server Component (直接查 DB)
│   ┌──────────────────────────┐   │
│   │  标题 | 日期 | 一句话摘要 │   │
│   └──────────────────────────┘   │
│         分页控件                  │  ← Client Component
└───────────────────────────────────┘
```

- 列表项点击跳转详情（或在当前页展开）
- 分页用 URL 参数 `?page=N`，支持 SSR
- 无历史记录时显示空状态提示

---

## 加载与错误状态

### loading.tsx 模板

```typescript
// src/app/loading.tsx
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-10 rounded-md bg-gray-200" />
        <div className="h-40 rounded-md bg-gray-200" />
        <div className="h-20 rounded-md bg-gray-200" />
      </div>
    </div>
  );
}
```

### error.tsx 模板

```typescript
// src/app/error.tsx
"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        出错了，请重试
      </div>
      <button onClick={reset} className="mt-4 ...">
        重试
      </button>
    </div>
  );
}
```

### 业务错误提示文案

| 场景 | 提示文案 |
|------|----------|
| 网络错误 | "网络请求失败，请检查连接后重试" |
| URL 不合法 | "请输入有效的文章链接" |
| 抓取失败 | "无法获取文章内容，请检查链接是否可访问" |
| 内容为空 | "该页面未找到可读的正文内容" |
| AI 失败 | "AI 摘要生成失败，请稍后重试" |
| 重复提交 | "正在处理中，请稍候..." |

---

## 数据流模式

### 读数据（Server Component）

```typescript
// page.tsx (Server Component)
import { getRecentSummaries } from "@/lib/db/queries";

export default async function HomePage() {
  const recent = await getRecentSummaries(10);
  return <HistoryList items={recent} />;
}
```

### 写数据（Server Action 或 API 路由）

```typescript
// 方式一：Server Action（推荐，自动 revalidate）
"use server";
export async function deleteSummary(id: number) {
  await db.delete(summaries).where(eq(summaries.id, id));
  revalidatePath("/history");
}

// 方式二：API 路由（多步服务调用必须用这个）
// POST /api/summarize → scraper → deepseek → db
```

**选择原则**：
- 单步 DB 操作 → Server Action
- 多步串联（抓取 → AI → 存储） → API 路由
