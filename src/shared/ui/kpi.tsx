"use client";
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
      <span>{label}</span>
      <i className={`kpi-icon ${tone}`}>{icon}</i>
    </div>
    <strong>{value}</strong>
    <div className="kpi-bottom">
      <span>{sub}</span>
      {click && <ArrowUpRight size={12} />}
    </div>
  </button>
);
