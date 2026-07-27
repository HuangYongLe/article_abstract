import { NextResponse } from "next/server";

// --- 错误码常量 ---

export const ErrorCode = {
  INVALID_URL: "INVALID_URL",
  INVALID_ID: "INVALID_ID",
  NOT_FOUND: "NOT_FOUND",
  SCRAPE_FAILED: "SCRAPE_FAILED",
  SCRAPE_PARTIAL: "SCRAPE_PARTIAL",
  AI_TIMEOUT: "AI_TIMEOUT",
  AI_RATE_LIMITED: "AI_RATE_LIMITED",
  AI_API_ERROR: "AI_API_ERROR",
  AI_EMPTY_RESPONSE: "AI_EMPTY_RESPONSE",
  AI_INVALID_RESPONSE: "AI_INVALID_RESPONSE",
  DB_ERROR: "DB_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// --- 标准 API 错误类型 ---

export interface ApiErrorBody {
  error: string;
  code: ErrorCodeType;
  detail?: string;
  retryable?: boolean;
}

// --- 错误响应辅助函数 ---

/** HTTP 状态码映射 */
const ERROR_STATUS: Record<string, number> = {
  [ErrorCode.INVALID_URL]: 400,
  [ErrorCode.INVALID_ID]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.SCRAPE_FAILED]: 422,
  [ErrorCode.SCRAPE_PARTIAL]: 422,
  [ErrorCode.AI_TIMEOUT]: 504,
  [ErrorCode.AI_RATE_LIMITED]: 429,
  [ErrorCode.AI_API_ERROR]: 502,
  [ErrorCode.AI_EMPTY_RESPONSE]: 502,
  [ErrorCode.AI_INVALID_RESPONSE]: 502,
  [ErrorCode.DB_ERROR]: 500,
  [ErrorCode.INTERNAL_ERROR]: 500,
};

/** 可重试的错误码 */
const RETRYABLE_CODES: Set<string> = new Set([
  ErrorCode.AI_TIMEOUT,
  ErrorCode.AI_RATE_LIMITED,
]);

/** 构建统一格式的错误响应 */
export function apiError(
  error: string,
  code: ErrorCodeType,
  detail?: string
): NextResponse<ApiErrorBody> {
  const status = ERROR_STATUS[code] ?? 500;
  const retryable = RETRYABLE_CODES.has(code);

  return NextResponse.json(
    { error, code, ...(detail ? { detail } : {}), ...(retryable ? { retryable } : {}) },
    { status }
  );
}

/** 从 unknown 提取错误消息 */
export function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e ?? "未知错误");
}

/** 判断是否为 timeout 相关错误 */
export function isTimeoutError(e: unknown): boolean {
  const msg = errMsg(e).toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("etimedout") ||
    msg.includes("aborted") ||
    msg.includes("econnreset")
  );
}

/** 判断是否为速率限制错误 */
export function isRateLimitError(e: unknown): boolean {
  if (e instanceof Error && "status" in e) {
    return (e as { status: number }).status === 429;
  }
  const msg = errMsg(e).toLowerCase();
  return msg.includes("429") || msg.includes("rate limit") || msg.includes("too many requests");
}
