import { NextResponse } from "next/server";

// POST /api/summarize — 抓取文章并生成摘要（骨架占位）
export async function POST() {
  return NextResponse.json(
    { error: "功能尚未实现", code: "NOT_IMPLEMENTED" },
    { status: 501 }
  );
}
