import type { Summary } from "@/lib/db/schema";

/** Mock 摘要数据 — 用于前端开发，不依赖数据库 */
const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const mockSummaries: Summary[] = [
  {
    id: 6,
    url: "https://sspai.com/post/85000",
    title: "2024 年最好用的效率工具盘点",
    siteName: "少数派",
    oneSentence: "本文盘点了 2024 年在任务管理、笔记、日历等领域表现突出的效率应用。",
    shortSummary:
      "文章从任务管理、笔记知识库、日历时间块、自动化工具四个维度，评选出 2024 年最值得使用的 12 款效率工具，并分别介绍了各自的核心优势和适用场景。作者强调工具选择应匹配个人工作流，而非盲目追新。",
    detailedSummary:
      "本文是一篇 2024 年度效率工具盘点，覆盖四大品类：\n\n1. 任务管理：Todoist 以跨平台同步和自然语言输入胜出；Things 4 凭借极简设计适合 Apple 生态用户；TickTick 的日历视图和时间追踪功能适合时间块管理者。\n\n2. 笔记知识库：Obsidian 以本地文件和插件生态成为首选；Notion 适合团队协作场景；Apple Notes 在轻量场景下依然够用。\n\n3. 日历与时间管理：Fantastical 的自然语言解析体验最佳；Google Calendar 仍是跨平台协作的标准。\n\n4. 自动化工具：Raycast 替代 Spotlight 成为 Mac 效率启动器首选；Shortcuts 在 iOS 自动化领域持续进化。\n\n作者总结：工具是手段而非目的，建议读者根据自身工作流挑选 2-3 款深度使用，避免工具疲劳。",
    model: "deepseek-chat",
    tokenCount: 1820,
    createdAt: new Date(now - 2 * 60 * 60 * 1000),
  },
  {
    id: 5,
    url: "https://www.ruanyifeng.com/blog/2024/12/weekly-issue-320.html",
    title: "科技爱好者周刊（第 320 期）：AI 编程的现状与未来",
    siteName: "阮一峰的网络日志",
    oneSentence: "本期周刊讨论了 AI 编程工具的发展现状、Cursor 的崛起以及对传统 IDE 的冲击。",
    shortSummary:
      "阮一峰在本期周刊中分享了多篇关于 AI 编程的文章，涵盖 Cursor 编辑器的使用体验、GitHub Copilot 的商业模式变化、以及 AI 辅助编程对软件工程岗位的潜在影响。同时包含多个开源项目推荐和技术趣闻。",
    detailedSummary:
      "本期科技周刊围绕 AI 编程主题展开，主要内容包括：\n\n1. Cursor 编辑器深度评测：作为 VS Code 的 AI 增强分支，Cursor 的代码补全和对话式重构功能显著提升了开发效率，但隐私和成本是主要顾虑。\n\n2. GitHub Copilot 商业化进展：订阅用户突破百万，企业版增加了代码安全审计功能。\n\n3. AI 对软件工程师岗位的影响：初级开发者的重复性工作正在被 AI 替代，但系统设计和架构能力变得更加重要。\n\n4. 开源项目推荐：包括一个轻量级向量数据库、一个终端 AI 助手、以及一个 Markdown 转 PPT 的工具。\n\n5. 趣闻：一个用 AI 生成的假新闻网站被关闭；一种新型的 WebAssembly 运行时发布。",
    model: "deepseek-chat",
    tokenCount: 2150,
    createdAt: new Date(now - day),
  },
  {
    id: 4,
    url: "https://overreacted.io/keeping-your-ui-in-sync/",
    title: "Keeping Your UI in Sync with Server State",
    siteName: "overreacted.io",
    oneSentence: "Dan Abramov 讨论了 React 应用中客户端 UI 与服务端状态同步的常见问题和策略。",
    shortSummary:
      "文章分析了 React 应用中 UI 状态与服务端数据不同步的根本原因，提出了使用乐观更新、轮询、WebSocket 三种策略的组合方案，并指出了各自在复杂场景下的权衡取舍。",
    detailedSummary:
      "Dan Abramov 在本文中深入探讨了 React 应用中 UI 与服务端状态同步的问题：\n\n1. 问题本质：传统 HTTP 请求是「拉取」模式，服务端数据变更后客户端无法感知，导致 UI 显示过期数据。\n\n2. 策略一 — 乐观更新：在发送请求前先更新 UI，失败后回滚。适合低冲突场景，但在多人协作中可能产生竞态。\n\n3. 策略二 — 轮询：定期重新获取数据，实现简单但浪费带宽，且刷新间隔内仍有数据滞后窗口。\n\n4. 策略三 — WebSocket / SSE：服务端推送变更，实时性最佳，但增加了连接管理和重连逻辑的复杂度。\n\n5. 推荐方案：对关键数据用 WebSocket 实时同步，对次要数据用轮询兜底，写操作一律乐观更新并配合错误回滚。\n\n6. React 19 的 use() hook 和 Server Components 正在从框架层面简化这一问题。",
    model: "deepseek-chat",
    tokenCount: 1680,
    createdAt: new Date(now - 2 * day),
  },
  {
    id: 3,
    url: "https://www.zhihu.com/question/660012345",
    title: "如何评价 TypeScript 5.4 的新特性？",
    siteName: "知乎",
    oneSentence: "社区讨论了 TypeScript 5.4 中 NoInfer 工具类型和 Object.groupBy 等新特性的实用性。",
    shortSummary:
      "知乎用户从多个角度评价了 TypeScript 5.4 的更新：NoInfer 类型解决了泛型推断过宽的问题，Object.groupBy / Map.groupBy 带来了原生分组支持，以及对 const 类型参数的改进。整体认为是一次实用的渐进式更新。",
    detailedSummary:
      "知乎社区对 TypeScript 5.4 新特性的讨论汇总：\n\n1. NoInfer<T> 工具类型：最受关注的新特性。此前在泛型函数中，TS 会从所有参数推断类型，导致默认值「污染」推断结果。NoInfer 让开发者可以指定某些参数不参与推断，解决了 setState 回调等场景的类型问题。\n\n2. Object.groupBy / Map.groupBy：TC39 提案进入 Stage 3，TS 5.4 提供了类型声明。社区评价「终于不用自己写 reduce 了」，但也有人指出返回类型是 Partial<Record> 可能不够精确。\n\n3. const 类型参数：在泛型参数前加 const 修饰符，使推断结果自动收窄为字面量类型，减少了对 as const 的需求。\n\n4. 改进的 narrowing：在闭包中对联合类型的 narrowing 更加精确，减少了此前需要类型断言的场景。\n\n5. 社区评价：多数开发者认为这是一次务实的更新，没有破坏性变更，新特性都是解决实际痛点的。",
    model: "deepseek-chat",
    tokenCount: 1450,
    createdAt: new Date(now - 3 * day),
  },
  {
    id: 2,
    url: "https://vercel.com/blog/nextjs-15",
    title: "Next.js 15 正式发布：Turbopack 稳定、React 19 支持",
    siteName: "Vercel",
    oneSentence: "Next.js 15 正式版带来 Turbopack 稳定、React 19 支持、缓存策略调整等重要更新。",
    shortSummary:
      "Next.js 15 的核心更新包括：Turbopack 开发模式稳定可用、全面支持 React 19、默认改为按需缓存（fetch 不再默认 cache）、新增 after() API 处理响应后任务、以及改进的错误覆盖层。文章同时介绍了部署和迁移指南。",
    detailedSummary:
      "Next.js 15 正式版的完整更新摘要：\n\n1. Turbopack：开发模式（next dev）正式稳定，构建速度比 Webpack 快 4-5 倍。生产构建（next build）仍为 beta。\n\n2. React 19 支持：App Router 全面适配 React 19 的 use() hook、Server Actions 稳定、ref 作为 prop 传递。\n\n3. 缓存策略变更：fetch 请求不再默认缓存，GET fetch 行为对齐浏览器语义。页面级缓存需显式声明 revalidate。\n\n4. 新 API — after()：允许在响应发送后执行后台任务（如日志、分析），不阻塞用户响应。\n\n5. 改进的错误处理：错误覆盖层更清晰，支持点击跳转到源码。新增 onRequestError 钩子用于服务端错误上报。\n\n6. 部署：Vercel 原生支持，自托管需 Node.js 18.18+。提供了详细的迁移指南和 codemod 工具。\n\n7. 其他：部分组件库可能需要等待 React 19 适配，建议先在非生产环境测试。",
    model: "deepseek-chat",
    tokenCount: 2300,
    createdAt: new Date(now - 5 * day),
  },
  {
    id: 1,
    url: "https://tailwindcss.com/blog/tailwindcss-v4",
    title: "Tailwind CSS v4.0 — 全新引擎、零配置启动",
    siteName: "Tailwind CSS",
    oneSentence: "Tailwind CSS v4 带来全新氧化引擎、CSS 优先配置和显著提升的构建速度。",
    shortSummary:
      "Tailwind CSS v4 是一次重大重写：全新的 Rust 引擎将构建速度提升 10 倍，CSS 优先的配置方式取代了 tailwind.config.js，自动内容检测无需配置 purge 路径，并新增了容器查询、3D 变换等原生工具类。",
    detailedSummary:
      "Tailwind CSS v4.0 的完整更新概览：\n\n1. 全新引擎（Oxide）：用 Rust 重写的核心引擎，全量构建速度提升约 10 倍，增量构建几乎瞬时。内存占用降低 50%。\n\n2. CSS 优先配置：不再需要 tailwind.config.js，所有自定义通过 CSS 中的 @theme 指令完成。仍支持 JS 配置作为兼容方案。\n\n3. 自动内容检测：默认扫描项目中的所有源文件，无需手动配置 content 数组。通过 .gitignore 自动排除无关文件。\n\n4. 新工具类：\n   - 容器查询：@container 和 cq-* 变体\n   - 3D 变换：rotate-x、rotate-y、perspective 等\n   - 颜色混合：color-mix() 支持\n   - 子网格：subgrid 布局支持\n\n5. 零配置启动：npx tailwindcss init 不再需要，只需在 CSS 中 @import \"tailwindcss\" 即可。\n\n6. 迁移：官方提供 upgrade 工具自动迁移大部分变更，但部分插件 API 有破坏性改动。\n\n7. 框架集成：Next.js、Vite、Astro 等均有官方插件适配 v4。",
    model: "deepseek-chat",
    tokenCount: 1950,
    createdAt: new Date(now - 7 * day),
  },
];

