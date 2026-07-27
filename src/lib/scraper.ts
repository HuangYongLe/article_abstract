import * as cheerio from "cheerio";

import { truncateText } from "@/lib/utils";

// --- 常量 ---

const MIN_CONTENT_LENGTH = 100;
const MAX_CONTENT_LENGTH = 12000;
const FETCH_TIMEOUT_MS = 10000;

const FETCH_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
};

const REMOVE_TAGS =
  "script, style, nav, footer, header, aside, iframe, " +
  ".ad, .advertisement, .sidebar, .comment, .related, " +
  "[class*=nav], [class*=menu], [class*=banner], [class*=promo]";

// --- 类型 ---

export interface ScrapeResult {
  url: string;
  title: string;
  content: string;
  siteName: string | null;
  /** 是否为降级提��（正文不足时从 meta 标签获取） */
  partial: boolean;
}

// --- 内部函数 ---

function extractTitle($: cheerio.CheerioAPI): string {
  return (
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "Untitled"
  );
}

function extractSiteName($: cheerio.CheerioAPI, url: string): string | null {
  return (
    $('meta[property="og:site_name"]').attr("content")?.trim() ||
    new URL(url).hostname ||
    null
  );
}

function fixWeChatImages($: cheerio.CheerioAPI): void {
  $("img[data-src]").each((_, el) => {
    const src = $(el).attr("data-src");
    if (src) $(el).attr("src", src);
  });
}

function extractContent($: cheerio.CheerioAPI): string {
  const articleEl =
    $("article").first() ||
    $("main").first() ||
    $('[role="main"]').first() ||
    $(".post-content").first() ||
    $(".article-body").first() ||
    $("body");

  articleEl.find(REMOVE_TAGS).remove();

  const text = articleEl.text().replace(/\s+/g, " ").trim();

  if (text.length < MIN_CONTENT_LENGTH) {
    const noscriptText = $("noscript").text().replace(/\s+/g, " ").trim();
    if (noscriptText.length >= MIN_CONTENT_LENGTH) {
      return truncateText(noscriptText, MAX_CONTENT_LENGTH);
    }
  }

  return truncateText(text, MAX_CONTENT_LENGTH);
}

function isSPA($: cheerio.CheerioAPI): boolean {
  const root = $("#root, #app, #__next, #__nuxt");
  if (root.length && root.text().trim().length < 50) return true;
  const bodyText = $("body").text().trim().replace(/\s+/g, " ");
  const scriptCount = $("script").length;
  if (bodyText.length < 200 && scriptCount > 3) return true;
  return false;
}

/** 检测反爬/人机验证页面（Cloudflare、Akamai 等） */
function isAntiBot($: cheerio.CheerioAPI): boolean {
  const title = $("title").text().toLowerCase();
  const bodyText = $("body").text().toLowerCase();

  // Cloudflare Challenge / Turnstile
  if (title.includes("just a moment") || title.includes("attention required")) return true;
  if (bodyText.includes("checking your browser") || bodyText.includes("cf-browser-verification")) return true;
  if ($("#challenge-running, #challenge-stage, .cf-browser-verification").length > 0) return true;

  // 通用 JavaScript 挑战页
  if (title.includes("请启用") && title.includes("javascript")) return true;
  if (bodyText.includes("enable javascript") && bodyText.includes("cookies")) return true;

  // 页面内容极少但有大量 script（验证/挑战页面特征）
  const textLen = bodyText.replace(/\s+/g, "").length;
  const scriptCount = $("script").length;
  if (textLen < 50 && scriptCount >= 3) return true;

  return false;
}

/** 兜底提取：从 meta 标签和 JSON-LD 获取文章基本信息 */
function fallbackExtract($: cheerio.CheerioAPI): {
  title: string;
  content: string;
  siteName: string | null;
} {
  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $('meta[name="twitter:title"]').attr("content")?.trim() ||
    $("title").text().trim() ||
    "Untitled";

  const description =
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[name="twitter:description"]').attr("content")?.trim() ||
    "";

  // 尝试从 JSON-LD 提取更多内容
  let jsonLdText = "";
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "{}");
      if (data.description) jsonLdText += data.description + " ";
      if (data.articleBody) jsonLdText += data.articleBody + " ";
    } catch { /* skip invalid JSON */ }
  });

  const content = [description, jsonLdText]
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n\n");

  return { title, content, siteName: null };
}

function parseHtmlContent(html: string, url: string): ScrapeResult {
  const $ = cheerio.load(html);
  fixWeChatImages($);

  // 提前检测反爬/人机验证页面（如 Vercel IP 被 Cloudflare 拦截）
  if (isAntiBot($)) {
    throw new Error(
      "目标站点启用了反爬验证（如 Cloudflare 人机认证），部署服务器 IP 被拦截。" +
      "可尝试在本地运行、使用代理服务，或换用不限制境外 IP 的站点"
    );
  }

  const title = extractTitle($);
  const siteName = extractSiteName($, url);
  const content = extractContent($);

  // 正文充足 — 正常返回
  if (content.length >= MIN_CONTENT_LENGTH) {
    return { url, title, content, siteName, partial: false };
  }

  // 正文不足 — 尝试兜底提取
  const fallback = fallbackExtract($);

  // 兜底提取也无内容 — 明确报错
  if (fallback.content.length < 20) {
    if (isSPA($)) {
      throw new Error(
        "页面为 JS 客户端渲染（如 React/Vue SPA），静态抓取无法获取内容。" +
        "请尝试其他以服务端渲染（SSR）为主的文章站点（如微信公众号、博客园、阮一峰博客等）"
      );
    }
    throw new Error(
      "页面正文内容过短（< " + MIN_CONTENT_LENGTH + " 字符），可能为空白页、404 页或纯图片/视频页面"
    );
  }

  // 兜底提取成功 — 返回降级内容
  return {
    url,
    title: fallback.title || title,
    content: truncateText(fallback.content, MAX_CONTENT_LENGTH),
    siteName: siteName || fallback.siteName,
    partial: true,
  };
}

// --- 导出函数 ---

export async function scrapeArticle(url: string): Promise<ScrapeResult> {
  const res = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error("Fetch failed: HTTP " + res.status);
  }

  const html = await res.text();
  return parseHtmlContent(html, url);
}
