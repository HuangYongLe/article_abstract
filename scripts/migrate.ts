/**
 * 迁移脚本 — 生成并应用数据库迁移
 *
 * 用法:
 *   npx tsx scripts/migrate.ts          # 生成 + 应用迁移（默认）
 *   npx tsx scripts/migrate.ts generate  # 仅生成迁移文件
 *   npx tsx scripts/migrate.ts run       # 仅应用已有迁移
 *
 * 环境变量:
 *   DATABASE_URL           — 数据库地址（file:local.db 或 libsql://xxx.turso.io）
 *   DATABASE_AUTH_TOKEN    — Turso 认证令牌（本地 file: 协议无需设置）
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

// 自动加载 .env 文件（优先级：.env.local > .env）
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath: string): void {
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      // 不覆盖已有环境变量（.env.local 优先级更高）
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env 文件可能不存在，忽略
  }
}

loadEnvFile(resolve(__dirname, "..", ".env.local"));
loadEnvFile(resolve(__dirname, "..", ".env"));

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ 请设置 DATABASE_URL 环境变量");
  process.exit(1);
}
// TypeScript 无法从 process.exit 中推断类型收窄
const dbUrl: string = DATABASE_URL;

const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN || undefined;

// ---------------------------------------------------------------------------
// 生成迁移文件 — 调用 drizzle-kit generate
// ---------------------------------------------------------------------------
function generateMigrations(): void {
  console.log("📦 正在生成迁移文件 (drizzle-kit generate)...");

  const { execSync } = require("node:child_process");
  execSync("npx drizzle-kit generate", {
    cwd: __dirname + "/..",
    stdio: "inherit",
    env: { ...process.env },
  });

  console.log("✅ 迁移文件生成完成\n");
}

// ---------------------------------------------------------------------------
// 应用迁移 — 使用 drizzle-orm libsql migrator
// ---------------------------------------------------------------------------
async function runMigrations(): Promise<void> {
  console.log(`🗄️  数据库地址: ${dbUrl}`);

  const client = createClient({
    url: dbUrl,
    authToken: DATABASE_AUTH_TOKEN as string | undefined,
  });

  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ 迁移应用成功\n");
  } catch (err) {
    console.error("❌ 迁移应用失败:", err);
    process.exit(1);
  } finally {
    client.close();
  }
}

// ---------------------------------------------------------------------------
// 主入口
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const command = process.argv[2] ?? "all";

  switch (command) {
    case "generate":
      generateMigrations();
      break;
    case "run":
      await runMigrations();
      break;
    case "all":
    default:
      generateMigrations();
      await runMigrations();
      break;
  }
}

main();
