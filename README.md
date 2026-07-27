# AI 文章摘要工具

粘贴任意文章链接，一键生成三种长度的中文 AI 摘要。

## 功能截图

> 待补充：首页输入框、摘要结果展示（三 tab 切换）、历史记录列表的截图。

## 功能特性

- **智能抓取** — cheerio 静态解析 + 真实浏览器 UA，覆盖大部分 SSR 文章站（微信公众号、博客园、阮一峰博客、少数派等）
- **三种摘要** — 一句话概括 / 200 字短摘要 / 500 字详细摘要，Tab 一键切换
- **历史记录** — 所有摘要自动保存，支持浏览、搜索、分页
- **多模型兼容** — 默认 DeepSeek，任何 OpenAI 兼容 API 均可接入
- **Mock 测试模式** — 无需 API key 也能验证完整流程

## 技术栈

| 层面   | 技术                             |
| ------ | -------------------------------- |
| 框架   | Next.js 15.5（App Router）       |
| 样式   | Tailwind CSS 4                   |
| 数据库 | SQLite 本地（dev）/ Turso 云端（prod） |
| ORM    | Drizzle ORM                      |
| AI     | DeepSeek（OpenAI SDK 兼容）       |
| 抓取   | cheerio + undici                 |
| 测试   | Vitest                           |
| 部署   | Vercel                           |

## 安装与运行

### 前置要求

- Node.js >= 18
- npm（或 pnpm / yarn）

### 克隆并安装

```bash
git clone https://github.com/HuangYongLe/article_abstract.git
cd article_abstract
npm install
```

### 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```bash
# 数据库 — 本地开发用 file:dev.db，无需 Turso 账号
DATABASE_URL=file:dev.db

# AI 模型 — DeepSeek 示例，也可换其他 OpenAI 兼容 API
OPENAI_API_KEY=sk-your-deepseek-api-key
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat

# Mock 模式 — 设为 true 可跳过 AI 调用直接返回模拟数据
MOCK_AI=false
```

### 初始化数据库

```bash
npm run db:migrate
```

### 启动开发服务器

```bash
npm run dev
```

浏览器打开 `http://localhost:3000`，粘贴文章链接即可使用。

### 运行测试

```bash
npm test
# 或监听模式：
npm run test:watch
```

## 环境变量

| 变量                     | 必填 | 说明                                                          |
| ------------------------ | ---- | ------------------------------------------------------------- |
| `DATABASE_URL`           | 是   | 本地：`file:dev.db`；生产：Turso 连接串 `libsql://...`       |
| `DATABASE_AUTH_TOKEN`    | 否   | 本地开发留空，连接 Turso 云端时需要                             |
| `OPENAI_API_KEY`         | 是   | AI API 密钥（DeepSeek / OpenAI / 其他兼容服务）                |
| `OPENAI_BASE_URL`        | 否   | 默认 `https://api.openai.com/v1`，DeepSeek 填 `https://api.deepseek.com/v1` |
| `OPENAI_MODEL`           | 否   | 默认 `gpt-4o`，DeepSeek 填 `deepseek-chat`                    |
| `MOCK_AI`                | 否   | 设为 `true` 时跳过真实 AI 调用，返回模拟数据，用于本地开发调试  |

## 部署到 Vercel

### 1. 创建 Turso 数据库

注册 [Turso](https://turso.tech/)（免费额度足够个人使用），创建数据库并获取连接信息：

```bash
# 安装 Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 注册 / 登录
turso auth login

# 创建数据库
turso db create article-summarizer

# 获取连接 URL
turso db show article-summarizer

# 生成 auth token
turso db tokens create article-summarizer
```

### 2. 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/HuangYongLe/article_abstract)

或手动步骤：

1. 将项目推送到 GitHub
2. 在 [Vercel](https://vercel.com/) 中 Import 该仓库
3. 在项目 Settings → Environment Variables 中添加：

```bash
DATABASE_URL=libsql://article-summarizer-xxx.turso.io
DATABASE_AUTH_TOKEN=eyJ...你的Token
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

4. Framework 选择 **Next.js**，点击 Deploy

### 3. 执行数据库迁移（首次部署）

部署完成后，在 Vercel 项目 Dashboard 中通过 Terminal 运行：

```bash
npm run db:migrate
```

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── summarize/route.ts   # POST 摘要生成
│   │   └── history/
│   │       ├── route.ts          # GET 历史列表
│   │       └── [id]/route.ts     # GET/DELETE 单条记录
│   ├── history/page.tsx          # 历史记录页
│   ├── layout.tsx
│   └── page.tsx                  # 首页
├── components/
│   ├── SummaryResult.tsx         # 摘要结果展示（三 tab）
│   ├── SummaryCard.tsx           # 历史记录卡片
│   └── UrlInputForm.tsx          # URL 输入表单
├── lib/
│   ├── openai.ts                 # AI 摘要生成
│   ├── scraper.ts                # 文章抓取与正文提取
│   ├── utils.ts                  # 工具函数
│   └── db/
│       ├── index.ts              # 数   库连接
│       ├── schema.ts             # Drizzle schema
│       └── queries.ts            # CRUD 操作
└── tests/
    └── db.test.ts                # 数据库单元测试
```

## 已知限制

- **JS 客户端渲染站点**（如 MSN、36kr、掘金） — cheerio 无法执行 JavaScript，需引入 Playwright 无头浏览器才能支持
- **Vercel 免费版函数超时 10s** — 超大文章（>50k 字）的 AI 调用可能超时，建议升级 Pro 版或使用 Vercel 的 `maxDuration` 配置

## License

MIT
