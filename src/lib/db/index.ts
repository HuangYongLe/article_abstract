import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";

import * as schema from "./schema";

// 惰性初始化：仅在首次访问 DB 时才创建连接
// 这样构建时（如 generateStaticParams）不会因 DATABASE_URL 缺失而崩溃
let _client: Client | null = null;
let _db: LibSQLDatabase<typeof schema> | null = null;

function ensureClient(): Client {
  if (_client) return _client;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL 环境变量未设置");
  }

  _client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });
  return _client;
}

function ensureDb(): LibSQLDatabase<typeof schema> {
  if (_db) return _db;
  _db = drizzle(ensureClient(), { schema });
  return _db;
}

// 通过 Proxy 保持 db / client 与原有 import 方式完全兼容
const dbProxyHandler: ProxyHandler<object> = {
  get(_, prop, receiver) {
    const target = ensureDb();
    const value = Reflect.get(target as object, prop, receiver);
    if (typeof value === "function") {
      return value.bind(target);
    }
    return value;
  },
};

const clientProxyHandler: ProxyHandler<object> = {
  get(_, prop, receiver) {
    const target = ensureClient();
    const value = Reflect.get(target as object, prop, receiver);
    if (typeof value === "function") {
      return value.bind(target);
    }
    return value;
  },
};

export const db = new Proxy(
  {},
  dbProxyHandler,
) as unknown as LibSQLDatabase<typeof schema>;

export const client = new Proxy(
  {},
  clientProxyHandler,
) as unknown as Client;
