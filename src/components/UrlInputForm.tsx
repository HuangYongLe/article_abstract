"use client";

import { useState, useRef, useCallback } from "react";

import { isValidUrl } from "@/lib/utils";

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  loading: boolean;
}

/** URL 输入框组件 — 支持粘贴自动触发、回车提交 */
export function UrlInputForm({ onSubmit, loading }: UrlInputFormProps): React.ReactElement {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const pasteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        setError("请输入文章链接");
        return;
      }
      if (!isValidUrl(trimmed)) {
        setError("请输入合法的 URL（需以 http:// 或 https:// 开头）");
        return;
      }
      setError("");
      onSubmit(trimmed);
    },
    [onSubmit]
  );

  // 粘贴后自动触发（延迟 300ms 让用户看清内容）
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData("text");
      if (pasted && isValidUrl(pasted.trim()) && !loading) {
        if (pasteTimer.current) clearTimeout(pasteTimer.current);
        pasteTimer.current = setTimeout(() => {
          handleSubmit(pasted);
        }, 300);
      }
    },
    [handleSubmit, loading]
  );

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) handleSubmit(url);
            }}
            placeholder="粘贴文章链接，自动生成摘要..."
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
        <button
          onClick={() => handleSubmit(url)}
          disabled={loading || !url.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              生成中...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              生成摘要
            </>
          )}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
