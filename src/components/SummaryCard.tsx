"use client";

import { useState } from "react";
import Link from "next/link";

import type { Summary } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

interface SummaryCardProps {
  summary: Summary;
}

/** 历史记录卡片 — 可展开查看详细摘要 */
export function SummaryCard({ summary }: SummaryCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* 卡片头部（可点击展开） */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-4 px-5 py-4 text-left"
      >
        <div
          className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {summary.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
            {summary.siteName && <span>{summary.siteName}</span>}
            <span>{formatDate(summary.createdAt)}</span>
          </div>
          {/* 一句话预览 */}
          {!expanded && (
            <p className="mt-2 line-clamp-1 text-sm text-gray-600">
              {summary.oneSentence}
            </p>
          )}
        </div>
      </button>

      {/* 展开内容 */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="ml-12 space-y-4">
            {/* 一句话 */}
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                一句话摘要
              </div>
              <p className="text-sm text-gray-700">{summary.oneSentence}</p>
            </div>

            {/* 短摘要 */}
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                短摘要
              </div>
              <p className="text-sm leading-relaxed text-gray-700">{summary.shortSummary}</p>
            </div>

            {/* 详细摘要 */}
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h7m-7 4h7m4-4h5m-5-4h5" />
                </svg>
                详细摘要
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {summary.detailedSummary}
              </div>
            </div>

            {/* 元信息 + 原文链接 + 详情页 */}
            <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
              {summary.model && <span>模型: {summary.model}</span>}
              {summary.tokenCount && <span>{summary.tokenCount} tokens</span>}
              <a
                href={summary.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                查看原文
              </a>
              <Link
                href={`/history/${summary.id}`}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                查看详情页
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
