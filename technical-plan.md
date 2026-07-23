# AI 文章摘要工具 — 完整技术方案

## 一、需求分析

### 核心功能拆解

| 编号 | 功能 | 输入 | 输出 | 技术挑战 |
|------|------|------|------|----------|
| F1 | URL 输入 | 文章链接 | — | URL 合法性校验 |
| F2 | 文章抓取 | 合法 URL | 纯文本正文 | 反爬、编码、正文提取 |
| F3 | AI 摘要生成 | 文章正文 | 3 种长度摘要 | DeepSeek API 调用、prompt 设计、超时处理 |
| F4 | 历史记录 | — | 摘要列表 | 数据持久化、分页查询 |

### 关键技术挑战

1. **SQLite 在 Vercel 上的持久化问题** — Vercel Serverless 函数没有持久文件系统，传统 `better-sqlite3` 在每次冷启动后数据丢失。必须使用 Turso（基于 libSQL 的云端 SQLite）。
2. **文章正文提取** — 不同网站 HTML 结构差异大，需要 robust 的正文提取策略。
3. **DeepSeek API 延迟** — 3 种摘要如果串行调用，总延迟 = 3 × 单次延迟。需要考虑并行调用或单次调用生成全部。DeepSeek 高峰期可能出现排队，SDK 内置重试机制可应对。
4. **Vercel 函数超时** — 免费版 10s，Pro 版 60s。抓取 + AI 调用链路可能超时，需要合理设计。

---

## 二、技术选型与决策

### 技术栈

| 层面 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 框架 | Next.js | 15.x (App Router) | 用户指定，SSR + API Routes 一体化 |
| ORM | Drizzle ORM | 0.36+ | 类型安全、轻量、对 libSQL 支持好 |
| 数据库 | Turso (libSQL) | — | SQLite 兼容，云原生，Vercel 友好 |
| 样式 | Tailwind CSS | 4.x | 用户指定，原子化 CSS |
| AI | DeepSeek (via OpenAI SDK) | 4.x | OpenAI 兼容接口，原生中文优秀，国内直连 |
| 抓取 | cheerio + undici | — | cheerio 解析 HTML，undici 高性能 fetch |
| 部署 | Vercel | — | 用户指定，Next.js 原生支持 |

### 关键决策：SQLite on Vercel → Turso

**问题**：Vercel 是 Serverless 平台，函数实例无状态、文件系统只读（除 `/tmp` 临时目录）。传统 SQLite（`better-sqlite3`）依赖本地文件，部署后数据不持久。

