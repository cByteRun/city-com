"use client";
import { t, useLocale } from "@/shared/i18n";

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
  useLocale();
  return (
    <div className="empty">
      <Database size={30} />
      <h3>{t(title)}</h3>
      <p>{t(text)}</p>
      {t(action)}
    </div>
  );
}
