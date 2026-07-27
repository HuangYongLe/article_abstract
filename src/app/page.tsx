"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";

import { UrlInputForm } from "@/components/UrlInputForm";
import { SummaryResult } from "@/components/SummaryResult";
import type { Summary } from "@/lib/db/schema";
import type { ApiErrorBody } from "@/lib/errors";

/** API 错误信息 + 当前 URL（用于重试） */
interface ErrorState {
  error: string;
  code: string;
  detail?: string;
  retryable?: boolean;
  url: string;
}

/** 根据错误码获取图标和颜色 */
function errorConfig(code: string) {
  switch (code) {
    case "SCRAPE_FAILED":
      return {
        icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
        title: "抓取失败",
        bg: "bg-amber-50 border-amber-200",
        text: "text-amber-800",
        iconBg: "bg-amber-100 text-amber-600",
      };
    case "AI_TIMEOUT":
      return {
        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
        title: "AI 响应超时",
        bg: "bg-orange-50 border-orange-200",
        text: "text-orange-800",
        iconBg: "bg-orange-100 text-orange-600",
      };
    case "AI_RATE_LIMITED":
      return {
        icon: "M13 10V3L4 14h7v7l9-11h-7z",
        title: "AI 服务繁忙",
        bg: "bg-orange-50 border-orange-200",
        text: "text-orange-800",
        iconBg: "bg-orange-100 text-orange-600",
      };
    case "AI_API_ERROR":
    case "AI_EMPTY_RESPONSE":
    case "AI_INVALID_RESPONSE":
      return {
        icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
        title: "AI 服务异常",
        bg: "bg-red-50 border-red-200",
        text: "text-red-800",
        iconBg: "bg-red-100 text-red-600",
      };
    default:
      return {
        icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
        title: "出错了",
        bg: "bg-red-50 border-red-200",
        text: "text-red-800",
        iconBg: "bg-red-100 text-red-600",
      };
  }
}

export default function Home(): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [partial, setPartial] = useState(false);
  const lastUrl = useRef("");

  const handleSubmit = useCallback(async (url: string) => {
    setLoading(true);
    setErrorState(null);
    setSummary(null);
    setPartial(false);
    lastUrl.current = url;

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        const err = data as ApiErrorBody;
        setErrorState({
          error: err.error ?? "生成失败，请重试",
          code: err.code ?? "UNKNOWN",
          detail: err.detail,
          retryable: err.retryable,
          url,
        });
        return;
      }

      // 处理降级抓取提示
      if (data._partial) {
        setPartial(true);
        delete data._partial;
      }

      setSummary(data as Summary);
    } catch {
      setErrorState({
        error: "网络连接失败，请检查网络后重试",
        code: "NETWORK_ERROR",
        retryable: true,
        url,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastUrl.current) {
      handleSubmit(lastUrl.current);
    }
  }, [handleSubmit]);

  const config = errorState ? errorConfig(errorState.code) : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      {/* Hero */}
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
      {errorState && !loading && config && (
        <div className={"mt-8 rounded-xl border p-5 " + config.bg}>
          <div className="flex items-start gap-3">
            <div className={"flex-shrink-0 rounded-lg p-2 " + config.iconBg}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={"text-sm font-semibold " + config.text}>
                {config.title}
              </h3>
              <p className={"mt-1 text-sm " + config.text + "/80"}>
                {errorState.error}
              </p>
              {errorState.detail && (
                <p className="mt-1.5 text-xs text-gray-500 break-all">
                  {errorState.detail}
                </p>
              )}
              {errorState.retryable && (
                <button
                  onClick={handleRetry}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  重试
                </button>
              )}
            </div>
            <button
              onClick={() => setErrorState(null)}
              className={"flex-shrink-0 rounded p-1 transition-colors hover:bg-black/5 " + config.text + "/60"}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 降级抓取提示 */}
      {partial && summary && !loading && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          页面正文提取不完整，摘要基于文章元信息生成，内容仅供参考。
        </div>
      )}

      {/* 摘要结果 */}
      {summary && !loading && (
        <div className="mt-8">
          <SummaryResult summary={summary} />
        </div>
      )}

      {/* 空状态 */}
      {!summary && !loading && !errorState && (
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
