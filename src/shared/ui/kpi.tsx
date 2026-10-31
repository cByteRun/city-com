"use client";
import { t } from "@/shared/i18n";

import { ArrowUpRight } from "lucide-react";
import { type ReactNode } from "react";
export const kpi = (
  label: string,
  value: string | number,
  sub: string,
  icon: ReactNode,
  click?: () => void,
  tone = "blue",
) => (
  <button className="kpi" onClick={click} disabled={!click}>
    <div className="kpi-top">
      <span>{t(label)}</span>
      <i className={`kpi-icon ${tone}`}>{t(icon)}</i>
    </div>
    <strong>{t(value)}</strong>
    <div className="kpi-bottom">
      <span>{t(sub)}</span>
      {click && <ArrowUpRight size={12} />}
    </div>
  </button>
);
