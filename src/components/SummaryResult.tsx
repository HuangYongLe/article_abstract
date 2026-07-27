"use client";

import { useState } from "react";

import type { Summary } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

interface SummaryResultProps {
  summary: Summary;
}

type TabKey = "oneSentence" | "shortSummary" | "detailedSummary";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "oneSentence",
    label: "一句话",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    key: "shortSummary",
    label: "短摘要",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: "detailedSummary",
    label: "详细摘要",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h7m-7 4h7m4-4h5m-5-4h5" />
      </svg>
    ),
  },
];

/** 摘要结果展示 — 三种长度切换 */
export function SummaryResult({ summary }: SummaryResultProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabKey>("shortSummary");

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* 文章信息头 */}
      <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">{summary.title}</h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          {summary.siteName && (
            <span className="inline-flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
              </svg>
              {summary.siteName}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(summary.createdAt)}
          </span>
          {summary.tokenCount && (
            <span className="inline-flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {summary.tokenCount} tokens
            </span>
          )}
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 border-b border-gray-100 px-3 pt-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 摘要内容 */}
      <div className="px-5 py-4">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {summary[activeTab]}
        </div>
      </div>

      {/* 原文链接 */}
      <div className="border-t border-gray-100 px-5 py-3">
        <a
          href={summary.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 transition-colors hover:text-blue-700 hover:underline"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          查看原文
        </a>
      </div>
    </div>
  );
}
