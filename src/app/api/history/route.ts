import { NextRequest, NextResponse } from "next/server";

import { getSummaries } from "@/lib/db/queries";

// 默认分页参数
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// GET /api/history — 返回最近的历史摘要记录（分页）
// 查询参数：?page=1&limit=50
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(
      1,
      Number(searchParams.get("page")) || DEFAULT_PAGE
    );
    const requestedLimit = Number(searchParams.get("limit")) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(1, requestedLimit), MAX_LIMIT);

    const summaries = await getSummaries(page, limit);

    return NextResponse.json(summaries);
  } catch {
    return NextResponse.json(
      { error: "加载历史记录失败", code: "DB_ERROR" },
      { status: 500 }
    );
  }
}
