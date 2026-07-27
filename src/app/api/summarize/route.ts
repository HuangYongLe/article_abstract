import { NextResponse } from "next/server";

import { scrapeArticle } from "@/lib/scraper";
import { generateSummaries } from "@/lib/openai";
import { createSummary } from "@/lib/db/queries";
import { isValidUrl } from "@/lib/utils";

/** 从 Error 提取可展示的消息 */
function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e ?? "未知错误");
}

// 错误响应辅助函数
function errorResponse(
  error: string,
  code: string,
  status: number,
  detail?: string
): NextResponse {
  return NextResponse.json(
    { error, code, ...(detail ? { detail } : {}) },
    { status }
  );
}

// POST /api/summarize — 抓取文章并生成三种长度的摘要
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { url?: string };

    // 1. 校验 URL
    if (!body.url || !isValidUrl(body.url)) {
      return errorResponse(
        "请输入合法的 URL（需以 http:// 或 https:// 开头）",
        "INVALID_URL",
        400
      );
    }

    // 2. 抓取文章正文
    let scraped;
    try {
      scraped = await scrapeArticle(body.url);
    } catch (err) {
      const detail = errMsg(err);
      console.error("[summarize] 抓取失败:", body.url, "\n  →", detail);
      return errorResponse(
        "无法获取文章内容，请检查链接是否可访问",
        "SCRAPE_FAILED",
        422,
        detail
      );
    }

    // 3. 调用 AI 生成摘要
    let summaries;
    try {
      summaries = await generateSummaries(scraped.content);
    } catch {
      return errorResponse(
        "AI 摘要生成失败，请稍后重试",
        "AI_SUMMARY_FAILED",
        502
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

    // 5. 返回完整记录
    return NextResponse.json(record);
  } catch {
    return errorResponse("服务器内部错误", "DB_ERROR", 500);
  }
}
