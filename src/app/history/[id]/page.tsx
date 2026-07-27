import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSummaryById, getSummaryIds } from "@/lib/db/queries";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

// SSG：构建时预生成所有已有摘要的详情页。
// dynamicParams=true 允许新记录首次访问时按需生成（ISR 兜底）。
export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const rows = await getSummaryIds(500);
  return rows.map((row) => ({ id: String(row.id) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const summary = await getSummaryById(Number(id));

  if (!summary) {
    return {
      title: "摘要不存在",
    };
  }

  const title = summary.title;
  const description = summary.oneSentence;
  const siteName = summary.siteName;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      url: `/history/${id}`,
      locale: "zh_CN",
      publishedTime: summary.createdAt
        ? new Date(summary.createdAt).toISOString()
        : undefined,
      siteName: siteName ?? "AI 文章摘要工具",
      images: [
        {
          url: "/og-default.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/og-default.png`],
    },
    alternates: {
      canonical: `/history/${id}`,
    },
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
        {title}
      </h2>
      <div className="prose prose-sm max-w-none text-gray-700">{children}</div>
    </section>
  );
}

export default async function SummaryDetailPage({
  params,
}: Props): Promise<React.ReactElement> {
  const { id } = await params;
  const summary = await getSummaryById(Number(id));

  if (!summary) {
    notFound();
  }

  const createdAt = summary.createdAt
    ? formatDate(new Date(summary.createdAt))
    : "—";
  const sourceText = [summary.siteName, createdAt]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-gray-500">
          <li>
            <Link href="/" className="transition-colors hover:text-blue-600">
              首页
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              href="/history"
              className="transition-colors hover:text-blue-600"
            >
              历史记录
            </Link>
          </li>
          <li>/</li>
          <li className="truncate text-gray-700" title={summary.title}>
            摘要详情
          </li>
        </ol>
      </nav>

      {/* 标题区 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">
          {summary.title}
        </h1>
        <p className="mt-2 text-sm text-gray-500">{sourceText}</p>
      </div>

      {/* 原文链接 */}
      <div className="mb-6">
        <a
          href={summary.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          查看原文
        </a>
      </div>

      {/* 摘要内容 */}
      <div className="space-y-4">
        <Section title="一句话摘要">{summary.oneSentence}</Section>
        <Section title="短摘要">
          <p className="leading-relaxed">{summary.shortSummary}</p>
        </Section>
        <Section title="详细摘要">
          <div className="space-y-2 leading-relaxed whitespace-pre-wrap">
            {summary.detailedSummary}
          </div>
        </Section>
      </div>

      {/* 元信息 */}
      <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-gray-400">
        <span>模型：{summary.model}</span>
        {summary.tokenCount != null && (
          <>
            <span>·</span>
            <span>消耗 token：{summary.tokenCount}</span>
          </>
        )}
      </div>

      {/* 回到历史页 */}
      <div className="mt-10">
        <Link
          href="/history"
          className="inline-flex items-center gap-1 text-sm text-blue-600 transition-colors hover:text-blue-700 hover:underline"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          返回历史记录
        </Link>
      </div>
    </main>
  );
}
