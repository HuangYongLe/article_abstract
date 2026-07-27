import { eq, desc, sql } from "drizzle-orm";

import { db } from "./index";
import { summaries } from "./schema";
import type { NewSummary, Summary } from "./schema";

// 列表查询 — 必须包含分页
export async function getSummaries(
  page: number = 1,
  limit: number = 10
): Promise<Summary[]> {
  return db
    .select()
    .from(summaries)
    .orderBy(desc(summaries.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
}

// 单条查询 — 返回 null 表示未找到（不 throw）
export async function getSummaryById(
  id: number
): Promise<Summary | null> {
  const [result] = await db
    .select()
    .from(summaries)
    .where(eq(summaries.id, id));
  return result ?? null;
}

// 创建记录 — 返回完整记录
export async function createSummary(
  data: NewSummary
): Promise<Summary> {
  const [result] = await db.insert(summaries).values(data).returning();
  if (!result) throw new Error("Failed to create summary");
  return result;
}

// 删除记录
export async function deleteSummary(id: number): Promise<void> {
  await db.delete(summaries).where(eq(summaries.id, id));
}

// 统计总数 — 用于分页计算
export async function countSummaries(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(summaries);
  return result?.count ?? 0;
}

// 获取最近记录 — 用于首页展示
export async function getRecentSummaries(
  limit: number = 10
): Promise<Summary[]> {
  return db
    .select()
    .from(summaries)
    .orderBy(desc(summaries.createdAt))
    .limit(limit);
}
