"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

import { SummaryCard } from "@/components/SummaryCard";
import type { Summary } from "@/lib/db/schema";

export default function HistoryPage(): React.ReactElement {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/history");
      if (!res.ok) throw new Error("加载失败");
      const data = (await res.json()) as Summary[];
      setSummaries(data);
    } catch {
      setError("加载历史记录失败，请刷新重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 搜索过滤 — 匹配标题、站点名、URL
  const filtered = useMemo(() => {
    if (!query.trim()) return summaries;
    const q = query.toLowerCase().trim();
    return summaries.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.siteName?.toLowerCase().includes(q) ?? false) ||
        s.url.toLowerCase().includes(q) ||
        s.oneSentence.toLowerCase().includes(q)
    );
  }, [summaries, query]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">历史记录</h1>
          <p className="mt-1 text-sm text-gray-500">
            共 {summaries.length} 条摘要记录
          </p>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="relative mt-5">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索标题、站点或内容..."
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-11 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                  <div className="h-3 w-1/3 rounded bg-gray-200" />
                  <div className="h-3 w-full rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 错误状态 */}
      {error && !loading && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 空搜索结果 */}
      {!loading && !error && filtered.length === 0 && query && (
        <div className="mt-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">未找到匹配 "{query}" 的记录</p>
        </div>
      )}

      {/* 空状态 */}
      {!loading && !error && filtered.length === 0 && !query && summaries.length === 0 && (
        <div className="mt-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">还没有历史记录</p>
        </div>
      )}

      {/* 摘要列表 */}
      {!loading && !error && filtered.length > 0 && (
        <div className="mt-6 space-y-3">
          {filtered.map((summary) => (
            <SummaryCard key={summary.id} summary={summary} />
          ))}
        </div>
      )}
    </main>
  );
}
