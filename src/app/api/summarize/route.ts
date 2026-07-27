import { NextResponse } from "next/server";

import { scrapeArticle } from "@/lib/scraper";
import { generateSummaries } from "@/lib/openai";
import { createSummary } from "@/lib/db/queries";
import { isValidUrl } from "@/lib/utils";
import {
  apiError,
  ErrorCode,
  errMsg,
  isTimeoutError,
  isRateLimitError,
} from "@/lib/errors";

// POST /api/summarize
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { url?: string };

    // 1. 校验 URL
    if (!body.url || !isValidUrl(body.url)) {
      return apiError(
        "请输入合法的 URL（需以 http:// 或 https:// 开头）",
        ErrorCode.INVALID_URL
      );
    }

    // 2. 抓取文章正文
    let scraped;
    try {
      scraped = await scrapeArticle(body.url);
    } catch (err) {
      const detail = errMsg(err);
      console.error("[summarize] 抓取失败:", body.url, "\n  ->", detail);
      return apiError(
        "无法获取文章内容，请检查链接是否可访问",
        ErrorCode.SCRAPE_FAILED,
        detail
      );
    }

    // 3. 调用 AI 生成摘要
    let summaries;
    try {
      summaries = await generateSummaries(scraped.content);
    } catch (err) {
      const detail = errMsg(err);
      console.error("[summarize] AI 调用失败:", "\n  ->", detail);

      if (isTimeoutError(err)) {
        return apiError(
          "AI 服务响应超时，请稍后重试",
          ErrorCode.AI_TIMEOUT,
          detail
        );
      }
      if (isRateLimitError(err)) {
        return apiError(
          "AI 服务繁忙，请稍后重试",
          ErrorCode.AI_RATE_LIMITED,
          detail
        );
      }
      return apiError(
        "AI 摘要生成失败，请稍后重试",
        ErrorCode.AI_API_ERROR,
        detail
      );
    }

    // 4. 存入数据库
    const record = await createSummary({
      url: scraped.url,
      title: scraped.title,
      siteName: scraped.siteName,
      oneSentence: summaries.oneSentence,
      shortSummary: summaries.shortSummary,
      detailedSummary: summaries.detailedSummary,
      model: summaries.model,
      tokenCount: summaries.tokenCount,
    });

    // 5. 返回完整记录（附带 partial 标记供前端展示提示）
    return NextResponse.json({
      ...record,
      _partial: scraped.partial || undefined,
    });
  } catch {
    return apiError("服务器内部错误", ErrorCode.INTERNAL_ERROR);
  }
}
