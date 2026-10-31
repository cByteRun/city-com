"use client";
import { t, useLocale } from "@/shared/i18n";

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
  useLocale();
  return (
    <div className="table-scroll">
      <table className={compact ? "compact-table" : "data-table"}>
        <thead>
          <tr>
            {!compact && <th>{t("Приоритет")}</th>}
            <th>{t("Городская проблема")}</th>
            {!compact && <th>{t("Подразделение")}</th>}
            <th>{t("Сигналы")}</th>
            {compact && <th>{t("Статус")}</th>}
            {!compact && (
              <>
                <th>{t("За 24 ч.")}</th>
                <th>{t("Статус")}</th>
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
                aria-label={t("Открыть: {0}", [c.title])}
              >
                <td className={compact ? "issue-name" : "priority-cell"}>
                  {compact ? (
                    <div className="ranked">
                      <span className="rank">
                        {t(String(index + 1).padStart(2, "0"))}
                      </span>
                      <div>
                        <strong>{t(c.title)}</strong>
                        <small>
                          {t(c.department)} · {t(c.district)}
                        </small>
                      </div>
                    </div>
                  ) : (
                    <Badge kind={p.label}>{t(priorityLabels[p.label])}</Badge>
                  )}
                </td>
                {!compact && (
                  <td className="issue-name">
                    <strong>{t(c.title)}</strong>
                    <small>
                      {t(c.location || "Локация требует уточнения")} ·{" "}
                      {t(c.district)}
                    </small>
                  </td>
                )}
                {!compact && <td>{t(c.department)}</td>}
                <td>
                  <strong>{t(members.length)}</strong>
                  <small>
                    {t(p.independent)} {t("независимых")}
                  </small>
                </td>
                {compact && (
                  <td>
                    <Badge
                      kind={
                        c.status === "Решено" || c.status === "Закрыто"
                          ? "positive"
                          : c.status === "В работе"
                            ? "blue"
                            : "neutral"
                      }
                    >
                      {t(c.status)}
                    </Badge>
                  </td>
                )}
                {!compact && (
                  <>
                    <td>
                      <span className={p.recent ? "growth" : ""}>
                        +{t(p.recent)}
                      </span>
                      <small>
                        {t(
                          p.growth === null
                            ? "новая активность"
                            : t("{0}% к вчера", [p.growth]),
                        )}
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
                        {t(c.status)}
                      </Badge>
                    </td>
                  </>
                )}
                <td>
                  {compact ? (
                    <div className="compact-priority">
                      <Badge kind={p.label}>{t(priorityLabels[p.label])}</Badge>
                      <small>{t("{0}/100", [p.score])}</small>
                    </div>
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
