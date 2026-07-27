import OpenAI from "openai";

// --- 常量 ---

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const TEMPERATURE = 0.3;
const MAX_TOKENS = 2000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const SUMMARY_SYSTEM_PROMPT =
  "你是一个专业的文章摘要助手。请根据用户提供的文章内容生成摘要。" +
  "始终使用中文回复。严格以 JSON 格式返回结果��";

const SUMMARY_USER_PROMPT =
  "请对以下文章生成三种长度的中文摘要。\n" +
  "严格以 JSON 格式返回，包含以下三个字段：\n" +
  "- one_sentence: 一句话总结，不超过 50 字\n" +
  "- short: 短摘要，100-200 字\n" +
  "- detailed: 详细摘要，300-500 字\n" +
  "\n文章内容：\n{content}";

// --- 类型 ---

export interface SummaryResult {
  oneSentence: string;
  shortSummary: string;
  detailedSummary: string;
  model: string;
  tokenCount: number | null;
}

interface OpenAISummaryResponse {
  one_sentence: string;
  short: string;
  detailed: string;
}

// --- 客户端实例 ---

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  timeout: 60000,
  maxRetries: 0, // 关闭 SDK 内置重试，由我们自己的 retry 函数统一管理
});

// --- 重试工具 ---

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 带指数退避的重试包装器
 * 可重试的错误类型：超时、网络错误、空响应、JSON 解析失败、5xx、429
 */
async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  label: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fn(attempt);
      if (attempt > 1) {
        console.log("[openai] retry succeeded on attempt", attempt);
      }
      return result;
    } catch (err) {
      lastError = err;
      const isLast = attempt === MAX_RETRIES;

      // 不可重试的错误 — 直接抛出
      if (!isRetryable(err)) {
        throw err;
      }

      if (isLast) break;

      // 指数退避：第 n 次重试等待 2^(n-1) * base
      const waitMs = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(
        "[openai] " + label + " attempt " + attempt + " failed, retrying in " + waitMs + "ms:",
        err instanceof Error ? err.message : String(err)
      );
      await delay(waitMs);
    }
  }

  throw lastError;
}

/** 判断错误是否可重试 */
function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;

  // OpenAI SDK 的 APIError 有 status 属性
  const status = (err as { status?: number }).status;
  if (status === 429 || (status && status >= 500)) return true;

  // 网络/超时相关错误
  const msg = err.message.toLowerCase();
  if (
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("etimedout") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("network") ||
    msg.includes("aborted") ||
    msg.includes("fetch failed")
  ) {
    return true;
  }

  // 空响应或 JSON 解析失败也可以重试（可能是中间网络抖动）
  if (
    msg.includes("empty response") ||
    msg.includes("unexpected token") ||
    msg.includes("json")
  ) {
    return true;
  }

  return false;
}

// --- 导出函数 ---

export async function generateSummaries(content: string): Promise<SummaryResult> {
  // 测试模式
  if (process.env.MOCK_AI === "true") {
    const preview = content.slice(0, 80).replace(/\s+/g, " ");
    return {
      oneSentence: "[Mock] 本文讨论了" + preview + "相关内容的核心要点。",
      shortSummary: "[Mock] 这是一篇关于" + preview + "的短摘要，涵盖主要观点和关键信息，帮助读者快速理解文章主旨。",
      detailedSummary: "[Mock] 本文深入探讨了" + preview + "的多个方面。文章首先介绍了背景和相关概念，然后详细分析了核心问题及其影响。作者提出了若干重要观点，并结合实际案例进行了论证。最后总结了主要发现并展望了未来发展方向。这篇详细摘要为读者提供了全面的内容概述。",
      model: "mock-gpt-4o",
      tokenCount: 100,
    };
  }

  return withRetry(async (attempt) => {
    const response = await client.chat.completions.create(
      {
        model: MODEL,
        response_format: { type: "json_object" },
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: "system", content: SUMMARY_SYSTEM_PROMPT },
          {
            role: "user",
            content: SUMMARY_USER_PROMPT.replace("{content}", content),
          },
        ],
      },
      {
        // 每次重试增加超时时间
        timeout: 30000 + attempt * 15000,
      }
    );

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("AI returned empty response (attempt " + attempt + ")");
    }

    let parsed: OpenAISummaryResponse;
    try {
      parsed = JSON.parse(raw) as OpenAISummaryResponse;
    } catch {
      throw new Error(
        "AI returned invalid JSON (attempt " + attempt + "): " + raw.slice(0, 200)
      );
    }

    return {
      oneSentence: parsed.one_sentence,
      shortSummary: parsed.short,
      detailedSummary: parsed.detailed,
      model: MODEL,
      tokenCount: response.usage?.total_tokens ?? null,
    };
  }, "generateSummaries");
}
