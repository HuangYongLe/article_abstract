import path from "node:path";
import fs from "node:fs";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, desc, sql } from "drizzle-orm";

import * as schema from "./schema";
import { summaries } from "./schema";
import type { NewSummary, Summary } from "./schema";

// ---------------------------------------------------------------------------
// 数据库文件路径 — 项目根目录 data/app.db
// 支持通过 DB_PATH 环境变量覆盖（测试场景使用临时数据库）
// ---------------------------------------------------------------------------
const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "data", "app.db");
const DB_DIR = path.dirname(DB_PATH);

// 确保 data/ 目录存在（首次运行时自动创建）
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Drizzle 实例 — 模块顶层单例
// ---------------------------------------------------------------------------
const sqlite = new Database(DB_PATH);
// 启用 WAL 模式提升并发读性能
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// ---------------------------------------------------------------------------
// CRUD 函数 — 所有数据库操作的唯一入口
// ---------------------------------------------------------------------------

/**
 * 插入一条摘要记录，返回完整记录（含自增 id 和默认 created_at）。
 */
export function insertSummary(data: NewSummary): Summary {
  const [result] = db.insert(summaries).values(data).returning().all();
  if (!result) {
    throw new Error("Failed to insert summary");
  }
  return result;
}

/**
 * 分页查询摘要列表，按创建时间倒序。
 */
export function getSummaries(page: number = 1, limit: number = 10): Summary[] {
  const offset = (page - 1) * limit;
  return db
    .select()
    .from(summaries)
    .orderBy(desc(summaries.createdAt), desc(summaries.id))
    .limit(limit)
    .offset(offset)
    .all();
}

/**
 * 根据 id 查询单条摘要，未找到返回 null。
 */
export function getSummaryById(id: number): Summary | null {
  const [result] = db
    .select()
    .from(summaries)
    .where(eq(summaries.id, id))
    .all();
  return result ?? null;
}

/**
 * 根据 id 删除摘要记录。
 */
export function deleteSummary(id: number): void {
  db.delete(summaries).where(eq(summaries.id, id)).run();
}

/**
 * 统计摘要总数 — 用于分页计算。
 */
export function countSummaries(): number {
  const [result] = db
    .select({ count: sql<number>`count(*)` })
    .from(summaries)
    .all();
  return result?.count ?? 0;
}

// 导出底层连接（迁移脚本等场景需要）
export { sqlite, DB_PATH };