**方案**：使用 [Turso](https://turso.tech/)，它是基于 libSQL（SQLite 的开源 fork）的云端数据库服务：
- 100% SQLite 兼容，SQL 语法无需改动
- Drizzle ORM 通过 `drizzle-orm/libsql` 适配器无缝对接
- 免费额度：500 个数据库，9GB 总存储，10 亿次读/月 — 足够个人项目
- 边缘节点复制，全球低延迟

**开发环境**：本地使用 Turso 提供的本地文件模式（`file:local.db`），或直接连远程 Turso 实例。

### 关键决策：摘要生成策略（DeepSeek）

**方案**：单次 API 调用，一次生成 3 种摘要。

**为什么选 DeepSeek 而非 OpenAI**：
- 原生中文模型，摘要质量更自然流畅
- 国内网络直连，延迟更低，无区域合规风险
- OpenAI 兼容接口格式，使用同一个 `openai` npm SDK，仅改 `baseURL`
- 价格：DeepSeek-V3 输入 ¥1/百万tokens，输出 ¥2/百万tokens

**方案**：单次 API 调用，一次生成 3 种摘要。

```
Prompt: "请对以下文章生成三种长度的摘要：
1. 一句话摘要（不超过 50 字）
2. 短摘要（100-200 字）
3. 详细摘要（400-600 字）
以 JSON 格式返回：{"oneSentence": "...", "short": "...", "detailed": "..."}"
```

**优势**：
- 只需 1 次 API 调用，延迟降低 66%
- Token 消耗更少（不重复发送文章正文）
- 使用 `response_format: { type: "json_object" }` 保证结构化输出

---

## 三、项目结构

```
ai-article-summarizer/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # 根布局
│   │   ├── page.tsx                    # 首页 - URL 输入 + 摘要展示
│   │   ├── globals.css                 # 全局样式 + Tailwind
│   │   ├── history/
│   │   │   └── page.tsx                # 历史记录页
│   │   └── api/
│   │       └── summarize/
│   │           └── route.ts            # POST /api/summarize
│   ├── components/
│   │   ├── UrlInputForm.tsx            # URL 输入表单（Client Component）
│   │   ├── SummaryResult.tsx           # 摘要结果展示
│   │   ├── SummaryCard.tsx             # 单个摘要卡片
│   │   ├── HistoryList.tsx            # 历史记录列表
│   │   ├── HistoryItem.tsx            # 单条历史记录
│   │   ├── LoadingState.tsx           # 加载骨架屏
│   │   └── ErrorBoundary.tsx          # 错误边界
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts               # Drizzle 客户端实例
│   │   │   ├── schema.ts              # 数据库表定义
│   │   │   └── queries.ts             # 数据库查询函数
│   │   ├── scraper.ts                  # 文章抓取与正文提取
│   │   ├── deepseek.ts                  # DeepSeek 客户端 + 摘要生成
│   │   └── utils.ts                    # 工具函数（URL 校验等）
│   └── types/
│       └── index.ts                    # 共享类型定义
├── drizzle/                            # 数据库迁移文件（自动生成）
│   └── 0000_initial.sql
├── drizzle.config.ts                   # Drizzle Kit 配置
├── next.config.ts                      # Next.js 配置
├── tailwind.config.ts                  # Tailwind 配置
├── tsconfig.json
├── package.json
├── .env.local                          # 环境变量（本地）
└── .env.example                        # 环境变量模板
```

### 结构设计原则

- **`src/app/`** — Next.js App Router 约定目录，包含页面和 API 路由
- **`src/components/`** — 可复用 UI 组件，Client/Server Component 通过 `"use client"` 区分
- **`src/lib/`** — 业务逻辑层，数据库、抓取、AI 调用各自独立模块
- **`src/types/`** — 跨模块共享的 TypeScript 类型
- **`drizzle/`** — Drizzle Kit 自动生成的 SQL 迁移文件

---

## 四、数据库设计

### Schema 定义 (`src/lib/db/schema.ts`)

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const summaries = sqliteTable("summaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // 原始文章信息
  url: text("url").notNull(),
  title: text("title").notNull(),
  siteName: text("site_name"),

  // 三种摘要
  oneSentence: text("one_sentence").notNull(),
  shortSummary: text("short_summary").notNull(),
  detailedSummary: text("detailed_summary").notNull(),

  // AI 调用元数据
  model: text("model").notNull(),           // 如 "deepseek-chat"
  tokenCount: integer("token_count"),        // 总 token 消耗

  // 时间戳
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 导出类型
export type Summary = typeof summaries.$inferSelect;
export type NewSummary = typeof summaries.$inferInsert;
```

### Drizzle 客户端 (`src/lib/db/index.ts`)

```typescript
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
```

### Drizzle 配置 (`drizzle.config.ts`)

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
```

---

## 五、API 设计

### 路由规划

| 方法 | 路径 | 功能 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/api/summarize` | 抓取并生成摘要 | `{ url: string }` | `Summary` 对象 |
| GET | `/api/summaries` | 获取历史列表 | `?page=1&limit=10` | `{ data: Summary[], total: number }` |
| GET | `/api/summaries/:id` | 获取单条详情 | — | `Summary` 对象 |
| DELETE | `/api/summaries/:id` | 删除一条记录 | — | `{ success: boolean }` |

### POST /api/summarize 核心流程

```
1. 接收 { url } → 校验 URL 合法性
2. 抓取文章：
   - fetch(url) 获取 HTML
   - cheerio 解析，提取 <title>、<article> 或 <main> 正文
   - 清洗：去广告、导航、脚本标签
   - 截断：超过 12000 字符只取前 12000（控制 token）
3. 调用 DeepSeek：
   - model: deepseek-chat（DeepSeek-V3，原生中文优秀）
   - baseURL: https://api.deepseek.com
   - response_format: json_object
   - 一次生成 3 种摘要
4. 存入数据库（Drizzle insert）
5. 返回完整 Summary 对象
```

### 错误处理策略

| 场景 | HTTP 状态码 | 错误信息 |
|------|-------------|----------|
| URL 不合法 | 400 | `Invalid URL format` |
| 抓取失败（403/超时） | 422 | `Failed to fetch article content` |
| 文章正文为空 | 422 | `No readable content found` |
| DeepSeek API 错误 | 502 | `AI summarization failed` |
| 数据库写入失败 | 500 | `Internal server error` |

---

## 六、核心模块实现要点

### 6.1 文章抓取 (`src/lib/scraper.ts`)

```typescript
import * as cheerio from "cheerio";

export async function scrapeArticle(url: string) {
  // 1. fetch HTML（设置 User-Agent 绕过基础反爬）
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ArticleSummarizer/1.0)",
    },
    signal: AbortSignal.timeout(10000), // 10s 超时
  });

  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  // 2. 提取标题
  const title = $("title").text().trim() ||
                $("h1").first().text().trim() ||
                "Untitled";

  // 3. 提取正文 — 优先级：article > main > body
  const articleEl = $("article").first() ||
                    $("main").first() ||
                    $("body");

  // 4. 清洗：移除非内容标签
  articleEl.find("script, style, nav, footer, header, aside, iframe, .ad, .advertisement").remove();

  // 5. 提取纯文本
  const content = articleEl.text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000); // 截断，控制 token

  if (content.length < 100) {
    throw new Error("No readable content found");
  }

  // 6. 提取站点名
  const siteName = $('meta[property="og:site_name"]').attr("content") ||
                   new URL(url).hostname;

  return { title, content, siteName };
}
```

### 6.2 DeepSeek 摘要生成 (`src/lib/deepseek.ts`)

```typescript
import OpenAI from "openai";

