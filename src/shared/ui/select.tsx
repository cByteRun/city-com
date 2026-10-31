"use client";
import { t, useLocale } from "@/shared/i18n";

import { ChevronDown } from "lucide-react";

export function Select({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
  className?: string;
}) {
  useLocale();
  return (
    <label className={`select-wrap ${className}`}>
      <span className="sr-only">{t(label)}</span>
      <select
        aria-label={t(label)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t(label)}</option>
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o} value={o}>
              {t(o)}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {t(o.label)}
            </option>
          ),
        )}
      </select>
      <ChevronDown size={12} />
    </label>
  );
}
