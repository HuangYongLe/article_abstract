import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const summaries = sqliteTable("summaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // 原始文章信息
  url: text("url").notNull(),
  title: text("title").notNull(),
  siteName: text("site_name"),

  // 三种摘要
  oneSentence: text("one_sentence").notNull(),
  shortSummary: text("short_summary").notNull(),
  detailedSummary: text("detailed_summary").notNull(),

  // AI 调用元数据
  model: text("model").notNull(),
  tokenCount: integer("token_count"),

  // 时间戳
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 导出类型 — 从 schema 推导，不手写重复 interface
export type Summary = typeof summaries.$inferSelect;
export type NewSummary = typeof summaries.$inferInsert;
