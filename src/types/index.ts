// 跨模块共享类型 — 从各模块重导出，不在本地重复定义
export type { Summary, NewSummary } from "@/lib/db/schema";
export type { ScrapeResult } from "@/lib/scraper";
export type { SummaryResult } from "@/lib/openai";
