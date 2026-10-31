"use client";
import { t, useLocale } from "@/shared/i18n";

import { type ReactNode, useEffect, useState } from "react";
import { Pin, PinOff } from "lucide-react";
export function Panel({
  title,
  sub,
  action,
  children,
  className = "",
  pinId,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  pinId?: string;
}) {
  useLocale();
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    if (!pinId) return;
    try {
      setPinned(localStorage.getItem(`citycom-widget-v1:${pinId}`) === "1");
    } catch {
      /* Keep the default when storage is unavailable. */
    }
  }, [pinId]);
  return (
    <section className={`panel ${className} ${pinned ? "panel-pinned" : ""}`}>
      <div className="panel-heading">
        <div>
          <h2>{t(title)}</h2>
          {sub && <p>{t(sub)}</p>}
        </div>
        <div className="panel-actions">
          {t(action)}
          {pinId && (
            <button
              className="pin-button"
              aria-pressed={pinned}
              aria-label={t(
                pinned ? "Открепить: {0}" : "Закрепить в разделе: {0}",
                [title],
              )}
              title={t(
                pinned ? "Открепить виджет" : "Закрепить первым в разделе",
              )}
              onClick={() => {
                const next = !pinned;
                setPinned(next);
                try {
                  localStorage.setItem(
                    `citycom-widget-v1:${pinId}`,
                    next ? "1" : "0",
                  );
                } catch {
                  /* Pinning still works for this visit. */
                }
              }}
            >
              {pinned ? <PinOff size={12} /> : <Pin size={12} />}
            </button>
          )}
        </div>
      </div>
      {t(children)}
    </section>
  );
}
