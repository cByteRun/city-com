"use client";
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
            <strong>{s.name}</strong>
            <small>
              {s.type} ·{" "}
              {s.type === "Direct"
                ? "Только синтетический демонстрационный поток"
                : `Сбор каждые ${s.intervalMinutes} мин`}
            </small>
            {s.error && <p className="error-inline">{s.error}</p>}
          </div>
          <div className="source-stats">
            <strong>{s.inserted}</strong>
            <small>сохранено</small>
          </div>
          <div className="source-sync">
            <small>Последний сбор</small>
            <span>{s.lastSync ? date(s.lastSync) : "Ещё не выполнялся"}</span>
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
            {user?.workspace === "demo"
              ? "DEMO"
              : s.error
                ? "Ошибка"
                : s.lastSync
                  ? "Подключён"
                  : "Не подключён"}
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
                    `Сохранено: ${r.inserted}, пропущено: ${r.duplicates}`,
                );
            }}
          >
            <RefreshCw size={13} /> Собрать
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
            {s.enabled ? "Пауза" : "Включить"}
          </button>
        </div>
      ))}
    </div>
  );
}
