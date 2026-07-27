"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

import { UrlInputForm } from "@/components/UrlInputForm";
import { SummaryResult } from "@/components/SummaryResult";
import type { Summary } from "@/lib/db/schema";

export default function Home(): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(async (url: string) => {
    setLoading(true);
    setError("");
    setSummary(null);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "生成失败，请重试");
      }

      const data = (await res.json()) as Summary;
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请重试");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      {/* Hero 区 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          AI 文章摘要工具
        </h1>
        <p className="mt-3 text-sm text-gray-600 sm:text-base">
          粘贴链接，一键生成三种长度的中文摘要
        </p>
      </div>

      {/* 输入区 */}
      <div className="mt-8">
        <UrlInputForm onSubmit={handleSubmit} loading={loading} />
      </div>

      {/* 加载骨架屏 */}
      {loading && (
        <div className="mt-8 animate-pulse space-y-4">
          <div className="h-6 w-2/3 rounded-md bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-9 w-20 rounded-md bg-gray-200" />
            <div className="h-9 w-20 rounded-md bg-gray-200" />
            <div className="h-9 w-20 rounded-md bg-gray-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-4/5 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-3/5 rounded bg-gray-200" />
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && !loading && (
        <div className="mt-8 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* 摘要结果 */}
      {summary && !loading && (
        <div className="mt-8">
          <SummaryResult summary={summary} />
        </div>
      )}

      {/* 空状态引导 */}
      {!summary && !loading && !error && (
        <div className="mt-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { title: "一句话摘要", desc: "快速了解文章核心观点", icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" },
              { title: "短摘要", desc: "200 字以内精炼概述", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
              { title: "详细摘要", desc: "结构化要点深度解读", icon: "M4 6h16M4 10h16M4 14h7m-7 4h7m4-4h5m-5-4h5" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/history"
              className="inline-flex items-center gap-1 text-sm text-blue-600 transition-colors hover:text-blue-700 hover:underline"
            >
              查看历史记录
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
