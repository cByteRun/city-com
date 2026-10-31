"use client";
import { t, useLocale } from "@/shared/i18n";

import { type ReactNode } from "react";
export function Panel({
  title,
  sub,
  action,
  children,
  className = "",
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  useLocale();
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{t(title)}</h2>
          {sub && <p>{t(sub)}</p>}
        </div>
        {t(action)}
      </div>
      {t(children)}
    </section>
  );
}
