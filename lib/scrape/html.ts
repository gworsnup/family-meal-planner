const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#39;": "'",
  "&nbsp;": " ",
};

export function decodeHtmlEntities(input: string) {
  return input.replace(
    /(&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;)/g,
    (match) => HTML_ENTITIES[match] ?? match,
  );
}
