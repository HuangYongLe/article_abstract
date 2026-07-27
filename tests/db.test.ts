/**
 * CRUD 单元测试 — 使用临时 SQLite 文件隔离运行（libsql file: 协议）
 *
 * 运行: npx vitest run
 */
import { describe, test, expect, beforeEach, afterAll } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

// ---------------------------------------------------------------------------
// 测试数据库设置 — 在导入 db 模块之前完成
// ---------------------------------------------------------------------------
const TEST_DB = path.join(os.tmpdir(), `test-article-${process.pid}.db`);

// 清理可能残留的旧测试数据库
if (fs.existsSync(TEST_DB)) {
  fs.unlinkSync(TEST_DB);
}

// 通过环境变量指定测试数据库路径
process.env.DATABASE_URL = `file:${TEST_DB}`;
delete process.env.DATABASE_AUTH_TOKEN;

// 在测试数据库上运行迁移，创建表结构
// 动态导入以使用已设置的 env
const { createClient } = await import("@libsql/client");
const { drizzle } = await import("drizzle-orm/libsql");
const { migrate } = await import("drizzle-orm/libsql/migrator");

const migrationClient = createClient({ url: `file:${TEST_DB}` });
const migrationDb = drizzle(migrationClient);
await migrate(migrationDb, {
  migrationsFolder: path.resolve(__dirname, "..", "drizzle"),
});

// 环境变量已设置 + 表已创建，现在安全导入模块
const {
  createSummary,
  getSummaries,
  getSummaryById,
  deleteSummary,
  countSummaries,
  client,
} = await import("../src/lib/db/queries");

import type { NewSummary } from "../src/lib/db/schema";

