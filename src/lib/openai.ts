import OpenAI from "openai";

// --- 常量 ---

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const TEMPERATURE = 0.3;
const MAX_TOKENS = 2000;
const MAX_RETRIES = 3;

const SUMMARY_SYSTEM_PROMPT =
  "你是一个专业的文章摘要助手。请根据用户提供的文章内容生成摘要。" +
  "始终使用中文回复。严格以 JSON 格式返回结果。";

const SUMMARY_USER_PROMPT = `请对以下文章生成三种长度的中文摘要。
严格以 JSON 格式返回，包含以下三个字段：
- one_sentence: 一句话总结，不超过 50 字
- short: 短摘要，100-200 字
- detailed: 详细摘要，300-500 字

文章内容：
{content}`;

// --- 类型 ---

export interface SummaryResult {
  oneSentence: string;
  shortSummary: string;
  detailedSummary: string;
  model: string;
  tokenCount: number | null;
}

/** OpenAI JSON 响应的原始结构 */
interface OpenAISummaryResponse {
  one_sentence: string;
  short: string;
  detailed: string;
}

// --- 客户端实例 ---

// 单例模式 — 模块顶层创建
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

// --- 导出函数 ---

/** 调用 OpenAI gpt-4o 一次生成三种长度的摘要 */
export async function generateSummaries(
  content: string
): Promise<SummaryResult> {
  // 测试模式：MOCK_AI=true 时返回模拟摘要
  if (process.env.MOCK_AI === "true") {
    const preview = content.slice(0, 80).replace(/\s+/g, " ");
    return {
      oneSentence: `[Mock] 本文讨论了${preview}相关内容的核心要点。`,
      shortSummary: `[Mock] 这是一篇关于${preview}的短摘要，涵盖主要观点和关键信息，帮助读者快速理解文章主旨。`,
      detailedSummary: `[Mock] 本文深入探讨了${preview}的多个方面。文章首先介绍了背景和相关概念，然后详细分析了核心问题及其影响。作者提出了若干重要观点，并结合实际案例进行了论证。最后总结了主要发现并展望了未来发展方向。这篇详细摘要为读者提供了全面的内容概述。`,
      model: "mock-gpt-4o",
      tokenCount: 100,
    };
  }

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
    { maxRetries: MAX_RETRIES }
  );

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("AI returned empty response");
  }

  const parsed = JSON.parse(raw) as OpenAISummaryResponse;

  return {
    oneSentence: parsed.one_sentence,
    shortSummary: parsed.short,
    detailedSummary: parsed.detailed,
    model: MODEL,
    tokenCount: response.usage?.total_tokens ?? null,
  };
}
