import { NextResponse } from "next/server";

import { getSummaryById } from "@/lib/db/queries";
import { apiError, ErrorCode } from "@/lib/errors";

// GET /api/history/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const numId = Number(id);

    if (Number.isNaN(numId) || numId < 1) {
      return apiError("无效的记录 ID", ErrorCode.INVALID_ID);
    }

    const summary = await getSummaryById(numId);
    if (!summary) {
      return apiError("摘要不存在", ErrorCode.NOT_FOUND);
    }

    return NextResponse.json(summary);
  } catch {
    return apiError("服务器内部错误", ErrorCode.INTERNAL_ERROR);
  }
}
