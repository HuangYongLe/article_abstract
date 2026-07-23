# src/lib/ — 后端与数据库规范

## 模块职责划分

```
src/lib/
├── db/
│   ├── index.ts     # Drizzle 客户端实例（单例模式）
│   ├── schema.ts    # 所有表定义（唯一来源）
│   └── queries.ts   # 查询函数封装（所有 DB 操作入口）
├── scraper.ts       # 文章抓取服务（Cheerio + Browserless 兜底）
├── deepseek.ts      # DeepSeek 客户端 + Prompt 管理
└── utils.ts         # 纯工具函数（URL 校验、文本截断、日期格式化）
```

**模块依赖规则**：
- `db/` 不依赖 `scraper` 或 `deepseek`（数据层不依赖业务层）
- `scraper` / `deepseek` 可以调用 `db/`（业务层可依赖数据层）
- `utils.ts` 不依赖任何其他内部模块（纯函数层）
- API 路由依赖 `lib/*`，但 `lib/*` 不依赖 API 路由

---

## 数据库规范 (Drizzle ORM)

### 客户端实例 (`db/index.ts`)

```typescript
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// 单例模式 — 模块顶层创建，不延迟到函数内
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(client, { schema });
```

**规则**：
- `db` 在模块顶层 `export`，全局唯一实例
- 环境变量从 `process.env` 读取，不硬编码
- 非生产环境 `authToken` 可为空（本地 Turso）

---

### Schema 定义 (`db/schema.ts`)

**规则**：
- 所有表定义集中在 `schema.ts`，不拆分多个文件
- 不在其他文件中重复定义表结构

**命名规范**：
- 表名：小写蛇形 — `summaries`
- 列名：小写蛇形 — `one_sentence`, `created_at`
- 导出类型用 `$inferSelect` / `$inferInsert`，不手写重复 interface

```typescript
// ✅ 从 schema 推导类型
export type Summary = typeof summaries.$inferSelect;
export type NewSummary = typeof summaries.$inferInsert;

// ❌ 不手写重复类型
export interface Summary {
  id: number;
  url: string;
  // ... 重复 schema 定义
}
```

**列定义模式**：

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const summaries = sqliteTable("summaries", {
  // 主键 — 统一自增 integer
  id: integer("id").primaryKey({ autoIncrement: true }),

  // 必填文本 — .notNull()
  url: text("url").notNull(),
  title: text("title").notNull(),

  // 可选文本 — 不加 .notNull()
  siteName: text("site_name"),

  // 时间戳 — integer + unixepoch + 默认值
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
```

**时间戳规则**：
- 统一用 `integer` + `{ mode: "timestamp" }` 存储 Unix 时间戳
- 默认值用 `sql`(unixepoch())``，不用 JS 函数
- 不使用 `text` 存日期字符串

---

### 查询函数 (`db/queries.ts`)

**核心规则**：
- **所有 DB 操作必须通过 `queries.ts` 函数调用**
- 不在 API 路由或组件中直接写 `db.select()` / `db.insert()`
- 查询函数返回具体类型，不返回 `any`

```typescript
import { db } from "./index";
import { summaries, eq, desc } from "./schema";
import type { NewSummary, Summary } from "./schema";

// 列表查询 — 必须包含分页
export async function getSummaries(
  page: number = 1,
  limit: number = 10
): Promise<Summary[]> {
  return db
    .select()
    .from(summaries)
    .orderBy(desc(summaries.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
}

// 单条查询 — 返回 null 表示未找到（不 throw）
export async function getSummaryById(
  id: number
): Promise<Summary | null> {
  const [result] = await db
    .select()
    .from(summaries)
    .where(eq(summaries.id, id));
  return result ?? null;
}

// 创建记录 — 返回完整记录
export async function createSummary(
  data: NewSummary
): Promise<Summary> {
  const [result] = await db.insert(summaries).values(data).returning();
  return result;
}

// 删除记录
export async function deleteSummary(id: number): Promise<void> {
  await db.delete(summaries).where(eq(summaries.id, id));
}

// 统计总数 — 用于分页计算
export async function countSummaries(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(summaries);
  return result.count;
}
```

**分页规则**：
- 列表查询必须包含 `limit` + `offset`
- 默认 `page=1, limit=10`
- 配合 `countSummaries()` 计算总页数

---

### 迁移管理

| 环境 | 命令 | 说明 |
|------|------|------|
| 开发 | `npx drizzle-kit push` | 直接同步 schema 到数据库 |
| 生产 | `npx drizzle-kit generate` → `npx drizzle-kit migrate` | 增量迁移 |

**规则**：
- 开发阶段用 `push`（快速迭代）
- 上线后必须用 `generate + migrate`（可审计、可回滚）
- 每次修改 `schema.ts` 后立即执行对应命令
- 迁移文件（`drizzle/` 目录）提交到 Git

---

## Scraper 规范 (`scraper.ts`)

### 两层抓取策略

```typescript
const MIN_CONTENT_LENGTH = 100;

export async function scrapeArticle(url: string): Promise<ScrapeResult> {
  // 第一层：Cheerio（快、免费，覆盖 SSR 页面）
  const result = await scrapeWithCheerio(url);
  if (result.content.length >= MIN_CONTENT_LENGTH) return result;

  // 第二层：Browserless API 兜底（JS 渲染页面）
  return scrapeWithBrowserless(url);
}
```

**判定规则**：
- 正文长度 < 100 字符 → 判定为 JS 渲染页面，触发兜底
- 兜底调用失败 → 仍然返回 Cheerio 结果（部分内容优于无内容）

---

### Cheerio 提取规则 (`scrapeWithCheerio`)

**正文选择器优先级**：
```
article → main → [role="main"] → .post-content → .article-body → body
```

**清洗规则**：
```typescript
// 移除这些标签及其内容
const REMOVE_TAGS = "script, style, nav, footer, header, aside, iframe, .ad, .advertisement, .sidebar, [class*=nav], [class*=menu]";
articleEl.find(REMOVE_TAGS).remove();
```

**标题提取优先级**：
```
og:title → <title> → <h1> → "Untitled"
```

**微信图片处理**：
```typescript
// 微信公众号用 data-src 做懒加载
$("img[data-src]").each((_, el) => {
  const src = $(el).attr("data-src");
  if (src) $(el).attr("src", src);
});
```

**内容截断**：
```typescript
const MAX_CONTENT_LENGTH = 12000; // ~3000 tokens

const content = articleEl.text()
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, MAX_CONTENT_LENGTH);
```

**Fetch 配置**：
```typescript
const res = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; ArticleSummarizer/1.0)",
    "Accept": "text/html,application/xhtml+xml",
  },
  signal: AbortSignal.timeout(10000), // 10s 超时
});
```

---

### Browserless 兜底 (`scrapeWithBrowserless`)

```typescript
const BROWSERLESS_API_URL = "https://chrome.browserless.io/content";

