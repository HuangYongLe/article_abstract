import { NextRequest, NextResponse } from "next/server";

import { getSummaries } from "@/lib/db/queries";
import { apiError, ErrorCode } from "@/lib/errors";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// GET /api/history
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);
    const requestedLimit = Number(searchParams.get("limit")) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(1, requestedLimit), MAX_LIMIT);

    const summaries = await getSummaries(page, limit);
    return NextResponse.json(summaries);
  } catch {
    return apiError("加载历史记录失败", ErrorCode.DB_ERROR);
  }
}
