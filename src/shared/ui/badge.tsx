"use client";
import { t, useLocale } from "@/shared/i18n";

import { type ReactNode } from "react";
export function Badge({
  children,
  kind = "neutral",
}: {
  children: ReactNode;
  kind?: string;
}) {
  useLocale();
  return (
    <span className={`badge badge-${kind}`}>
      <span />
      {t(children)}
    </span>
  );
}