// ---------------------------------------------------------------------------
// 测试数据工厂
// ---------------------------------------------------------------------------
function makeSummary(overrides: Partial<NewSummary> = {}): NewSummary {
  return {
    url: "https://example.com/article",
    title: "测试文章标题",
    siteName: "测试站点",
    oneSentence: "一句话摘要",
    shortSummary: "短摘要内容",
    detailedSummary: "详细摘要内容",
    model: "test-model",
    tokenCount: 100,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 测试用例
// ---------------------------------------------------------------------------
describe("数据库 CRUD 操作", () => {
  // 每个测试前清空表，保证隔离
  beforeEach(async () => {
    await client.execute("DELETE FROM summaries");
    await client.execute(
      "DELETE FROM sqlite_sequence WHERE name = 'summaries'"
    );
  });

  // --- createSummary ---

  describe("createSummary", () => {
    test("应成功插入记录并返回完整数据", async () => {
      const data = makeSummary({ title: "插入测试" });
      const result = await createSummary(data);

      expect(result.id).toBeGreaterThan(0);
      expect(result.url).toBe(data.url);
      expect(result.title).toBe("插入测试");
      expect(result.siteName).toBe(data.siteName);
      expect(result.oneSentence).toBe(data.oneSentence);
      expect(result.shortSummary).toBe(data.shortSummary);
      expect(result.detailedSummary).toBe(data.detailedSummary);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    test("应自动填充 created_at 默认值", async () => {
      const before = Date.now();
      const result = await createSummary(makeSummary());
      const after = Date.now();

      const ts = result.createdAt.getTime();
      expect(ts).toBeGreaterThanOrEqual(before - 1000);
      expect(ts).toBeLessThanOrEqual(after);
    });

    test("连续插入应生成递增的 id", async () => {
      const r1 = await createSummary(makeSummary({ title: "第一条" }));
      const r2 = await createSummary(makeSummary({ title: "第二条" }));
      const r3 = await createSummary(makeSummary({ title: "第三条" }));

      expect(r2.id).toBe(r1.id + 1);
      expect(r3.id).toBe(r2.id + 1);
    });
  });

  // --- getSummaries ---

  describe("getSummaries", () => {
    test("应返回所有记录（默认分页）", async () => {
      for (let i = 0; i < 3; i++) {
        await createSummary(makeSummary({ title: `文章 ${i + 1}` }));
      }

      const result = await getSummaries();
      expect(result).toHaveLength(3);
    });

    test("应按创建时间倒序排列", async () => {
      await createSummary(makeSummary({ title: "最早" }));
      await createSummary(makeSummary({ title: "中间" }));
      await createSummary(makeSummary({ title: "最新" }));

      const result = await getSummaries();
      expect(result).toHaveLength(3);
      expect(result[0]!.title).toBe("最新");
      expect(result[2]!.title).toBe("最早");
    });

    test("应正确分页", async () => {
      for (let i = 0; i < 5; i++) {
        await createSummary(makeSummary({ title: `文章 ${i + 1}` }));
      }

      const page1 = await getSummaries(1, 2);
      const page2 = await getSummaries(2, 2);
      const page3 = await getSummaries(3, 2);

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page3).toHaveLength(1);

      const ids = [...page1, ...page2, ...page3].map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    test("空表应返回空数组", async () => {
      const result = await getSummaries();
      expect(result).toEqual([]);
    });
  });

  // --- getSummaryById ---

  describe("getSummaryById", () => {
    test("应返回指定 id 的记录", async () => {
      const inserted = await createSummary(makeSummary({ title: "查找测试" }));

      const found = await getSummaryById(inserted.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(inserted.id);
      expect(found!.title).toBe("查找测试");
    });

    test("不存在的 id 应返回 null", async () => {
      const result = await getSummaryById(99999);
      expect(result).toBeNull();
    });

    test("应返回完整字段", async () => {
      const data = makeSummary({
        url: "https://test.com/full",
        title: "完整字段测试",
        siteName: "测试站",
        oneSentence: "完整一句话",
        shortSummary: "完整短摘要",
        detailedSummary: "完整详细摘要",
      });
      const inserted = await createSummary(data);
      const found = await getSummaryById(inserted.id);

      expect(found).not.toBeNull();
      expect(found!.url).toBe(data.url);
      expect(found!.title).toBe(data.title);
      expect(found!.siteName).toBe(data.siteName);
      expect(found!.oneSentence).toBe(data.oneSentence);
      expect(found!.shortSummary).toBe(data.shortSummary);
      expect(found!.detailedSummary).toBe(data.detailedSummary);
    });
  });

  // --- deleteSummary ---

  describe("deleteSummary", () => {
    test("应删除指定 id 的记录", async () => {
      const inserted = await createSummary(makeSummary());
      expect(await getSummaryById(inserted.id)).not.toBeNull();

      await deleteSummary(inserted.id);

      expect(await getSummaryById(inserted.id)).toBeNull();
    });

    test("删除不存在的 id 不应报错", async () => {
      await expect(deleteSummary(99999)).resolves.not.toThrow();
    });

    test("删除后总数应减少", async () => {
      await createSummary(makeSummary());
      const inserted = await createSummary(makeSummary());
      await createSummary(makeSummary());

      expect(await countSummaries()).toBe(3);

      await deleteSummary(inserted.id);

      expect(await countSummaries()).toBe(2);
    });

    test("删除一条不应影响其他记录", async () => {
      const r1 = await createSummary(makeSummary({ title: "保留1" }));
      const r2 = await createSummary(makeSummary({ title: "删除" }));
      const r3 = await createSummary(makeSummary({ title: "保留2" }));

      await deleteSummary(r2.id);

      expect(await getSummaryById(r1.id)).not.toBeNull();
      expect(await getSummaryById(r2.id)).toBeNull();
      expect(await getSummaryById(r3.id)).not.toBeNull();
    });
  });

  // --- countSummaries ---

  describe("countSummaries", () => {
    test("空表应返回 0", async () => {
      expect(await countSummaries()).toBe(0);
    });

    test("应返回正确的记录数", async () => {
      for (let i = 0; i < 7; i++) {
        await createSummary(makeSummary());
      }
      expect(await countSummaries()).toBe(7);
    });
  });
});

// ---------------------------------------------------------------------------
// 清理
// ---------------------------------------------------------------------------
afterAll(async () => {
  if (client) {
    client.close();
  }
  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
  }
  for (const ext of ["-wal", "-shm"]) {
    const f = TEST_DB + ext;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
});
