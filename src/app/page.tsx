export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">
        AI 文章摘要工具
      </h1>
      <p className="mt-2 text-gray-600">
        输入文章链接，一键生成三种长度的中文摘要。
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            项目骨架已就绪
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Next.js 15 + Tailwind CSS 4 + Drizzle ORM + Turso (libSQL)
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            待实现功能
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li>- URL 输入与校验</li>
            <li>- 文章抓取与正文提取</li>
            <li>- DeepSeek AI 摘要生成</li>
            <li>- 历史记录管理</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
