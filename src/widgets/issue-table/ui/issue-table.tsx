"use client";
import { Badge, Empty } from "@/shared/ui";
import { ArrowRight } from "lucide-react";
import { type Cluster, priority, priorityLabels } from "@/entities/issue";
import { type State } from "@/entities/workspace";
import { type Item } from "@/entities/feedback";
export function IssueTable({
  list,
  compact = false,
  state,
  items,
  onSelect,
}: {
  list: Cluster[];
  compact?: boolean;
  state: State;
  items: Item[];
  onSelect: (selection: { kind: "item" | "cluster"; id: string }) => void;
}) {
  return (
    <div className="table-scroll">
      <table className={compact ? "compact-table" : "data-table"}>
        <thead>
          <tr>
            {!compact && <th>Приоритет</th>}
            <th>Городская проблема</th>
            {!compact && <th>Подразделение</th>}
            <th>Сигналы</th>
            {!compact && (
              <>
                <th>За 24 ч.</th>
                <th>Статус</th>
              </>
            )}
            <th />
          </tr>
        </thead>
        <tbody>
          {list.map((c, index) => {
            const p = priority(c, state!.items);
            const members = items.filter((i) => i.clusterId === c.id);
            return (
              <tr
                key={c.id}
                onClick={() => onSelect({ kind: "cluster", id: c.id })}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    onSelect({ kind: "cluster", id: c.id });
                }}
                aria-label={`Открыть: ${c.title}`}
              >
                <td className={compact ? "issue-name" : "priority-cell"}>
                  {compact ? (
                    <div className="ranked">
                      <span className="rank">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <strong>{c.title}</strong>
                        <small>
                          {c.department} · {c.district}
                        </small>
                      </div>
                    </div>
                  ) : (
                    <Badge kind={p.label}>{priorityLabels[p.label]}</Badge>
                  )}
                </td>
                {!compact && (
                  <td className="issue-name">
                    <strong>{c.title}</strong>
                    <small>
                      {c.location || "Локация требует уточнения"} · {c.district}
                    </small>
                  </td>
                )}
                {!compact && <td>{c.department}</td>}
                <td>
                  <strong>{members.length}</strong>
                  <small>{p.independent} независимых</small>
                </td>
                {!compact && (
                  <>
                    <td>
                      <span className={p.recent ? "growth" : ""}>
                        +{p.recent}
                      </span>
                      <small>
                        {p.growth === null
                          ? "новая активность"
                          : `${p.growth}% к вчера`}
                      </small>
                    </td>
                    <td>
                      <Badge
                        kind={
                          c.status === "Решено"
                            ? "positive"
                            : c.status === "В работе"
                              ? "blue"
                              : "neutral"
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                  </>
                )}
                <td>
                  {compact ? (
                    <Badge kind={p.label}>{priorityLabels[p.label]}</Badge>
                  ) : (
                    <ArrowRight size={14} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!list.length && <Empty />}
    </div>
  );
}