// 使用 OpenAI SDK 连接 DeepSeek（兼容接口）
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: "https://api.deepseek.com",
});

const SUMMARY_PROMPT = `请对以下文章生成三种长度的中文摘要。
严格以 JSON 格式返回，包含三个字段：
- one_sentence: 一句话摘要，不超过 50 字
- short: 短摘要，100-200 字
- detailed: 详细摘要，400-600 字

文章内容：
{content}`;

export async function generateSummaries(content: string) {
  const response = await client.chat.completions.create({
    model: "deepseek-chat",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "你是一个专业的文章摘要助手。请根据用户提供的文章内容生成摘要。始终使用中文回复。",
      },
      {
        role: "user",
        content: SUMMARY_PROMPT.replace("{content}", content),
      },
    ],
    temperature: 0.3, // 低温度保证摘要稳定
  }, {
    maxRetries: 3, // DeepSeek 高峰期偶尔 503，SDK 内置重试
  });

  const result = JSON.parse(response.choices[0].message.content!);

  return {
    oneSentence: result.one_sentence,
    shortSummary: result.short,
    detailedSummary: result.detailed,
    model: "deepseek-chat",
    tokenCount: response.usage?.total_tokens,
  };
}
```

### 6.3 API 路由 (`src/app/api/summarize/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { scrapeArticle } from "@/lib/scraper";
import { generateSummaries } from "@/lib/deepseek";
import { db } from "@/lib/db";
import { summaries } from "@/lib/db/schema";
import { isValidUrl } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    // 1. 校验 URL
    if (!url || !isValidUrl(url)) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // 2. 抓取文章
    const { title, content, siteName } = await scrapeArticle(url);

    // 3. 生成摘要
    const summaryResult = await generateSummaries(content);

    // 4. 存入数据库
    const [record] = await db.insert(summaries).values({
      url,
      title,
      siteName,
      ...summaryResult,
    }).returning();

    // 5. 返回结果
    return NextResponse.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Fetch failed") || message.includes("No readable")) {
      return NextResponse.json({ error: message }, { status: 422 });
    }
    if (message.includes("AI")) {
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## 七、环境变量

### `.env.local`（本地开发）

```bash
# Turso 数据库
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# DeepSeek
DEEPSEEK_API_KEY=sk-...

# 应用
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### `.env.example`（提交到 Git 的模板）

```bash
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
DEEPSEEK_API_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## 八、部署方案

### Vercel 部署步骤

```
1. GitHub 仓库 → Vercel Import Project
2. 配置环境变量（Vercel Dashboard → Settings → Environment Variables）：
   - TURSO_DATABASE_URL
   - TURSO_AUTH_TOKEN
   - DEEPSEEK_API_KEY
3. Build Command: npm run build（Next.js 自动识别）
4. Output: .next（自动处理）
5. Deploy → 获得 https://your-app.vercel.app
```

### Turso 数据库初始化

```bash
# 安装 Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 登录并创建数据库
turso auth login
turso db create article-summarizer

# 获取连接信息
turso db show article-summarizer --url     # → TURSO_DATABASE_URL
turso db tokens create article-summarizer  # → TURSO_AUTH_TOKEN

# 运行数据库迁移
npx drizzle-kit push
```

### Vercel 函数超时配置

在 `next.config.ts` 中配置：

```typescript
export default {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Pro 版可设置最大 60s
  maxDuration: 60,
};
```

---

## 九、依赖清单

### `package.json` 核心依赖

```json
{
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "openai": "^4.77.0",  // SDK 包不变，DeepSeek 兼容此接口
    "drizzle-orm": "^0.36.4",
    "@libsql/client": "^0.14.0",
    "cheerio": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "drizzle-kit": "^0.30.0"
  }
}
```

---

## 十、实施计划

### 阶段一：项目初始化（搭建骨架）

- [ ] `npx create-next-app@latest` 初始化项目（TypeScript + Tailwind + App Router）
- [ ] 安装依赖：drizzle-orm、@libsql/client、openai（兼容 DeepSeek）、cheerio
- [ ] 配置 Turso 数据库，获取连接信息
- [ ] 编写 Drizzle schema，执行 `drizzle-kit push` 建表
- [ ] 配置环境变量 `.env.local`

### 阶段二：核心功能实现

- [ ] 实现 `scraper.ts` — 文章抓取与正文提取
- [ ] 实现 `deepseek.ts` — DeepSeek 摘要生成
- [ ] 实现 `POST /api/summarize` — 串联完整链路
- [ ] 实现 `GET /api/summaries` — 历史列表查询
- [ ] 实现 `GET /api/summaries/:id` — 单条详情

### 阶段三：前端页面

- [ ] 首页：URL 输入表单 + 摘要结果展示（3 张卡片）
- [ ] 加载状态：骨架屏 / 进度提示
- [ ] 错误状态：友好错误提示
- [ ] 历史页：记录列表 + 点击查看详情
- [ ] 响应式布局（移动端适配）

### 阶段四：打磨与部署

- [ ] 错误边界与异常处理
- [ ] URL 输入防抖 + 重复提交防护
- [ ] Vercel 部署 + 环境变量配置
- [ ] 端到端测试验证
