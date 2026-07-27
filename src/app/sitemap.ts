import type { MetadataRoute } from "next";

import { getSummaryIds } from "@/lib/db/queries";

export const revalidate = 86400; // 每天重新生成一次

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/history`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // 为每个摘要详情页生成 sitemap 条目
  let summaryPages: MetadataRoute.Sitemap = [];
  try {
    const ids = await getSummaryIds(1000);
    summaryPages = ids.map((item) => ({
      url: `${baseUrl}/history/${item.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // 数据库不可用时跳过动态条目，仅返回静态页面
  }

  return [...staticPages, ...summaryPages];
}
