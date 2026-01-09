export type PlanView = "month" | "week";

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function getTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function parseDateISO(value: string): Date | null {
  const match = ISO_DATE_REGEX.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatDateISO(date: Date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

export function startOfWeek(date: Date) {
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  return addDays(date, -diff);
}

export function endOfWeek(date: Date) {
  return addDays(startOfWeek(date), 6);
}

export function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function endOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

export function getViewRange(view: PlanView, focusedDate: Date) {
  if (view === "week") {
    const start = startOfWeek(focusedDate);
    return { start, end: endOfWeek(start) };
  }

  const monthStart = startOfMonth(focusedDate);
  const monthEnd = endOfMonth(focusedDate);
  return { start: startOfWeek(monthStart), end: endOfWeek(monthEnd) };
}
