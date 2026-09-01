export function buildWeekShareMessage(lines: string[]) {
  if (!lines.length) return "";
  return ["Here are this week’s dinners 🍽️", "", ...lines].join("\n").trim();
}