/** 生成单条 mock 摘要响应 */
export function createMockSummary(url: string): Summary {
  return {
    id: Math.floor(Math.random() * 10000) + 100,
    url,
    title: "示例文章：AI 如何改变前端开发",
    siteName: new URL(url).hostname,
    oneSentence: "本文探讨了 AI 工具在前端开发流程中的应用现状和未来趋势。",
    shortSummary:
      "文章从代码生成、设计稿转代码、自动化测试三个维度，分析了 AI 工具如何重塑前端开发工作流。作者认为 AI 不会取代前端工程师，但会大幅提升效率并改变技能要求。",
    detailedSummary:
      "本文深入分析了 AI 对前端开发的影响：\n\n1. 代码生成：GitHub Copilot、Cursor 等工具已能完成 40-60% 的样板代码编写，开发者更多扮演审阅者角色。\n\n2. 设计稿转代码：Figma AI 和 v0.dev 等工具可以直接从设计稿生成可用的 React 组件，缩短了设计到开发的链路。\n\n3. 自动化测试：AI 可以根据组件代码自动生成测试用例，覆盖边界场景。\n\n4. 技能变化：CSS 手写能力要求降低，但系统设计、Prompt 编写和代码审查能力变得更加重要。\n\n5. 未来展望：AI 原生的开发工具链正在形成，前端工程师需要适应从「写代码」到「引导 AI 写代码」的范式转变。",
    model: "deepseek-chat",
    tokenCount: 1520,
    createdAt: new Date(),
  };
}
