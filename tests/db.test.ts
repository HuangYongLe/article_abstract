/**
 * CRUD 单元测试 — 使用临时数据库隔离运行
 *
 * 运行: npx vitest run
 */
import { describe, test, expect, beforeEach, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

// ---------------------------------------------------------------------------
// 测试数据库设置 — 在导入 db 模块之前完成
// ---------------------------------------------------------------------------
const TEST_DB = path.join(os.tmpdir(), `test-article-${process.pid}.db`);

// 清理可能残留的旧测试数据库
if (fs.existsSync(TEST_DB)) {
  fs.unlinkSync(TEST_DB);
}

// 通过环境变量指定测试数据库路径
process.env.DB_PATH = TEST_DB;

// 在测试数据库上运行迁移，创建表结构
{
  const sqlite = new Database(TEST_DB);
  const testDb = drizzle(sqlite);
  migrate(testDb, { migrationsFolder: path.resolve(__dirname, "..", "drizzle") });
  sqlite.close();
}

// 环境变量已设置 + 表已创建，现在安全导入模块
const {
  insertSummary,
  getSummaries,
  getSummaryById,
  deleteSummary,
  countSummaries,
  sqlite,
} = await import("../src/lib/db");

import type { NewSummary } from "../src/lib/schema";

// ---------------------------------------------------------------------------
// 测试数据工厂
// ---------------------------------------------------------------------------
function makeSummary(overrides: Partial<NewSummary> = {}): NewSummary {
  return {
    url: "https://example.com/article",
    title: "测试文章标题",
    content: "这是测试文章的正文内容，用于验证数据库 CRUD 操作。",
    oneLine: "一句话摘要",
    short: "短摘要内容",
    detailed: "详细摘要内容",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 测试用例
// ---------------------------------------------------------------------------
describe("数据库 CRUD 操作", () => {
  // 每个测试前清空表，保证隔离
  beforeEach(() => {
    sqlite.exec("DELETE FROM summaries");
    // 重置自增 id
    sqlite.exec("DELETE FROM sqlite_sequence WHERE name = 'summaries'");
  });

  // --- insertSummary ---

  describe("insertSummary", () => {
    test("应成功插入记录并返回完整数据", () => {
      const data = makeSummary({ title: "插入测试" });
      const result = insertSummary(data);

      expect(result.id).toBeGreaterThan(0);
      expect(result.url).toBe(data.url);
      expect(result.title).toBe("插入测试");
      expect(result.content).toBe(data.content);
      expect(result.oneLine).toBe(data.oneLine);
      expect(result.short).toBe(data.short);
      expect(result.detailed).toBe(data.detailed);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    test("应自动填充 created_at 默认值", () => {
      const before = Date.now();
      const result = insertSummary(makeSummary());
      const after = Date.now();

      // unixepoch() 精度为秒，允许 1 秒容差
      const ts = result.createdAt.getTime();
      expect(ts).toBeGreaterThanOrEqual(before - 1000);
      expect(ts).toBeLessThanOrEqual(after);
    });

    test("连续插入应生成递增的 id", () => {
      const r1 = insertSummary(makeSummary({ title: "第一条" }));
      const r2 = insertSummary(makeSummary({ title: "第二条" }));
      const r3 = insertSummary(makeSummary({ title: "第三条" }));

      expect(r2.id).toBe(r1.id + 1);
      expect(r3.id).toBe(r2.id + 1);
    });
  });

  // --- getSummaries ---

  describe("getSummaries", () => {
    test("应返回所有记录（默认分页）", () => {
      for (let i = 0; i < 3; i++) {
        insertSummary(makeSummary({ title: `文章 ${i + 1}` }));
      }

      const result = getSummaries();
      expect(result).toHaveLength(3);
    });

    test("应按创建时间倒序排列", () => {
      insertSummary(makeSummary({ title: "最早" }));
      // 确保时间戳不同
      const r1 = getSummaries()[0];

      insertSummary(makeSummary({ title: "中间" }));
      insertSummary(makeSummary({ title: "最新" }));

      const result = getSummaries();
      expect(result).toHaveLength(3);
      expect(result[0]!.title).toBe("最新");
      expect(result[2]!.title).toBe("最早");
    });

    test("应正确分页", () => {
      for (let i = 0; i < 5; i++) {
        insertSummary(makeSummary({ title: `文章 ${i + 1}` }));
      }

      const page1 = getSummaries(1, 2);
      const page2 = getSummaries(2, 2);
      const page3 = getSummaries(3, 2);

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page3).toHaveLength(1);

      // 不同页不应有重复 id
      const ids = [...page1, ...page2, ...page3].map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    test("空表应返回空数组", () => {
      const result = getSummaries();
      expect(result).toEqual([]);
    });
  });

  // --- getSummaryById ---

  describe("getSummaryById", () => {
    test("应返回指定 id 的记录", () => {
      const inserted = insertSummary(makeSummary({ title: "查找测试" }));

      const found = getSummaryById(inserted.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(inserted.id);
      expect(found!.title).toBe("查找测试");
    });

    test("不存在的 id 应返回 null", () => {
      const result = getSummaryById(99999);
      expect(result).toBeNull();
    });

    test("应返回完整字段", () => {
      const data = makeSummary({
        url: "https://test.com/full",
        title: "完整字段测试",
        content: "完整正文",
        oneLine: "完整一句话",
        short: "完整短摘要",
        detailed: "完整详细摘要",
      });
      const inserted = insertSummary(data);
      const found = getSummaryById(inserted.id);

      expect(found).not.toBeNull();
      expect(found!.url).toBe(data.url);
      expect(found!.title).toBe(data.title);
      expect(found!.content).toBe(data.content);
      expect(found!.oneLine).toBe(data.oneLine);
      expect(found!.short).toBe(data.short);
      expect(found!.detailed).toBe(data.detailed);
    });
  });

  // --- deleteSummary ---

  describe("deleteSummary", () => {
    test("应删除指定 id 的记录", () => {
      const inserted = insertSummary(makeSummary());
      expect(getSummaryById(inserted.id)).not.toBeNull();

      deleteSummary(inserted.id);

      expect(getSummaryById(inserted.id)).toBeNull();
    });

    test("删除不存在的 id 不应报错", () => {
      expect(() => deleteSummary(99999)).not.toThrow();
    });

    test("删除后总数应减少", () => {
      insertSummary(makeSummary());
      const inserted = insertSummary(makeSummary());
      insertSummary(makeSummary());

      expect(countSummaries()).toBe(3);

      deleteSummary(inserted.id);

      expect(countSummaries()).toBe(2);
    });

    test("删除一条不应影响其他记录", () => {
      const r1 = insertSummary(makeSummary({ title: "保留1" }));
      const r2 = insertSummary(makeSummary({ title: "删除" }));
      const r3 = insertSummary(makeSummary({ title: "保留2" }));

      deleteSummary(r2.id);

      expect(getSummaryById(r1.id)).not.toBeNull();
      expect(getSummaryById(r2.id)).toBeNull();
      expect(getSummaryById(r3.id)).not.toBeNull();
    });
  });

  // --- countSummaries ---

  describe("countSummaries", () => {
    test("空表应返回 0", () => {
      expect(countSummaries()).toBe(0);
    });

    test("应返回正确的记录数", () => {
      for (let i = 0; i < 7; i++) {
        insertSummary(makeSummary());
      }
      expect(countSummaries()).toBe(7);
    });
  });
});

// ---------------------------------------------------------------------------
// 清理
// ---------------------------------------------------------------------------
afterAll(() => {
  sqlite.close();
  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
  }
  // 清理 WAL/SHM 文件
  for (const ext of ["-wal", "-shm"]) {
    const f = TEST_DB + ext;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
});
