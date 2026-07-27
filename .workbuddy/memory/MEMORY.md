# 项目记忆 — AI Article Summarizer

## 技术栈
- Next.js 15.5 (App Router + Turbopack)
- Drizzle ORM + Turso libsql（本地 file: 协议 / 云端 Turso）
- Tailwind CSS 4
- OpenAI SDK (兼容 DeepSeek 等)

## 关键约定
- 数据库：本地开发用 `file:dev.db`（Turso libsql 驱动），部署用 Turso 云端，通过 `DATABASE_URL` + `DATABASE_AUTH_TOKEN` 区分
- AI 模型：默认 gpt-4o，但可通过 `OPENAI_BASE_URL` + `OPENAI_MODEL` 切换
- 开发测试：`MOCK_AI=true` 可跳过真实 AI 调用
- 摘要格式：3 种长度 — 一句话、短摘要(100-200字)、详细摘要(300-500字)
- 抓取：cheerio + undici fetch，含微信公众号懒加载图片修复

## 迁移记录（2026-07-27）
- 数据库统一为 Turso libsql（`@libsql/client` + `drizzle-orm/libsql`）
- 移除了旧的 better-sqlite3 实现（`src/lib/db.ts`）和 `data/app.db`
- 重新生成迁移：`drizzle/0000_greedy_aaron_stack.sql`，10 列完整匹配 schema
- 迁移脚本 `scripts/migrate.ts` 已添加内置 .env 加载，无需手动设置环境变量
- 本地数据库文件名改为 `dev.db`（.gitignore 已同步）

## E2E 测试（2026-07-24）
- 完整流程通过（Mock AI 模式）
- 详情见 `.workbuddy/memory/2026-07-24.md`
