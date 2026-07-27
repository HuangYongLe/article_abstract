import { NextResponse } from "next/server";

import { getSummaryById } from "@/lib/db/queries";

// GET /api/history/:id — 返回单条历史摘要详情
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const numId = Number(id);

    if (Number.isNaN(numId) || numId < 1) {
      return NextResponse.json(
        { error: "无效的记录 ID", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    const summary = await getSummaryById(numId);

    if (!summary) {
      return NextResponse.json(
        { error: "摘要不存在", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误", code: "DB_ERROR" },
      { status: 500 }
    );
  }
}
