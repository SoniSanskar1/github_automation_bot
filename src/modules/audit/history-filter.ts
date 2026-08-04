export type HistoryEventFilter = "all" | "issues" | "pull_request";

export function filterHistoryEvents<T extends { githubEvent: string }>(
  events: T[],
  filter: HistoryEventFilter,
) {
  if (filter === "all") return events;
  return events.filter((event) => event.githubEvent === filter);
}
