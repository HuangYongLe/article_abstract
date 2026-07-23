# AI 文章摘要工具

输入文章链接，一键生成三种长度的中文摘要。

## 技术栈

- **Next.js 15** (App Router + Turbopack)
- **TypeScript** (strict mode)
- **Tailwind CSS 4**
- **Drizzle ORM** + **Turso** (libSQL)
- **DeepSeek** (via OpenAI SDK)

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 Turso / DeepSeek 凭证

# 同步数据库 schema
npm run db:push

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
src/
├── app/              # Next.js App Router
│   ├── page.tsx      # 首页
│   ├── history/      # 历史记录页
│   └── api/          # API 路由
├── components/        # 可复用 UI 组件
├── lib/              # 业务逻辑层
│   ├── db/           # Drizzle 客户端 + Schema + 查询
│   ├── scraper.ts    # 文章抓取
│   ├── deepseek.ts   # AI 摘要生成
│   └── utils.ts      # 工具函数
└── types/            # 共享类型
```
