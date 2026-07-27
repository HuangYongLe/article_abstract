import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * summaries 表 — 文章摘要记录
 *
 * 存储每次摘要生成的完整数据：原始文章信息 + 三种粒度的摘要。
 */
export const summaries = sqliteTable("summaries", {
  // 主键 — 自增
  id: integer("id").primaryKey({ autoIncrement: true }),

  // 原始文章信息
  url: text("url").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),

  // 三种粒度的摘要
  oneLine: text("one_line").notNull(),
  short: text("short").notNull(),
  detailed: text("detailed").notNull(),

  // 时间戳 — Unix epoch，默认当前时间
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 从 schema 推导类型，不手写重复 interface
export type Summary = typeof summaries.$inferSelect;
export type NewSummary = typeof summaries.$inferInsert;
