import { type State } from "@/entities/workspace";
import { type Item } from "@/entities/feedback";
import { type Filters, filterItems } from "@/features/filter-feedback";
import { priority } from "@/entities/issue";
import { date } from "@/shared/lib/format";
import { departments } from "@/entities/department";
export function deriveCityAnalytics(
  state: State | null,
  items: Item[],
  filters: Filters,
) {
  const clusters = state
    ? state.clusters
        .filter((c) => items.some((i) => i.clusterId === c.id))
        .sort(
          (a, b) =>
            priority(b, state.items).score - priority(a, state.items).score,
        )
    : [];
  const previousCount = (() => {
    if (!state || filters.period === "all") return null;
    const days = Number(filters.period || 30);
    const now = Date.now();
    return filterItems(state, { ...filters, period: "all" }).filter((i) => {
      const age = now - Date.parse(i.publishedAt);
      return age > days * 86400000 && age <= days * 2 * 86400000;
    }).length;
  })();
  const negative = items.filter((i) => i.sentiment === "negative").length;
  const positive = items.filter((i) => i.sentiment === "positive").length;
  const neutral = items.length - negative - positive;
  const high = items.filter(
    (i) =>
      state &&
      state.clusters.some(
        (c) =>
          c.id === i.clusterId && priority(c, state.items).label === "high",
      ),
  ).length;
  const resolved = items.filter((i) =>
    state?.clusters.some(
      (c) => c.id === i.clusterId && ["Решено", "Закрыто"].includes(c.status),
    ),
  ).length;
  const review = items.filter(
    (i) => !i.reviewed && (i.confidence < 0.6 || i.sentimentConfidence < 0.6),
  );
  const trend = Array.from({ length: 14 }, (_, k) => {
    const d = new Date();
    d.setDate(d.getDate() - 13 + k);
    const key = d.toISOString().slice(0, 10);
    const day = items.filter((i) => i.publishedAt.slice(0, 10) === key);
    return {
      date: d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
      total: day.length,
      negative: day.filter((i) => i.sentiment === "negative").length,
    };
  });
  const byDepartment = departments
    .map((name) => {
      const list = items.filter((i) => i.department === name);
      return {
        name,
        total: list.length,
        negative: list.filter((i) => i.sentiment === "negative").length,
        neutral: list.filter((i) => i.sentiment === "neutral").length,
        positive: list.filter((i) => i.sentiment === "positive").length,
      };
    })
    .filter((d) => d.total)
    .sort((a, b) => b.total - a.total);

  return {
    clusters,
    previousCount,
    negative,
    positive,
    neutral,
    high,
    resolved,
    review,
    trend,
    byDepartment,
  };
}
