"use client";
import {
  FileText,
  TriangleAlert,
  Activity,
  Check,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Panel, Empty } from "@/shared/ui";
import { TrendChart, SentimentChart } from "@/widgets/analytics-charts";
import { IssueTable } from "@/widgets/issue-table";
import { type State } from "@/entities/workspace";
import { type Item, sentimentLabels } from "@/entities/feedback";
import { type Cluster, priority } from "@/entities/issue";
import { type Filters } from "@/features/filter-feedback";
import { date, pct } from "@/shared/lib/format";
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
  return (
    <>
      <div className="kpi-grid">
        {kpi(
          "Всего обращений",
          items.length,
          previousCount
            ? `${Math.round(((items.length - previousCount) / previousCount) * 100)}% к прошлому периоду`
            : previousCount === 0
              ? "Нет базы сравнения"
              : "За всё время",
          <FileText size={18} />,
          () => go("feed"),
        )}
        {kpi(
          "Негативных",
          `${pct(negative, items.length)}%`,
          `${negative} требуют внимания`,
          <TriangleAlert size={18} />,
          () => go("feed", { sentiment: "negative" }),
          "coral",
        )}
        {kpi(
          "Высокий приоритет",
          high,
          `${pct(high, items.length)}% от обращений`,
          <TriangleAlert size={18} />,
          () => go("issues", { priority: "high" }),
          "amber",
        )}
        {kpi(
          "Индекс настроения",
          pct(positive, items.length) - pct(negative, items.length),
          "% позитив − % негатив",
          <Activity size={18} />,
        )}
        {kpi(
          "Решено",
          `${pct(resolved, items.length)}%`,
          `${resolved} обращений`,
          <Check size={20} />,
          () => go("feed", { status: "Решено" }),
          "green",
        )}
      </div>
      <div className="dashboard-grid">
        <Panel
          title="Динамика городской обратной связи"
          sub="Распределение публикаций за 14 дней"
          action={<span className="subtle-tag">14 дней</span>}
        >
          {items.length ? (
            <TrendChart data={trend} onClick={() => go("feed")} />
          ) : (
            <Empty />
          )}
          <div className="chart-footer">
            <span>
              <i className="dot blue-dot" />
              Все обращения
            </span>
            <span>
              <i className="dot coral-dot" />
              Негатив
            </span>
            <button onClick={() => go("feed")}>
              Смотреть ленту <ArrowRight size={12} />
            </button>
          </div>
        </Panel>
        <Panel title="Тональность" sub="Доли обращений">
          {items.length ? (
            <>
              <SentimentChart
                total={items.length}
                data={[
                  {
                    key: "negative",
                    name: "Негатив",
                    value: negative,
                  },
                  {
                    key: "neutral",
                    name: "Нейтрально",
                    value: neutral,
                  },
                  {
                    key: "positive",
                    name: "Позитив",
                    value: positive,
                  },
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
                    <span>{sentimentLabels[key]}</span>
                    <strong>{pct(Number(count), items.length)}%</strong>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel
          title="Приоритетные городские проблемы"
          sub="Топ кластеров обращений"
          action={
            <button className="text-action" onClick={() => go("issues")}>
              Все проблемы <ArrowRight size={12} />
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
        </Panel>
        <Panel title="Источники обращений" sub="Распределение по каналам">
          <div className="source-bars">
            {state.sources.map((source, index) => {
              const count = items.filter(
                (i) => i.sourceId === source.id,
              ).length;
              return (
                <button
                  key={source.id}
                  onClick={() => go("feed", { source: source.id })}
                >
                  <div>
                    <span>{source.name}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      style={{
                        width: `${pct(count, items.length)}%`,
                        background: [
                          "#5c6bdd",
                          "#53adb2",
                          "#e4a571",
                          "#9475db",
                        ][index],
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="source-bottom">
            <span>Индекс настроения:</span>
            <strong>
              {pct(positive, items.length) - pct(negative, items.length)}
            </strong>
          </div>
          <div className="early-warning">
            <Zap size={14} />
            <span>Раннее выявление до официальной регистрации</span>
          </div>
        </Panel>
      </div>
    </>
  );
}
