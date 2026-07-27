import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "历史记录",
  description: "查看和管理 AI 生成的文章摘要历史记录，支持搜索标题、站点和内容。",
  openGraph: {
    title: "历史记录 | AI 文章摘要工具",
    description: "查看 AI 生成的文章摘要历史记录。",
    url: "/history",
  },
  twitter: {
    title: "历史记录 | AI 文章摘要工具",
    description: "查看 AI 生成的文章摘要历史记录。",
  },
  alternates: {
    canonical: "/history",
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
