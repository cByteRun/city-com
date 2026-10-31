"use client";
import { Database } from "lucide-react";
import { type ReactNode } from "react";
export function Empty({
  title = "Обращений пока нет",
  text = "Измените фильтры или загрузите данные из разрешённого источника.",
  action,
}: {
  title?: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Database size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
