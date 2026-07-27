import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

import * as schema from "./schema";

// 通过 DATABASE_URL 区分本地（file:local.db）和生产（libsql://xxx.turso.io）
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL 环境变量未设置");
}

const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;

export const client = createClient({
  url: databaseUrl,
  authToken,
});

export const db = drizzle(client, { schema });
