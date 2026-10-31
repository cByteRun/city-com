"use client";
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
  return (
    <>
      <div className="kpi-grid four">
        {kpi(
          "Подразделений с обращениями",
          byDepartment.length,
          "В выбранном периоде",
          <Building2 size={18} />,
        )}
        {kpi(
          "Наибольшая нагрузка",
          byDepartment[0]?.total || 0,
          byDepartment[0]?.name || "Нет данных",
          <BarChart3 size={18} />,
          () =>
            byDepartment[0] && go("feed", { department: byDepartment[0].name }),
        )}
        {kpi(
          "Среднее время передачи",
          averageAssignment(clusters),
          "От публикации до назначения",
          <Clock size={18} />,
        )}
        {kpi(
          "Доля решённых",
          `${pct(resolved, items.length)}%`,
          `${resolved} обращений`,
          <CheckCheck size={18} />,
        )}
      </div>
      <div className="dashboard-grid">
        <Panel
          title="Нагрузка по подразделениям"
          sub="Нажмите на столбец, чтобы открыть обращения"
        >
          <WorkloadChart
            data={byDepartment}
            onSelect={(department) => go("feed", { department })}
          />
        </Panel>
        <Panel
          title="Тональность по подразделениям"
          sub="Доли позитивных, нейтральных и негативных сигналов"
        >
          <DepartmentSentiment data={byDepartment} />
        </Panel>
      </div>
      <Panel
        title="Результаты работы подразделений"
        sub="Рейтинг по нагрузке · показатели рассчитаны по текущим фильтрам"
      >
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Подразделение</th>
                <th>Обращения</th>
                <th>Негатив</th>
                <th>Высокий приоритет</th>
                <th>Время передачи</th>
                <th>Решено</th>
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
                      <strong>{d.name}</strong>
                    </td>
                    <td>{d.total}</td>
                    <td>{pct(d.negative, d.total)}%</td>
                    <td>
                      {
                        depItems.filter((i) =>
                          list.some(
                            (c) =>
                              c.id === i.clusterId &&
                              priority(c, state.items).label === "high",
                          ),
                        ).length
                      }
                    </td>
                    <td>{averageAssignment(list)}</td>
                    <td>
                      {pct(
                        depItems.filter((i) =>
                          list.some(
                            (c) =>
                              c.id === i.clusterId &&
                              ["Решено", "Закрыто"].includes(c.status),
                          ),
                        ).length,
                        d.total,
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
