export const pct = (n: number, d: number) =>
  d ? Math.round((n / d) * 100) : 0;
export const date = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
