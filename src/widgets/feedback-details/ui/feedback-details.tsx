"use client";
import { t, useLocale } from "@/shared/i18n";

import { ReviewClassification } from "@/features/review-classification";
import { AssignIssue } from "@/features/assign-issue";
import { DeleteFeedback } from "@/features/delete-feedback";
import { PrivateFeedbackText } from "@/features/read-private-feedback";
import { Empty, Badge } from "@/shared/ui";
import {
  LockKeyhole,
  ExternalLink,
  Sparkles,
  Check,
  Layers3,
  ArrowRight,
  Zap,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { type State } from "@/entities/workspace";
import { type User } from "@/entities/session";
import { type Action } from "@/shared/api";
import { useState } from "react";

import { priority, priorityLabels } from "@/entities/issue";
import { date } from "@/shared/lib/format";
import { sentimentLabels } from "@/entities/feedback";
export function Detail({
  selected,
  state,
  user,
  busy,
  action,
  notify,
  onSelect,
  onClose,
}: {
  selected: { kind: "item" | "cluster"; id: string };
  state: State;
  user: User;
  busy: boolean;
  action: Action;
  notify: (text: string, error?: boolean) => void;
  onSelect: (v: { kind: "item" | "cluster"; id: string }) => void;
  onClose: () => void;
}) {
  useLocale();
  const item =
    selected.kind === "item"
      ? state.items.find((i) => i.id === selected.id)
      : undefined;
  const cluster = state.clusters.find(
    (c) => c.id === (item?.clusterId || selected.id),
  );

  const [saved, setSaved] = useState("");
  const canEdit = user.role !== "viewer";
  if (!cluster) return <Empty title={t("Запись больше не доступна")} />;
  const members = state.items.filter((i) => i.clusterId === cluster.id);
  const p = priority(cluster, state.items);
  const allPrivate = members.every((i) => i.private);
  return (
    <div className="sheet-body detail">
      <div className="detail-meta">
        <Badge kind={p.label}>
          {t(priorityLabels[p.label])} {t("приоритет ·")} {t(p.score)}
        </Badge>
        <Badge kind="blue">{t(cluster.status)}</Badge>
      </div>
      <h2>{t(item ? item.topic : cluster.title)}</h2>
      <p className="detail-location">
        {t(cluster.district)}
        {t(cluster.location && !allPrivate ? ` · ${cluster.location}` : "")}
      </p>
      {item ? (
        <>
          <div className="quote-block">
            {item.private ? (
              <PrivateFeedbackText
                item={item}
                user={user}
                busy={busy}
                action={action}
              />
            ) : (
              <p>{item.text}</p>
            )}
            <div>
              <span>
                {t(item.language === "kk" ? "Қазақша" : "Русский")} ·{" "}
                {t(date(item.publishedAt))}
              </span>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer">
                  {t("Оригинал")} <ExternalLink size={12} />
                </a>
              ) : (
                <span>
                  {t(
                    user.workspace === "demo"
                      ? "Синтетическая запись DEMO"
                      : "Ссылка не предоставлена",
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="detail-stat-grid">
            <div>
              <small>{t("Подразделение")}</small>
              <strong>{t(item.department)}</strong>
              <span>
                {t("Уверенность")} {t(Math.round(item.confidence * 100))}%
              </span>
            </div>
            <div>
              <small>{t("Тональность")}</small>
              <Badge kind={item.sentiment}>
                {t(sentimentLabels[item.sentiment])}
              </Badge>
              <span>
                {t("Уверенность")}{" "}
                {t(Math.round(item.sentimentConfidence * 100))}% ·{" "}
                {t(item.sentimentScore.toFixed(2))}
              </span>
            </div>
          </div>
          <div className="explanation">
            <h3>
              <Sparkles size={14} /> {t("Обоснование классификации")}
            </h3>
            <p>{item.reason}</p>
            <h3>{t("Обоснование тональности")}</h3>
            <p>{item.sentimentReason}</p>
            <small>
              {t(item.engine)} · {t(item.latencyMs)} {t("мс ·")}{" "}
              {t(
                item.reviewed
                  ? "Проверено оператором"
                  : "Самооценка модели, не вероятность",
              )}
            </small>
          </div>
          {canEdit && (
            <ReviewClassification
              item={item}
              user={user}
              busy={busy}
              action={action}
              notify={notify}
              onSaved={setSaved}
            />
          )}
          <button
            className="cluster-link"
            onClick={() => onSelect({ kind: "cluster", id: cluster.id })}
          >
            <Layers3 size={16} />
            <div>
              <strong>
                {t("Проблема:")} {t(cluster.title)}
              </strong>
              <small>
                {t(members.length)} {t("обращений ·")} {t(p.independent)}{" "}
                {t("независимых")}
              </small>
            </div>
            <ArrowRight size={16} />
          </button>
          {user.role === "admin" && (
            <DeleteFeedback
              item={item}
              busy={busy}
              action={action}
              notify={notify}
              onClose={onClose}
            />
          )}
        </>
      ) : (
        <>
          <div className="cluster-summary">
            <h3>{t("Что происходит")}</h3>
            <p>
              {t(
                allPrivate
                  ? "Приватные обращения — только агрегированные показатели."
                  : cluster.summary,
              )}
            </p>
            <div className="detail-stat-grid">
              <div>
                <small>{t("Обнаружено")}</small>
                <strong>{t(date(cluster.createdAt))}</strong>
              </div>
              <div>
                <small>{t("Независимые сигналы")}</small>
                <strong>{t(p.independent)}</strong>
              </div>
            </div>
            <span className="early-badge">
              <Zap size={13} /> +{t(p.recent)} {t("новых обращений за 24 часа")}
            </span>
          </div>
          <section className="priority-factors">
            <h3>{t("Почему такой приоритет?")}</h3>
            <p>
              {t("Прозрачный расчёт ·")} {t(p.score)} {t("из 100")}
            </p>
            {Object.entries(p.factors).map(([name, value]) => (
              <div key={name}>
                <span>{t(name)}</span>
                <div className="bar-track">
                  <div style={{ width: `${(value / 40) * 100}%` }} />
                </div>
                <strong>+{t(value)}</strong>
              </div>
            ))}
            <small>
              {t(
                "Без метрик охвата вклад охвата равен нулю. Негатив сам по себе не делает проблему срочной.",
              )}
            </small>
          </section>
          <AssignIssue
            cluster={cluster}
            user={user}
            busy={busy}
            action={action}
            notify={notify}
            onSaved={setSaved}
          />
          <section className="originals">
            <h3>
              {t("Исходные обращения")} <span>{t(members.length)}</span>
            </h3>
            {members.map((i) => (
              <button
                key={i.id}
                onClick={() => onSelect({ kind: "item", id: i.id })}
              >
                <div>
                  <span>
                    {i.private ? (
                      <>
                        <LockKeyhole size={12} />{" "}
                        {t("Direct · текст ограничен")}
                      </>
                    ) : (
                      i.text
                    )}
                  </span>
                  <small>
                    {t(state.sources.find((s) => s.id === i.sourceId)?.name)} ·{" "}
                    {t(date(i.publishedAt))}
                  </small>
                </div>
                <ChevronRight size={14} />
              </button>
            ))}
          </section>
        </>
      )}
      {saved && (
        <p role="status" className="inline-success">
          <Check size={14} />
          {t(saved)}
        </p>
      )}
      <div className="privacy-note">
        <ShieldCheck size={15} />
        <span>
          {t(
            "Рекомендация ИИ. Итоговое решение принимает сотрудник. Все изменения журналируются.",
          )}
        </span>
      </div>
    </div>
  );
}
