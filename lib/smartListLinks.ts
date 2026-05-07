export function buildSmartListPath(workspaceSlug: string, smartListId: string) {
  return `/g/${workspaceSlug}/smart-lists/${smartListId}`;
}

export function buildShoppingListWeekUrl(workspaceSlug: string, weekStart: string) {
  const params = new URLSearchParams({ week: weekStart });
  return `/g/${workspaceSlug}/shopping-list?${params.toString()}`;
}

export function isCurrentShoppingListWeek(
  pathname: string,
  searchParams: URLSearchParams,
  workspaceSlug: string,
  weekStart: string,
) {
  if (pathname !== `/g/${workspaceSlug}/shopping-list`) return false;
  return searchParams.get("week") === weekStart;
}
