# 项目记忆 — AI Article Summarizer

## 技术栈
- Next.js 15.5 (App Router + Turbopack)
- Drizzle ORM + better-sqlite3 (本地) / Turso libsql (云端)
- Tailwind CSS 4
- OpenAI SDK (兼容 DeepSeek 等)

## 关键约定
- 数据库：本地开发用 `file:local.db`（Turso 驱动），部署用 Turso 云端
- AI 模型：默认 gpt-4o，但可通过 `OPENAI_BASE_URL` + `OPENAI_MODEL` 切换
- 开发测试：`MOCK_AI=true` 可跳过真实 AI 调用
- 摘要格式：3 种长度 — 一句话、短摘要(100-200字)、详细摘要(300-500字)
- 抓取：cheerio + undici fetch，含微信公众号懒加载图片修复

## 已知架构问题
- 存在两套 DB 实现（`src/lib/db/index.ts` 和 `src/lib/db.ts`），schema 不一致
- 实际 API 路由使用 `db/index.ts`（Turso），但迁移脚本和 db.ts 使用 better-sqlite3

## E2E 测试（2026-07-24）
- 完整流程通过（Mock AI 模式）
- 详情见 `.workbuddy/memory/2026-07-24.md`