async function scrapeWithBrowserless(url: string): Promise<ScrapeResult> {
  const res = await fetch(BROWSERLESS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify({ url }),
  });

  const html = await res.text();
  // 用同样的 Cheerio 解析逻辑处理渲染后的 HTML
  return parseHtmlContent(html, url);
}
```

**规则**：
- Browserless API key 从 `process.env.BROWSERLESS_API_KEY` 读取
- 兜底调用超时 15s（比 Cheerio 更长，因为需要 JS 渲染）
- 兜底结果同样经过 Cheerio 解析和清洗

---

### 返回类型

```typescript
export interface ScrapeResult {
  url: string;
  title: string;
  content: string;
  siteName: string | null;
}
```

---

## DeepSeek 规范 (`deepseek.ts`)

> DeepSeek API 完全兼容 OpenAI 接口格式，使用同一个 OpenAI SDK，
> 只需改 `baseURL` 和 `apiKey`。

### 客户端实例

```typescript
import OpenAI from "openai";

// 单例模式 — 模块顶层创建
// 使用 OpenAI SDK 连接 DeepSeek（兼容接口）
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: "https://api.deepseek.com",
});
```

**配置说明**：
- `apiKey`：DeepSeek API Key（格式 `sk-...`），从 `DEEPSEEK_API_KEY` 环境变量读取
- `baseURL`：必须设置为 `https://api.deepseek.com`，否则会连到 OpenAI
- 仍使用 `openai` npm 包作为 SDK（DeepSeek 接口兼容，无需换包）

---

### Prompt 管理

- Prompt 模板定义为模块顶层 **常量**，不在调用处拼接
- 常量命名：`UPPER_SNAKE_CASE`

```typescript
const SUMMARY_SYSTEM_PROMPT = "你是一个专业的文章摘要助手。请根据用户提供的文章内容生成摘要。始终使用中文回复。";

const SUMMARY_USER_PROMPT = `请对以下文章生成三种长度的中文摘要。
严格以 JSON 格式返回，包含三个字段：
- one_sentence: 一句话摘要，不超过 50 字
- short: 短摘要，100-200 字
- detailed: 详细摘要，400-600 字

文章内容：
{content}`;
```

---

### 调用配置

```typescript
export async function generateSummaries(content: string): Promise<SummaryResult> {
  const response = await client.chat.completions.create({
    model: "deepseek-chat",
    response_format: { type: "json_object" },
    temperature: 0.3,     // 摘要不需要创造性
    max_tokens: 2000,     // 详细摘要约 600 字 ≈ 800 tokens
    messages: [
      { role: "system", content: SUMMARY_SYSTEM_PROMPT },
      { role: "user", content: SUMMARY_USER_PROMPT.replace("{content}", content) },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content!);

  return {
    oneSentence: parsed.one_sentence,
    shortSummary: parsed.short,
    detailedSummary: parsed.detailed,
    model: "deepseek-chat",
    tokenCount: response.usage?.total_tokens ?? null,
  };
}
```

