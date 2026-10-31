"use client";
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
  const item =
    selected.kind === "item"
      ? state.items.find((i) => i.id === selected.id)
      : undefined;
  const cluster = state.clusters.find(
    (c) => c.id === (item?.clusterId || selected.id),
  );

  const [saved, setSaved] = useState("");
  const canEdit = user.role !== "viewer";
  if (!cluster) return <Empty title="Запись больше не доступна" />;
  const members = state.items.filter((i) => i.clusterId === cluster.id);
  const p = priority(cluster, state.items);
  const allPrivate = members.every((i) => i.private);
  return (
    <div className="sheet-body detail">
      <div className="detail-meta">
        <Badge kind={p.label}>
          {priorityLabels[p.label]} приоритет · {p.score}
        </Badge>
        <Badge kind="blue">{cluster.status}</Badge>
      </div>
      <h2>{item ? item.topic : cluster.title}</h2>
      <p className="detail-location">
        {cluster.district}
        {cluster.location && !allPrivate ? ` · ${cluster.location}` : ""}
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
                {item.language === "kk" ? "Қазақша" : "Русский"} ·{" "}
                {date(item.publishedAt)}
              </span>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer">
                  Оригинал <ExternalLink size={12} />
                </a>
              ) : (
                <span>
                  {user.workspace === "demo"
                    ? "Синтетическая запись DEMO"
                    : "Ссылка не предоставлена"}
                </span>
              )}
            </div>
          </div>
          <div className="detail-stat-grid">
            <div>
              <small>Подразделение</small>
              <strong>{item.department}</strong>
              <span>Уверенность {Math.round(item.confidence * 100)}%</span>
            </div>
            <div>
              <small>Тональность</small>
              <Badge kind={item.sentiment}>
                {sentimentLabels[item.sentiment]}
              </Badge>
              <span>
                Уверенность {Math.round(item.sentimentConfidence * 100)}% ·{" "}
                {item.sentimentScore.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="explanation">
            <h3>
              <Sparkles size={14} /> Обоснование классификации
            </h3>
            <p>{item.reason}</p>
            <h3>Обоснование тональности</h3>
            <p>{item.sentimentReason}</p>
            <small>
              {item.engine} · {item.latencyMs} мс ·{" "}
              {item.reviewed
                ? "Проверено оператором"
                : "Самооценка модели, не вероятность"}
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
              <strong>Проблема: {cluster.title}</strong>
              <small>
                {members.length} обращений · {p.independent} независимых
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
            <h3>Что происходит</h3>
            <p>
              {allPrivate
                ? "Приватные обращения — только агрегированные показатели."
                : cluster.summary}
            </p>
            <div className="detail-stat-grid">
              <div>
                <small>Обнаружено</small>
                <strong>{date(cluster.createdAt)}</strong>
              </div>
              <div>
                <small>Независимые сигналы</small>
                <strong>{p.independent}</strong>
              </div>
            </div>
            <span className="early-badge">
              <Zap size={13} /> +{p.recent} новых обращений за 24 часа
            </span>
          </div>
          <section className="priority-factors">
            <h3>Почему такой приоритет?</h3>
            <p>Прозрачный расчёт · {p.score} из 100</p>
            {Object.entries(p.factors).map(([name, value]) => (
              <div key={name}>
                <span>{name}</span>
                <div className="bar-track">
                  <div style={{ width: `${(value / 40) * 100}%` }} />
                </div>
                <strong>+{value}</strong>
              </div>
            ))}
            <small>
              Без метрик охвата вклад охвата равен нулю. Негатив сам по себе не
              делает проблему срочной.
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
              Исходные обращения <span>{members.length}</span>
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
                        <LockKeyhole size={12} /> Direct · текст ограничен
                      </>
                    ) : (
                      i.text
                    )}
                  </span>
                  <small>
                    {state.sources.find((s) => s.id === i.sourceId)?.name} ·{" "}
                    {date(i.publishedAt)}
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
          {saved}
        </p>
      )}
      <div className="privacy-note">
        <ShieldCheck size={15} />
        <span>
          Рекомендация ИИ. Итоговое решение принимает сотрудник. Все изменения
          журналируются.
        </span>
      </div>
    </div>
  );
}
