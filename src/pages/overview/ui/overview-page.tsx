"use client";
import { t, useLocale } from "@/shared/i18n";

import {
  MessagesSquare,
  TriangleAlert,
  ArrowRight,
  ArrowUpRight,
  Layers3,
  Send,
  Clock3,
  Workflow,
  ChevronRight,
  CheckCheck,
  ShieldCheck,
  Radar,
  MapPin,
  LockKeyhole,
  Globe2,
} from "lucide-react";
import { Panel, Empty } from "@/shared/ui";
import { TrendChart, SentimentChart } from "@/widgets/analytics-charts";
import { IssueTable } from "@/widgets/issue-table";
import { type State } from "@/entities/workspace";
import { type Item, sentimentLabels } from "@/entities/feedback";
import { type Cluster, priority, averageAssignment } from "@/entities/issue";
import { type Filters } from "@/features/filter-feedback";
import { pct } from "@/shared/lib/format";
import { kpi } from "@/shared/ui";
export function OverviewPage({
  state,
  items,
  clusters,
  go,
  setSelected,
  previousCount,
  negative,
  positive,
  neutral,
  high,
  resolved,
  trend,
}: {
  state: State;
  items: Item[];
  clusters: Cluster[];
  go: (view: string, patch?: Partial<Filters>) => void;
  setSelected: (
    selection: { kind: "item" | "cluster"; id: string } | null,
  ) => void;
  previousCount: number | null;
  negative: number;
  positive: number;
  neutral: number;
  high: number;
  resolved: number;
  trend: { date: string; total: number; negative: number }[];
}) {
  const locale = useLocale();
  const open = clusters.filter(
    (c) => !["Решено", "Закрыто"].includes(c.status),
  );
  const urgent = open.filter((c) => priority(c, state.items).label === "high");
  const waiting = open.filter((c) => !c.assignedAt);
  const reviewCount = items.filter(
    (i) => !i.reviewed && (i.confidence < 0.6 || i.sentimentConfidence < 0.6),
  ).length;
  const focus = urgent[0] || open[0];
  const focusPriority = focus ? priority(focus, state.items) : null;
  const assigned = clusters.filter((c) => c.assignedAt).length;
  const completed = clusters.filter((c) =>
    ["Решено", "Закрыто"].includes(c.status),
  ).length;
  const mood = pct(positive, items.length) - pct(negative, items.length);
  const byDepartment = [...new Set(items.map((i) => i.department))]
    .map((name) => ({
      name,
      count: items.filter((i) => i.department === name).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return (
    <>
      <div className="kpi-grid overview-kpis">
        {kpi(
          "Всего обращений",
          items.length,
          previousCount
            ? t("{0}% к прошлому периоду", [
                Math.round(
                  ((items.length - previousCount) / previousCount) * 100,
                ),
              ])
            : previousCount === 0
              ? "Нет базы сравнения"
              : "За всё время",
          <MessagesSquare size={17} />,
          () => go("feed"),
        )}
        {kpi(
          "Городских проблем",
          clusters.length,
          t("{0} остаются открытыми", [open.length]),
          <Layers3 size={17} />,
          () => go("issues"),
        )}
        {kpi(
          "Высокий приоритет",
          urgent.length,
          t("{0}% обращений связаны с ними", [
            pct(
              items.filter((i) => urgent.some((c) => c.id === i.clusterId))
                .length,
              items.length,
            ),
          ]),
          <TriangleAlert size={17} />,
          () => go("issues", { priority: "high", queue: "open" }),
          "coral",
        )}
        {kpi(
          "Ожидают передачи",
          waiting.length,
          "Без подтверждённого назначения",
          <Send size={17} />,
          () => go("issues", { queue: "waiting" }),
          "amber",
        )}
        {kpi(
          "Среднее время передачи",
          averageAssignment(clusters, locale),
          "От первого сигнала до назначения",
          <Clock3 size={17} />,
          () => go("departments"),
          "green",
        )}
      </div>
      <section
        className="signal-pipeline"
        aria-label={t("От сигнала к действию")}
      >
        <div className="pipeline-intro">
          <Workflow size={18} />
          <div>
            <strong>{t("От сигнала к действию")}</strong>
            <small>{t("В выбранной выборке")}</small>
          </div>
        </div>
        {[
          {
            label: "Сигналы",
            value: items.length,
            icon: MessagesSquare,
            view: "feed",
            queue: "",
          },
          {
            label: "Объединены в проблемы",
            value: clusters.length,
            icon: Layers3,
            view: "issues",
            queue: "",
          },
          {
            label: "Переданы службам",
            value: assigned,
            icon: Send,
            view: "departments",
            queue: "assigned",
          },
          {
            label: "Завершённые проблемы",
            value: completed,
            icon: CheckCheck,
            view: "issues",
            queue: "resolved",
          },
        ].map((step, index) => (
          <div className="pipeline-step" key={step.label}>
            <ChevronRight size={14} />
            <button onClick={() => go(step.view, { queue: step.queue })}>
              <span className="pipeline-number">0{index + 1}</span>
              <div>
                <strong>{t(step.value)}</strong>
                <small>{t(step.label)}</small>
              </div>
              <step.icon size={16} />
            </button>
          </div>
        ))}
      </section>
      <div className="section-label">
        <span>{t("01 / ПРИОРИТЕТЫ И ДЕЙСТВИЯ")}</span>
        <small>{t("Сначала — то, что требует решения")}</small>
      </div>
      <div className="operations-grid">
        <Panel
          title={t("Приоритетные городские проблемы")}
          sub={t(
            "Топ-5 по расчётному приоритету · откройте для проверки оснований",
          )}
          action={
            <button className="text-action" onClick={() => go("issues")}>
              {t("Все проблемы")} <ArrowRight size={14} />
            </button>
          }
        >
          <IssueTable
            list={clusters.slice(0, 5)}
            compact
            state={state}
            items={items}
            onSelect={setSelected}
          />
          <div className="panel-note">
            <ShieldCheck size={13} />
            {t("Приоритет рекомендует AI. Назначение подтверждает сотрудник.")}
          </div>
        </Panel>
        <section className="decision-card">
          <div className="decision-eyebrow">
            <Radar size={16} />
            {t("В ФОКУСЕ")}
            {focusPriority && (
              <span>{t("Приоритет {0}/100", [focusPriority.score])}</span>
            )}
          </div>
          {focus && focusPriority ? (
            <>
              <h2>{t(focus.title)}</h2>
              <p className="decision-location">
                <MapPin size={13} />
                {t(focus.location || focus.district)}
              </p>
              <div className="decision-facts">
                <div>
                  <strong>{t(focusPriority.independent)}</strong>
                  <span>{t("независимых сигналов")}</span>
                </div>
                <div>
                  <strong>+{t(focusPriority.recent)}</strong>
                  <span>{t("за последние 24 часа")}</span>
                </div>
              </div>
              <p className="decision-summary">{t(focus.summary)}</p>
              <div className="decision-next">
                <span>{t("СЛЕДУЮЩЕЕ ДЕЙСТВИЕ")}</span>
                <strong>
                  {t(
                    focus.assignedAt
                      ? "Проверить ход решения"
                      : "Проверить и передать подразделению",
                  )}
                </strong>
                <small>
                  {t(focus.department)} · {t(focus.status)}
                </small>
              </div>
              <button
                className="decision-button"
                onClick={() => setSelected({ kind: "cluster", id: focus.id })}
              >
                {t("Разобрать проблему")}
                <ArrowUpRight size={16} />
              </button>
            </>
          ) : (
            <Empty title={t("Нет открытых проблем")} />
          )}
        </section>
      </div>
      <div className="section-label">
        <span>{t("02 / ГОРОДСКАЯ ОБРАТНАЯ СВЯЗЬ")}</span>
        <small>{t("Сигналы из наблюдаемых источников")}</small>
      </div>
      <div className="dashboard-grid intelligence-grid">
        <Panel
          pinId="overview-trend"
          title={t("Динамика городской обратной связи")}
          sub={t("Последние 14 дней внутри выбранной выборки")}
          action={<span className="subtle-tag">{t("14 дней")}</span>}
        >
          {items.length ? (
            <TrendChart data={trend} onClick={() => go("feed")} />
          ) : (
            <Empty />
          )}
          <div className="chart-footer">
            <span>
              <i className="dot blue-dot" />
              {t("Все обращения")}
            </span>
            <span>
              <i className="dot coral-dot" />
              {t("Негатив")}
            </span>
            <button onClick={() => go("feed")}>
              {t("Смотреть ленту")}
              <ArrowRight size={12} />
            </button>
          </div>
        </Panel>
        <Panel
          pinId="overview-sentiment"
          title={t("Настроение в источниках")}
          sub={t("Не опрос всех жителей города")}
          action={
            <span className="subtle-tag">
              {t("Индекс")} {mood > 0 ? "+" : ""}
              {t(mood)}
            </span>
          }
        >
          {items.length ? (
            <>
              <SentimentChart
                total={items.length}
                data={[
                  { key: "negative", name: "Негатив", value: negative },
                  { key: "neutral", name: "Нейтрально", value: neutral },
                  { key: "positive", name: "Позитив", value: positive },
                ]}
                onSelect={(sentiment) => go("feed", { sentiment })}
              />
              <div className="sentiment-legend">
                {[
                  ["negative", negative],
                  ["neutral", neutral],
                  ["positive", positive],
                ].map(([key, count]) => (
                  <button
                    key={key}
                    onClick={() => go("feed", { sentiment: String(key) })}
                  >
                    <i className={`dot ${key}-dot`} />
                    <span>{t(sentimentLabels[key])}</span>
                    <small>{t(count)}</small>
                    <strong>{t(pct(Number(count), items.length))}%</strong>
                  </button>
                ))}
              </div>
              <p className="metric-definition">
                {t("Индекс = % позитивных − % негативных")}
              </p>
            </>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>
      <div className="dashboard-grid intelligence-grid">
        <Panel
          pinId="overview-departments"
          title={t("Каким службам поступают сигналы")}
          sub={t("Нагрузка, а не рейтинг эффективности")}
          action={
            <button className="text-action" onClick={() => go("departments")}>
              {t("Аналитика служб")}
              <ArrowRight size={13} />
            </button>
          }
        >
          <div className="department-bars">
            {byDepartment.map((d, index) => (
              <button
                key={d.name}
                onClick={() => go("feed", { department: d.name })}
              >
                <span className="department-rank">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <span>{t(d.name)}</span>
                  <div className="bar-track">
                    <div
                      style={{
                        width: `${pct(d.count, byDepartment[0]?.count || 1)}%`,
                      }}
                    />
                  </div>
                </div>
                <strong>{t(d.count)}</strong>
                <small>{t(pct(d.count, items.length))}%</small>
                <ArrowUpRight size={13} />
              </button>
            ))}
          </div>
          <div className="outcome-strip">
            <CheckCheck size={16} />
            <strong>{t(pct(resolved, items.length))}%</strong>
            <span>{t("обращений в решённых проблемах")}</span>
            <button onClick={() => go("feed", { status: "Решено" })}>
              {t("Открыть")}
              <ArrowRight size={12} />
            </button>
          </div>
        </Panel>
        <Panel
          pinId="overview-sources"
          title={t("Источники и контроль AI")}
          sub={t("Покрытие текущей выборки")}
          action={
            <button className="text-action" onClick={() => go("sources")}>
              <ArrowUpRight size={15} />
              <span className="sr-only">{t("Открыть источники")}</span>
            </button>
          }
        >
          <div className="source-list">
            {state.sources.map((source) => {
              const count = items.filter(
                (i) => i.sourceId === source.id,
              ).length;
              return (
                <button
                  key={source.id}
                  onClick={() => go("feed", { source: source.id })}
                >
                  <span
                    className={`channel-icon ${source.type === "Direct" ? "private-channel" : ""}`}
                  >
                    {source.type === "Direct" ? (
                      <LockKeyhole size={15} />
                    ) : (
                      <Globe2 size={15} />
                    )}
                  </span>
                  <span>
                    <strong>{t(source.name)}</strong>
                    <small>
                      {source.type === "Direct"
                        ? t("Direct · только агрегаты")
                        : t("Публичный источник")}
                    </small>
                  </span>
                  <strong>{t(count)}</strong>
                  <small>{t(pct(count, items.length))}%</small>
                </button>
              );
            })}
          </div>
          <button className="review-callout" onClick={() => go("moderation")}>
            <ShieldCheck size={18} />
            <span>
              <strong>{t("{0} на проверку AI", [reviewCount])}</strong>
              <small>{t("Низкая уверенность · решение за оператором")}</small>
            </span>
            <ArrowRight size={15} />
          </button>
        </Panel>
      </div>
    </>
  );
}
