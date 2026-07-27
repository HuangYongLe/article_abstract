import type { Metadata } from "next";

import { Navbar } from "@/components/Navbar";

import "./globals.css";

export const metadata: Metadata = {
  title: "AI 文章摘要工具",
  description: "输入文章链接，一键生成三种长度的中文摘要",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
