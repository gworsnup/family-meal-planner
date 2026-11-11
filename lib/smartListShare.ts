import { getSmartCategoryEmoji } from "@/lib/smartListPresentation";

type ShareCategory = {
  name: string;
  items: Array<{ displayText: string }>;
};

function formatWeekDate(weekStart: string) {
  const date = new Date(`${weekStart.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return weekStart;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function buildSmartListShareText({
  weekStart,
  categories,
}: {
  weekStart: string;
  categories: ShareCategory[];
}) {
  const sections = categories
    .filter((category) => category.items.length > 0)
    .map((category) => {
      const heading = `${getSmartCategoryEmoji(category.name)} *${category.name}*`;
      const items = category.items.map((item) => `• ${item.displayText}`).join("\n");
      return `${heading}\n${items}`;
    });

  return [
    "*FamilyTable Smart List*",
    `Week of ${formatWeekDate(weekStart)}`,
    "",
    sections.join("\n\n"),
    "",
    "Shared from FamilyTable",
  ].join("\n");
}

export function buildWhatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
