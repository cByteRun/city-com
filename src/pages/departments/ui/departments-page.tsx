"use client";
import { t, useLocale } from "@/shared/i18n";

import {
  Building2,
  BarChart3,
  Clock,
  CheckCheck,
  ArrowRight,
} from "lucide-react";
import { Panel, Empty } from "@/shared/ui";
import { WorkloadChart, DepartmentSentiment } from "@/widgets/analytics-charts";
import { type State } from "@/entities/workspace";
import { type Item } from "@/entities/feedback";
import { type Cluster, averageAssignment, priority } from "@/entities/issue";
import { type Filters } from "@/features/filter-feedback";
import { kpi } from "@/shared/ui";
import { pct } from "@/shared/lib/format";
export function DepartmentsPage({
  state,
  items,
  clusters,
  go,
  resolved,
  byDepartment,
}: {
  state: State;
  items: Item[];
  clusters: Cluster[];
  go: (view: string, patch?: Partial<Filters>) => void;
  resolved: number;
  byDepartment: {
    name: string;
    total: number;
    negative: number;
    neutral: number;
    positive: number;
  }[];
}) {
  const locale = useLocale();
  return (
    <>
      <div className="kpi-grid four">
        {t(
          kpi(
            "Подразделений с обращениями",
            byDepartment.length,
            "В выбранном периоде",
            <Building2 size={18} />,
          ),
        )}
        {t(
          kpi(
            "Наибольшая нагрузка",
            byDepartment[0]?.total || 0,
            byDepartment[0]?.name || "Нет данных",
            <BarChart3 size={18} />,
            () =>
              byDepartment[0] &&
              go("feed", { department: byDepartment[0].name }),
          ),
        )}
        {t(
          kpi(
            "Среднее время передачи",
            averageAssignment(clusters, locale),
            "От публикации до назначения",
            <Clock size={18} />,
          ),
        )}
        {t(
          kpi(
            "Доля решённых",
            `${pct(resolved, items.length)}%`,
            t("{0} обращений", [resolved]),
            <CheckCheck size={18} />,
          ),
        )}
      </div>
      <div className="dashboard-grid">
        <Panel
          title={t("Нагрузка по подразделениям")}
          sub={t("Нажмите на столбец, чтобы открыть обращения")}
        >
          <WorkloadChart
            data={byDepartment}
            onSelect={(department) => go("feed", { department })}
          />
        </Panel>
        <Panel
          title={t("Тональность по подразделениям")}
          sub={t("Доли позитивных, нейтральных и негативных сигналов")}
        >
          <DepartmentSentiment data={byDepartment} />
        </Panel>
      </div>
      <Panel
        title={t("Результаты работы подразделений")}
        sub={t(
          "Рейтинг по нагрузке · показатели рассчитаны по текущим фильтрам",
        )}
      >
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("Подразделение")}</th>
                <th>{t("Обращения")}</th>
                <th>{t("Негатив")}</th>
                <th>{t("Высокий приоритет")}</th>
                <th>{t("Время передачи")}</th>
                <th>{t("Решено")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {byDepartment.map((d) => {
                const list = clusters.filter((c) => c.department === d.name);
                const depItems = items.filter((i) => i.department === d.name);
                return (
                  <tr
                    key={d.name}
                    onClick={() => go("feed", { department: d.name })}
                  >
                    <td className="issue-name">
                      <strong>{t(d.name)}</strong>
                    </td>
                    <td>{t(d.total)}</td>
                    <td>{t(pct(d.negative, d.total))}%</td>
                    <td>
                      {t(
                        depItems.filter((i) =>
                          list.some(
                            (c) =>
                              c.id === i.clusterId &&
                              priority(c, state.items).label === "high",
                          ),
                        ).length,
                      )}
                    </td>
                    <td>{t(averageAssignment(list, locale))}</td>
                    <td>
                      {t(
                        pct(
                          depItems.filter((i) =>
                            list.some(
                              (c) =>
                                c.id === i.clusterId &&
                                ["Решено", "Закрыто"].includes(c.status),
                            ),
                          ).length,
                          d.total,
                        ),
                      )}
                      %
                    </td>
                    <td>
                      <ArrowRight size={14} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!byDepartment.length && <Empty />}
      </Panel>
    </>
  );
}
