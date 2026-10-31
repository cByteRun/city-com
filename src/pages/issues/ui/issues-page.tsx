"use client";
import { t, useLocale } from "@/shared/i18n";

import { TriangleAlert, Zap, Layers3, Send, ShieldCheck } from "lucide-react";
import { Panel } from "@/shared/ui";
import { IssueTable } from "@/widgets/issue-table";
import { type State } from "@/entities/workspace";
import { type Item } from "@/entities/feedback";
import { type Cluster, priority } from "@/entities/issue";
import { type Filters } from "@/features/filter-feedback";
import { kpi } from "@/shared/ui";
export function IssuesPage({
  state,
  items,
  clusters,
  updateFilter,
  queue,
  setSelected,
}: {
  state: State;
  items: Item[];
  clusters: Cluster[];
  queue: string;
  updateFilter: (key: keyof Filters, value: string) => void;
  setSelected: (
    selection: { kind: "item" | "cluster"; id: string } | null,
  ) => void;
}) {
  useLocale();
  const open = clusters.filter(
    (c) => !["Решено", "Закрыто"].includes(c.status),
  );
  const visible = clusters;
  return (
    <>
      <div className="kpi-grid four">
        {t(
          kpi(
            "Высокий приоритет",
            clusters.filter((c) => priority(c, state.items).label === "high")
              .length,
            "Требуют внимания оператора",
            <TriangleAlert size={18} />,
            () => updateFilter("priority", "high"),
            "coral",
          ),
        )}
        {t(
          kpi(
            "Горячие темы за 24 часа",
            open.filter((c) => priority(c, state.items).recent >= 3).length,
            "Не менее трёх новых сигналов",
            <Zap size={18} />,
            () => updateFilter("queue", "hot"),
          ),
        )}
        {t(
          kpi(
            "Всего проблем",
            clusters.length,
            "Объединены по теме и месту",
            <Layers3 size={18} />,
            () => updateFilter("queue", ""),
          ),
        )}
        {t(
          kpi(
            "Ожидают назначения",
            open.filter((c) => !c.assignedAt).length,
            "Подтвердите подразделение",
            <Send size={18} />,
            () => updateFilter("queue", "waiting"),
          ),
        )}
      </div>
      <div className="info-note">
        <ShieldCheck size={16} />
        <span>
          {t(
            "Приоритет — рекомендация системы. Откройте проблему, проверьте основания и подтвердите решение.",
          )}
        </span>
      </div>
      <Panel
        title={t("Реестр городских проблем")}
        sub={t("{0} проблем · сортировка по расчётному приоритету", [
          visible.length,
        ])}
      >
        <div
          className="queue-tabs"
          role="group"
          aria-label={t("Очередь проблем")}
        >
          {(
            [
              ["", "Все проблемы"],
              ["hot", "Горячие за 24 часа"],
              ["waiting", "Без назначения"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              aria-pressed={queue === key}
              onClick={() => updateFilter("queue", key)}
            >
              {t(label)}
            </button>
          ))}
          <span>{t("{0} в очереди", [visible.length])}</span>
        </div>
        <IssueTable
          list={visible}
          state={state}
          items={items}
          onSelect={setSelected}
        />
      </Panel>
    </>
  );
}
