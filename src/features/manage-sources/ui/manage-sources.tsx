"use client";
import { t, useLocale } from "@/shared/i18n";

import { type Source } from "@/entities/source";
import { type User } from "@/entities/session";
import { type Action, type Notify } from "@/shared/api";
import { LockKeyhole, Globe2, RefreshCw } from "lucide-react";
import { date } from "@/shared/lib/format";
import { Badge, Button } from "@/shared/ui";
export function ManageSources({
  sources,
  user,
  busy,
  action,
  notify,
}: {
  sources: Source[];
  user: User;
  busy: boolean;
  action: Action;
  notify: Notify;
}) {
  useLocale();
  return (
    <div className="source-list">
      {sources.map((s) => (
        <div className="source-row" key={s.id}>
          <span
            className={`source-symbol ${s.type === "Direct" ? "purple" : ""}`}
          >
            {s.type === "Direct" ? (
              <LockKeyhole size={21} />
            ) : (
              <Globe2 size={21} />
            )}
          </span>
          <div className="source-main">
            <strong>{t(s.name)}</strong>
            <small>
              {t(s.type)} ·{" "}
              {t(
                s.type === "Direct"
                  ? "Только синтетический демонстрационный поток"
                  : t("Сбор каждые {0} мин", [s.intervalMinutes]),
              )}
            </small>
            {s.error && <p className="error-inline">{t(s.error)}</p>}
          </div>
          <div className="source-stats">
            <strong>{t(s.inserted)}</strong>
            <small>{t("сохранено")}</small>
          </div>
          <div className="source-sync">
            <small>{t("Последний сбор")}</small>
            <span>
              {t(s.lastSync ? date(s.lastSync) : "Ещё не выполнялся")}
            </span>
          </div>
          <Badge
            kind={
              user?.workspace === "demo"
                ? "purple"
                : s.error
                  ? "negative"
                  : s.lastSync
                    ? "positive"
                    : "neutral"
            }
          >
            {t(
              user?.workspace === "demo"
                ? "DEMO"
                : s.error
                  ? "Ошибка"
                  : s.lastSync
                    ? "Подключён"
                    : "Не подключён",
            )}
          </Badge>
          <Button
            size="sm"
            disabled={busy || user?.role !== "admin" || s.type === "Direct"}
            onClick={async () => {
              const r = await action({
                action: "sync",
                id: s.id,
              });
              if (r)
                notify(
                  r.message ||
                    t("Сохранено: {0}, пропущено: {1}", [
                      r.inserted,
                      r.duplicates,
                    ]),
                );
            }}
          >
            <RefreshCw size={13} /> {t("Собрать")}
          </Button>
          <button
            className="text-action"
            disabled={user?.role !== "admin" || busy}
            onClick={async () => {
              const r = await action({
                action: "source",
                id: s.id,
                enabled: !s.enabled,
                intervalMinutes: s.intervalMinutes,
              });
              if (r)
                notify(
                  s.enabled ? "Источник приостановлен" : "Источник включён",
                );
            }}
          >
            {t(s.enabled ? "Пауза" : "Включить")}
          </button>
        </div>
      ))}
    </div>
  );
}
