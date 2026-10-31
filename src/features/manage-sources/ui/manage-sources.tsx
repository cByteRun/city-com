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
              {s.id}
              {s.city ? ` · ${s.city}` : ""}
              {s.region ? ` · ${s.region}` : ""}
              {s.tags ? ` · ${s.tags}` : ""}
            </small>
            <small>
              {t(s.type)} ·{" "}
              {t(
                s.type === "Direct"
                  ? user.workspace === "demo"
                    ? "Direct: подготовленный демонстрационный поток"
                    : "Официальный Telegram-бот · только с согласием отправителя"
                  : t("Сбор каждые {0} мин", [s.intervalMinutes]),
              )}
            </small>
            {s.error && <p className="error-inline">{t(s.error)}</p>}
            {s.lastFetched !== undefined && (
              <small>
                {t("Последний запуск: получено {0}, по словам {1}", [
                  s.lastFetched,
                  s.lastMatched || 0,
                ])}
              </small>
            )}
            {user.role === "admin" && s.type !== "Direct" && (
              <details>
                <summary>{t("Настроить источник")}</summary>
                <form
                  key={`${s.url}-${s.type}-${s.permission}`}
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const result = await action({
                      action: "source",
                      id: s.id,
                      enabled: s.enabled,
                      name: data.get("name"),
                      type: data.get("type"),
                      url: data.get("url"),
                      keywords: data.get("keywords"),
                      resourceId: data.get("resourceId"),
                      city: data.get("city"),
                      region: data.get("region"),
                      tags: data.get("tags"),
                      aiConsent: data.get("aiConsent") === "on",
                      intervalMinutes: Number(data.get("intervalMinutes")),
                      permission: data.get("permission") === "on",
                      permissionBasis: data.get("permissionBasis"),
                    });
                    if (result) notify("Настройки источника сохранены");
                  }}
                  style={{ display: "grid", gap: 8, marginTop: 12 }}
                >
                  <label className="field-label">
                    {t("Название")}
                    <input
                      name="name"
                      defaultValue={s.name}
                      required
                      minLength={3}
                      maxLength={120}
                    />
                  </label>
                  <label className="field-label">
                    {t("Метод")}
                    <select
                      aria-label={t("Метод")}
                      name="type"
                      defaultValue={s.type}
                    >
                      <option value="JSON">JSON</option>
                      <option value="RSS">RSS</option>
                      <option value="HTML">HTML</option>
                      <option value="VK">VK API</option>
                      <option value="Instagram">Instagram API</option>
                      <option value="Facebook">Facebook API</option>
                      <option value="Telegram">Telegram Bot API</option>
                    </select>
                  </label>
                  <label className="field-label">
                    {t("Публичный HTTPS URL")}
                    <input
                      name="url"
                      type="url"
                      defaultValue={s.url}
                      maxLength={2000}
                      placeholder="https://portal.kz/comments/feed"
                    />
                  </label>
                  <label className="field-label">
                    {t("Ключевые слова через запятую (любое совпадение)")}
                    <input
                      name="keywords"
                      defaultValue={s.keywords || ""}
                      maxLength={500}
                    />
                  </label>
                  <label className="field-label">
                    {t("Город источника")}
                    <input
                      name="city"
                      defaultValue={s.city || ""}
                      maxLength={100}
                    />
                  </label>
                  <label className="field-label">
                    {t("Область источника")}
                    <input
                      name="region"
                      defaultValue={s.region || ""}
                      maxLength={100}
                    />
                  </label>
                  <label className="field-label">
                    {t("Теги источника через запятую")}
                    <input
                      name="tags"
                      defaultValue={s.tags || ""}
                      maxLength={500}
                    />
                  </label>
                  <small>
                    {t(
                      "Город, область и теги описывают канал. Отбор сообщений выполняется по ключевым словам, адрес сообщения определяется отдельно.",
                    )}
                  </small>
                  <label className="field-label">
                    {t("ID публикации для Meta API")}
                    <input
                      name="resourceId"
                      defaultValue={s.resourceId || ""}
                      maxLength={200}
                    />
                  </label>
                  <label>
                    <input
                      name="aiConsent"
                      type="checkbox"
                      defaultChecked={s.aiConsent || false}
                    />
                    {t(
                      "Telegram: индивидуальное согласие авторов на AI-обработку подтверждено",
                    )}
                  </label>
                  <small>
                    {t(
                      "Секрет API хранится на сервере в CITYCOM_SOURCE_N_TOKEN, где N — номер источника. Для Telegram нужен отдельный бот канала.",
                    )}
                  </small>
                  <label className="field-label">
                    {t("Интервал, минут")}
                    <input
                      name="intervalMinutes"
                      type="number"
                      min={1}
                      max={60}
                      defaultValue={s.intervalMinutes}
                      required
                    />
                  </label>
                  <label className="field-label">
                    {t("Основание сбора и AI-обработки")}
                    <textarea
                      name="permissionBasis"
                      defaultValue={s.permissionBasis || ""}
                      maxLength={1000}
                      placeholder={t(
                        "Разрешение владельца, условия площадки, дата и ссылка на документ",
                      )}
                    />
                  </label>
                  <label>
                    <input
                      name="permission"
                      type="checkbox"
                      defaultChecked={s.permission}
                    />
                    {t(" Сбор и обработка разрешены")}
                  </label>
                  <small>
                    {t(
                      "HTML: JSON-LD, блог ПАВЛОДАРЭНЕРГО и Открытый диалог. Социальные сети подключаются отдельными официальными API.",
                    )}
                  </small>
                  <Button disabled={busy} size="sm">
                    {t("Сохранить настройки")}
                  </Button>
                </form>
              </details>
            )}
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
          {s.type !== "Direct" &&
            user.workspace === "live" &&
            user.role === "admin" && (
              <Button
                size="sm"
                disabled={busy}
                onClick={async () => {
                  const result = await action({ action: "probe", id: s.id });
                  if (result?.message) notify(result.message);
                }}
              >
                {t("Проверить API")}
              </Button>
            )}
          <Button
            size="sm"
            disabled={busy || user?.role !== "admin"}
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
      {user.role === "admin" && (
        <Button
          disabled={busy}
          onClick={async () => {
            const result = await action({ action: "source-create" });
            if (result)
              notify(
                t(
                  "Источник добавлен: настройте URL и разрешение, затем включите сбор",
                ),
              );
          }}
        >
          {t("Добавить источник")}
        </Button>
      )}
    </div>
  );
}
