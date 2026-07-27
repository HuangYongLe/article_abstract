/**
 * 迁移脚本 — 生成并应用数据库迁移
 *
 * 用法:
 *   npx tsx scripts/migrate.ts          # 生成 + 应用迁移（默认）
 *   npx tsx scripts/migrate.ts generate  # 仅生成迁移文件
 *   npx tsx scripts/migrate.ts run       # 仅应用已有迁移
 */
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { summaries } from "../src/lib/schema";

// ---------------------------------------------------------------------------
// 路径常量
// ---------------------------------------------------------------------------
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DB_DIR = path.join(PROJECT_ROOT, "data");
const DB_PATH = path.join(DB_DIR, "app.db");
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, "drizzle");

// ---------------------------------------------------------------------------
// 生成迁移文件 — 调用 drizzle-kit generate
// ---------------------------------------------------------------------------
function generateMigrations(): void {
  console.log("📦 正在生成迁移文件 (drizzle-kit generate)...");
  execSync("npx drizzle-kit generate", {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });
  console.log("✅ 迁移文件生成完成\n");
}

// ---------------------------------------------------------------------------
// 应用迁移 — 使用 drizzle-orm migrator
// ---------------------------------------------------------------------------
function runMigrations(): void {
  // 确保 data/ 目录存在
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // 确保迁移文件目录存在
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(
      `❌ 迁移目录不存在: ${MIGRATIONS_DIR}\n` +
        "   请先运行: npx tsx scripts/migrate.ts generate"
    );
    process.exit(1);
  }

  console.log(`🗄️  数据库路径: ${DB_PATH}`);
  console.log(`📁 迁移目录:   ${MIGRATIONS_DIR}`);

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");

  const db = drizzle(sqlite, { schema: { summaries } });

  try {
    migrate(db, { migrationsFolder: MIGRATIONS_DIR });
    console.log("✅ 迁移应用成功\n");
  } catch (err) {
    console.error("❌ 迁移应用失败:", err);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

// ---------------------------------------------------------------------------
// 主入口
// ---------------------------------------------------------------------------
function main(): void {
  const command = process.argv[2] ?? "all";

  switch (command) {
    case "generate":
      generateMigrations();
      break;
    case "run":
      runMigrations();
      break;
    case "all":
    default:
      generateMigrations();
      runMigrations();
      break;
  }
}

main();