**配置规则**：
- `model`: `deepseek-chat`（DeepSeek-V3，原生中文优秀），如需推理能力可升级 `deepseek-reasoner`（R1）
- `response_format`: 必须为 `json_object`（DeepSeek 支持此格式）
- `temperature`: 固定 0.3（摘要任务稳定优先）
- `max_tokens`: 2000（足够覆盖详细摘要）
- 一次调用生成 3 种摘要，不串行调 3 次
- `maxRetries: 3`（SDK 内置重试，DeepSeek 高峰期偶尔 503）

---

### 返回类型

```typescript
export interface SummaryResult {
  oneSentence: string;
  shortSummary: string;
  detailedSummary: string;
  model: string;
  tokenCount: number | null;
}
```

**规则**：
- `tokenCount` 可为 null（API 响应偶尔不含 usage）
- 所有函数返回显式类型，不依赖隐式推导

---

### 错误处理

```typescript
try {
  const result = await generateSummaries(content);
  return result;
} catch (error) {
  if (error instanceof OpenAI.APIError) {
    // DeepSeek 同样触发 OpenAI SDK 的 APIError → 502
    throw new AppError("AI_SUMMARY_FAILED", error.message);
  }
  throw error; // 未知错误 → 500
}
```

---

## API 路由串联规范

### route.ts 结构模板

```typescript
import { NextRequest, NextResponse } from "next/server";
// 1. 导入依赖
import { scrapeArticle } from "@/lib/scraper";
import { generateSummaries } from "@/lib/deepseek";
import { createSummary } from "@/lib/db/queries";
import { isValidUrl } from "@/lib/utils";

// 2. 导出 HTTP 方法
export async function POST(request: NextRequest) {
  try {
    // 3. 解析请求
    const { url } = await request.json();

    // 4. 校验输入
    if (!url || !isValidUrl(url)) {
      return NextResponse.json(
        { error: "请输入有效的文章链接", code: "INVALID_URL" },
        { status: 400 }
      );
    }

    // 5. 业务逻辑（调用 lib 层函数，不内嵌逻辑）
    const scraped = await scrapeArticle(url);
    const summaries = await generateSummaries(scraped.content);
    const record = await createSummary({
      url: scraped.url,
      title: scraped.title,
      siteName: scraped.siteName,
      ...summaries,
    });

    // 6. 返回成功
    return NextResponse.json(record);
  } catch (error) {
    // 7. 错误映射（见下表）
    const mapped = mapError(error);
    return NextResponse.json(
      { error: mapped.message, code: mapped.code },
      { status: mapped.status }
    );
  }
}
```

**规则**：
- API 路由仅做：解析 → 校验 → 调用 lib → 返回
- 不在 route.ts 中内嵌业务逻辑（抓取细节、prompt 拼接）
- 每个步骤调用对应的 `lib/*` 函数

---

### 错误状态码映射

| 错误类型 | code | 状态码 | 用户可见信息 |
|----------|------|--------|-------------|
| URL 不合法 | `INVALID_URL` | 400 | 请输入有效的文章链接 |
| 抓取失败 | `SCRAPE_FAILED` | 422 | 无法获取文章内容 |
| 正文为空 | `NO_CONTENT` | 422 | 该页面未找到可读内容 |
| AI 失败 | `AI_SUMMARY_FAILED` | 502 | AI 摘要生成失败 |
| DB 写入失败 | `DB_ERROR` | 500 | 服务器内部错误 |

**规则**：
- 不在 catch 中暴露内部错误堆栈
- 错误响应必须包含 `error` + `code` 两个字段
- 500 错误日志记录完整信息（供调试），用户只看到通用提示

---

## 工具函数规范 (`utils.ts`)

- 仅放**纯函数**：无副作用、不依赖外部状态、不调用 API / DB
- 导出函数不超过 10 个
- 每个函数有显式类型签名

```typescript
/** 校验 URL 是否合法（http/https 协议） */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** 截断文本至指定长度 */
export function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

/** 格式化时间戳为中文日期 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
```

**禁止放入 utils.ts 的内容**：
- DB 查询
- API 调用
- 依赖 `process.env` 的逻辑
- 依赖 React hooks 的逻辑

---

## 类型定义规范

所有跨模块共享的类型放在 `src/types/index.ts`，不在各模块文件中重复定义。

模块内部类型（仅在模块内使用）直接定义在模块文件中，不导出。

```typescript
// src/types/index.ts — 跨模块共享
export type { Summary, NewSummary } from "@/lib/db/schema";
export type { ScrapeResult } from "@/lib/scraper";
export type { SummaryResult } from "@/lib/deepseek";
```

**规则**：
- 不使用 `any` 类型
- 不使用 `unknown` 作为最终类型（必须细化）
- API 响应类型与 DB schema 类型分开定义（API 可扩展字段）
