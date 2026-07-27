import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { Navbar } from "@/components/Navbar";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "AI 文章摘要工具 — 一键生成中文摘要",
    template: "%s | AI 文章摘要",
  },
  description:
    "输入文章链接，一键生成三种长度的中文摘要：一句话概括、短摘要（100-200字）、详细摘要（300-500字）。支持微信公众号、博客园、少数派等主流中文站点。",
  keywords: [
    "AI摘要",
    "文章摘要",
    "中文摘要",
    "AI总结",
    "文章总结",
    "自动摘要生成器",
    "DeepSeek摘要",
    "新闻摘要",
  ],
  authors: [{ name: "HuangYongLe" }],
  creator: "HuangYongLe",
  publisher: "HuangYongLe",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    siteName: "AI 文章摘要工具",
    title: "AI 文章摘要工具 — 一键生成中文摘要",
    description:
      "输入文章链接，一键生成三种长度的中文摘要：一句话概括、短摘要、详细摘要。",
    url: "/",
    locale: "zh_CN",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "AI 文章摘要工具",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 文章摘要工具 — 一键生成中文摘要",
    description: "输入文章链接，一键生成三种长度的中文摘要。",
    images: ["/og-default.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
