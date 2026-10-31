"use client";
import { type State, type Workspace } from "@/entities/workspace";
import { type Filters, defaultFilters } from "../model/types";
import { type Notify } from "@/shared/api";
import { Filter, Search } from "lucide-react";
import { Select } from "@/shared/ui";
import { departments, districts } from "@/entities/department";
import { sentimentLabels } from "@/entities/feedback";
import { priority, priorityLabels } from "@/entities/issue";
export function GlobalFilters({
  state,
  filters,
  setFilters,
  updateFilter,
  workspace,
  notify,
}: {
  state: State;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  updateFilter: (key: keyof Filters, value: string) => void;
  workspace: Workspace;
  notify: Notify;
}) {
  return (
    <section className="filter-panel">
      <div className="filter-title">
        <Filter size={12} />
        <strong>ОБЩИЕ ФИЛЬТРЫ</strong>
        <span>Сквозные между экранами</span>
        <div className="filter-saved">
          <button
            onClick={() => {
              localStorage.setItem(
                `citycom-filters-${workspace}`,
                JSON.stringify(filters),
              );
              notify("Набор фильтров сохранён");
            }}
          >
            Сохранить
          </button>
          <button
            onClick={() => {
              const v = localStorage.getItem(`citycom-filters-${workspace}`);
              if (v) {
                setFilters({ ...defaultFilters, ...JSON.parse(v) });
                notify("Сохранённые фильтры применены");
              } else notify("Сохранённых фильтров пока нет");
            }}
          >
            Мои фильтры
          </button>
        </div>
      </div>
      <div className="filters">
        <Select
          label="Период"
          value={filters.period}
          onChange={(v) => updateFilter("period", v || "30")}
          options={[
            { value: "1", label: "24 часа" },
            { value: "7", label: "7 дней" },
            { value: "30", label: "30 дней" },
            { value: "all", label: "За всё время" },
          ]}
        />
        <Select
          label="Все источники"
          value={filters.source}
          onChange={(v) => updateFilter("source", v)}
          options={state.sources.map((s) => ({
            value: s.id,
            label: s.name,
          }))}
        />
        <Select
          label="Все проблемы"
          value={filters.problem}
          onChange={(v) => updateFilter("problem", v)}
          options={state.clusters.map((c) => ({
            value: c.id,
            label: c.title,
          }))}
        />
        <Select
          label="Все подразделения"
          value={filters.department}
          onChange={(v) => updateFilter("department", v)}
          options={[...departments]}
        />
        <Select
          label="Все районы"
          value={filters.district}
          onChange={(v) => updateFilter("district", v)}
          options={districts}
        />
        <Select
          label="Любая тональность"
          value={filters.sentiment}
          onChange={(v) => updateFilter("sentiment", v)}
          options={Object.entries(sentimentLabels).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <div className="filter-break" />
        <Select
          label="Любой приоритет"
          value={filters.priority}
          onChange={(v) => updateFilter("priority", v)}
          options={Object.entries(priorityLabels).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <Select
          label="Любой статус"
          value={filters.status}
          onChange={(v) => updateFilter("status", v)}
          options={["Новое", "Передано", "В работе", "Решено", "Закрыто"]}
        />
        <div className="filter-spacer" />
        <label className="search-field">
          <Search size={13} />
          <input
            aria-label="Поиск по обращениям"
            placeholder="Поиск..."
            value={filters.q}
            onChange={(e) => updateFilter("q", e.target.value)}
          />
        </label>
        <button
          className="text-reset"
          onClick={() => setFilters(defaultFilters)}
        >
          Сбросить
        </button>
      </div>
    </section>
  );
}
