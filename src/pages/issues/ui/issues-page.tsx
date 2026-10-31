"use client";
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
  setSelected,
}: {
  state: State;
  items: Item[];
  clusters: Cluster[];
  updateFilter: (key: keyof Filters, value: string) => void;
  setSelected: (
    selection: { kind: "item" | "cluster"; id: string } | null,
  ) => void;
}) {
  return (
    <>
      <div className="kpi-grid four">
        {kpi(
          "Высокий приоритет",
          clusters.filter((c) => priority(c, state.items).label === "high")
            .length,
          "Требуют внимания оператора",
          <TriangleAlert size={18} />,
          () => updateFilter("priority", "high"),
          "coral",
        )}
        {kpi(
          "Горячие темы за 24 часа",
          clusters.filter((c) => priority(c, state.items).recent >= 3).length,
          "Не менее трёх новых сигналов",
          <Zap size={18} />,
        )}
        {kpi(
          "Всего проблем",
          clusters.length,
          "Объединены по теме и месту",
          <Layers3 size={18} />,
        )}
        {kpi(
          "Ожидают назначения",
          clusters.filter((c) => !c.assignee).length,
          "Подтвердите подразделение",
          <Send size={18} />,
        )}
      </div>
      <div className="info-note">
        <ShieldCheck size={16} />
        <span>
          Приоритет — рекомендация системы. Откройте проблему, проверьте
          основания и подтвердите решение.
        </span>
      </div>
      <Panel
        title="Реестр городских проблем"
        sub={`${clusters.length} проблем · сортировка по расчётному приоритету`}
      >
        <IssueTable
          list={clusters}
          state={state}
          items={items}
          onSelect={setSelected}
        />
      </Panel>
    </>
  );
}
