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

/** 需要移除的非内容标签 */
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
}

// --- 内部函数 ---

/** 从 Cheerio 实例提取标题 */
function extractTitle($: cheerio.CheerioAPI): string {
  return (
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "Untitled"
  );
}

/** 从 Cheerio 实例提取站点名 */
function extractSiteName(
  $: cheerio.CheerioAPI,
  url: string
): string | null {
  return (
    $('meta[property="og:site_name"]').attr("content")?.trim() ||
    new URL(url).hostname ||
    null
  );
}

/** 修复微信公众号图片懒加载：data-src → src */
function fixWeChatImages($: cheerio.CheerioAPI): void {
  $("img[data-src]").each((_, el) => {
    const src = $(el).attr("data-src");
    if (src) $(el).attr("src", src);
  });
}

/** 从 HTML 提取正文纯文本 */
function extractContent($: cheerio.CheerioAPI): string {
  // 选择器优先级：article → main → [role=main] → .post-content → .article-body → body
  const articleEl =
    $("article").first() ||
    $("main").first() ||
    $('[role="main"]').first() ||
    $(".post-content").first() ||
    $(".article-body").first() ||
    $("body");

  // 清洗：移除非内容标签
  articleEl.find(REMOVE_TAGS).remove();

  // 提取纯文本，压缩空白，截断
  const text = articleEl
    .text()
    .replace(/\s+/g, " ")
    .trim();

  // 如果正文过短，尝试从 noscript 标签中提取（部分站点把 SSR 内容放里面）
  if (text.length < MIN_CONTENT_LENGTH) {
    const noscriptText = $("noscript")
      .text()
      .replace(/\s+/g, " ")
      .trim();
    if (noscriptText.length >= MIN_CONTENT_LENGTH) {
      return truncateText(noscriptText, MAX_CONTENT_LENGTH);
    }
  }

  return truncateText(text, MAX_CONTENT_LENGTH);
}

/** 检测是否为 JS 客户端渲染的 SPA 页面 */
function isSPA($: cheerio.CheerioAPI): boolean {
  // 空 root div（React/Vue SPA 标志）
  const root = $("#root, #app, #__next, #__nuxt");
  if (root.length && root.text().trim().length < 50) return true;
  // 极小的 <body> 内容，且包含大量 script 标签
  const bodyText = $("body").text().trim().replace(/\s+/g, " ");
  const scriptCount = $("script").length;
  if (bodyText.length < 200 && scriptCount > 3) return true;
  return false;
}

/** 用 Cheerio 解析 HTML 并提取结构化内容 */
function parseHtmlContent(html: string, url: string): ScrapeResult {
  const $ = cheerio.load(html);

  fixWeChatImages($);

  const title = extractTitle($);
  const siteName = extractSiteName($, url);
  const content = extractContent($);

  if (content.length < MIN_CONTENT_LENGTH) {
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

  return { url, title, content, siteName };
}

// --- 导出函数 ---

/** 抓取文章并提取正文 — 去掉导航、广告等非内容元素 */
export async function scrapeArticle(url: string): Promise<ScrapeResult> {
  const res = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Fetch failed: HTTP ${res.status}`);
  }

  const html = await res.text();
  const result = parseHtmlContent(html, url);

  return result;
}
