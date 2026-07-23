# AI 文章摘要工具 — 项目全局规范

## 技术栈

| 层面 | 技术 | 版本约束 | 选型理由 |
|------|------|----------|----------|
| 框架 | Next.js | 15.x App Router | SSR + API Routes 一体 |
| 语言 | TypeScript | strict mode | 类型安全 |
| 数据库 | Turso (libSQL) | 云端 SQLite | Vercel 无持久文件系统 |
| ORM | Drizzle ORM | 0.36+ | 轻量、libSQL 适配 |
| AI | DeepSeek (via OpenAI SDK) | 4.x | OpenAI 兼容接口，原生中文优秀，国内直连 |
| 样式 | Tailwind CSS | 4.x | 原子化，无自定义 CSS |
| 抓取 | cheerio | 1.x | SSR 页面正文提取 |
| 兜底抓取 | Browserless.io | API 模式 | JS 渲染页面兜底 |
| 部署 | Vercel | Serverless | Next.js 原生支持 |

---

## TypeScript 规则

```jsonc
// tsconfig.json 核心配置
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- **禁止 `any` 类型** — 用 `unknown` 替代或给出具体类型
- 函数返回值必须显式声明类型，不依赖隐式推导
- 优先 `interface` 定义对象结构，仅在联合类型/交叉类型时用 `type`
- 导入顺序（用空行分隔组）：
  1. React / Next.js 内置
  2. 第三方库（openai（兼容 DeepSeek）, drizzle-orm 等）
  3. 内部模块（@/lib/*, @/components/*）
  4. 类型导入（`import type { ... }`）

---

## 命名规范

### 文件命名

| 类型 | 格式 | 示例 |
|------|------|------|
| 页面 | `page.tsx` | `src/app/page.tsx` |
| 布局 | `layout.tsx` | `src/app/layout.tsx` |
| 加载 | `loading.tsx` | `src/app/loading.tsx` |
| 错误 | `error.tsx` | `src/app/error.tsx` |
| API 路由 | `route.ts` | `src/app/api/summarize/route.ts` |
| React 组件 | PascalCase.tsx | `UrlInputForm.tsx` |
| 工具/服务 | camelCase.ts | `scraper.ts`, `deepseek.ts` |
| 类型定义 | `index.ts` | `src/types/index.ts` |
| DB schema | `schema.ts` | `src/lib/db/schema.ts` |
| DB 查询 | `queries.ts` | `src/lib/db/queries.ts` |
| DB 客户端 | `index.ts` | `src/lib/db/index.ts` |
| 配置文件 | camelCase.config.ts | `drizzle.config.ts` |
| 环境变量 | `.env.local` / `.env.example` | — |

### 代码命名

| 类别 | 风格 | 示例 |
|------|------|------|
| 变量 / 函数 | camelCase | `scrapeArticle`, `oneSentence` |
| 类型 / 接口 | PascalCase | `Summary`, `ScrapeResult` |
| 常量 | UPPER_SNAKE_CASE | `MAX_CONTENT_LENGTH`, `SUMMARY_PROMPT` |
| React 组件 | PascalCase | `<UrlInputForm />` |
| CSS 类 | Tailwind 原子类 | `className="rounded-lg p-4"` |
| DB 表名 | 小写蛇形 | `summaries` |
| DB 列名 | 小写蛇形 | `one_sentence`, `created_at` |

### 环境变量命名

| 前缀 | 可见性 | 示例 |
|------|--------|------|
| `NEXT_PUBLIC_` | 客户端可见 | `NEXT_PUBLIC_APP_URL` |
| 无前缀 | 仅服务端 | `TURSO_DATABASE_URL`, `DEEPSEEK_API_KEY` |

**硬性规则**：API Key、数据库凭证等敏感信息绝不加 `NEXT_PUBLIC_` 前缀。

---

### 目录命名

- 全部小写，单词间用 `-` 连接 — `api/`, `history/`
- 每个 App Router 路由对应一个目录 — `src/app/history/page.tsx`
- 模块相关文件放同一目录 — `src/lib/db/` 包含 schema + queries + client
- 不创建超过 3 层的嵌套目录

---

## Git 规范

### 分支命名

```
feat/<描述>    新功能
fix/<描述>     修复 bug
refactor/<描述> 重构
```

### Commit 格式

```
type(scope): 简短描述

type: feat | fix | refactor | style | docs | test | chore
scope: api | scraper | deepseek | db | ui | config
```

示例：
```
feat(api): add history delete endpoint
fix(scraper): handle WeChat data-src images
refactor(db): extract queries into dedicated module
```

---

## 依赖管理

- 使用项目 `package.json` 管理依赖，`npm install` 安装
- 新增依赖前需评估：包体积、维护状态、Vercel 兼容性
- 禁止 `npm install -g`（全局安装）
- `devDependencies` 仅限开发工具：drizzle-kit, types, tailwindcss
- 不引入未使用的依赖，定期 `npm prune`

### 核心依赖版本锁定原则

- Next.js / React：跟随项目初始化版本，不随意升级
- OpenAI SDK（兼容 DeepSeek）：跟随最新稳定版
- Drizzle ORM：跟随最新稳定版，schema API 可能跨版本变化

---

## 文件大小限制

- 单文件不超过 **200 行**
- 超过 200 行必须拆分：
  - 组件拆分为子组件
  - 服务拆分为独立模块
  - 查询拆分为 `queries.ts`

---

## 禁止事项

- 不使用 `var`，只用 `const` / `let`
- 不在组件文件中定义 DB schema
- 不在 API 路由中直接写 `db.select()`（走 `queries.ts`）
- 不硬编码环境变量值
- 不在客户端代码中引用服务端-only 环境变量
- 不引入全局状态管理库（Zustand/Redux）
- 不自定义 CSS class（只用 Tailwind 原子类）
