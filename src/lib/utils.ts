/** 校验 URL 是否合法（http/https 协议） */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** 截断文本至指定长度 */
export function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

/** 格式化时间戳为中文日期（兼容 Date 对象和 Unix 秒数） */
export function formatDate(dateOrTimestamp: Date | number): string {
  const date =
    dateOrTimestamp instanceof Date
      ? dateOrTimestamp
      : new Date(dateOrTimestamp * 1000);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
