import { translate, type Locale } from "@/shared/i18n/translate";
import type { Cluster } from "./types";
export const priorityLabels: Record<string, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};
export function averageAssignment(clusters: Cluster[], locale: Locale = "ru") {
  const times = clusters
    .filter((c) => c.assignedAt)
    .map((c) =>
      Math.max(
        0,
        (Date.parse(c.assignedAt!) - Date.parse(c.createdAt)) / 60000,
      ),
    );
  if (!times.length) return "—";
  const n = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  return n > 120
    ? translate(locale, "{0} ч", [Math.round(n / 60)])
    : translate(locale, "{0} мин", [n]);
}
