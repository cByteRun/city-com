import type { Cluster } from "./types";
import type { Item } from "@/entities/feedback/@x/issue";
export function priority(cluster: Cluster, items: Item[], now = Date.now()) {
  const members = items.filter((i) => i.clusterId === cluster.id);
  const independent = new Set(
    members.filter((i) => i.authorHash !== "unknown").map((i) => i.authorHash),
  ).size;
  const recent = members.filter(
    (i) => now - new Date(i.publishedAt).getTime() < 86400000,
  ).length;
  const previous = members.filter((i) => {
    const age = now - new Date(i.publishedAt).getTime();
    return age >= 86400000 && age < 172800000;
  }).length;
  const severity = Math.round(
    Math.max(0, ...members.map((i) => i.severity)) * 40,
  );
  const volume = Math.min(20, independent * 3);
  const growth = Math.min(20, recent * 4);
  const age = ["Решено", "Закрыто"].includes(cluster.status)
    ? 0
    : Math.min(
        15,
        Math.floor((now - new Date(cluster.createdAt).getTime()) / 86400000) *
          2,
      );
  const emotion = Math.min(
    5,
    members.filter((i) => i.sentiment === "negative").length,
  );
  const score = Math.min(100, severity + volume + growth + age + emotion);
  return {
    score,
    label: score >= 65 ? "high" : score >= 35 ? "medium" : "low",
    independent,
    recent,
    previous,
    growth: previous
      ? Math.round(((recent - previous) / previous) * 100)
      : recent
        ? null
        : 0,
    factors: {
      "Тяжесть ситуации": severity,
      "Независимые сигналы": volume,
      "Рост за 24 часа": growth,
      "Время без решения": age,
      "Негативная тональность": emotion,
    },
  };
}
