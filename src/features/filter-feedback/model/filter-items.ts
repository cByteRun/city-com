import type { State } from "@/entities/workspace";
import { priority } from "@/entities/issue";
import type { Filters } from "./types";
export function filterItems(
  state: State,
  filters: Partial<Filters>,
  now = Date.now(),
) {
  return state.items.filter((i) => {
    const c = state.clusters.find((c) => c.id === i.clusterId);
    return (
      (!filters.period ||
        filters.period === "all" ||
        now - new Date(i.publishedAt).getTime() <=
          Number(filters.period) * 86400000) &&
      (!filters.source || i.sourceId === filters.source) &&
      (!filters.department || i.department === filters.department) &&
      (!filters.district || i.district === filters.district) &&
      (!filters.sentiment || i.sentiment === filters.sentiment) &&
      (!filters.problem || i.clusterId === filters.problem) &&
      (!filters.status || c?.status === filters.status) &&
      (!filters.priority ||
        (c && priority(c, state.items, now).label === filters.priority)) &&
      (!filters.q ||
        (!i.private && i.text.toLowerCase().includes(filters.q.toLowerCase())))
    );
  });
}
