export function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x2019;/gi, "’")
    .replace(/&#x2018;/gi, "‘")
    .replace(/&#x201c;/gi, "“")
    .replace(/&#x201d;/gi, "”")
    .replace(/&#x2026;/gi, "…");
}
