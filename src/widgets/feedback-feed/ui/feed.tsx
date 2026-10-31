"use client";
import { Select, Empty, Button, Panel, Badge } from "@/shared/ui";
import { ChevronLeft, ChevronRight, LockKeyhole } from "lucide-react";
import { type Item, sentimentLabels } from "@/entities/feedback";
import { type State } from "@/entities/workspace";
import { useState, useEffect } from "react";
import { type Cluster } from "@/entities/issue";
import { date } from "@/shared/lib/format";
export function Feed({
  items,
  state,
  onSelect,
  nested = false,
}: {
  items: Item[];
  state: State;
  onSelect: (id: string) => void;
  nested?: boolean;
}) {
  const [sort, setSort] = useState("new");
  const [group, setGroup] = useState("");
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [items, sort, group]);
  const sorted = [...items].sort((a, b) =>
    sort === "confidence"
      ? a.confidence - b.confidence
      : sort === "old"
        ? Date.parse(a.publishedAt) - Date.parse(b.publishedAt)
        : Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
  if (group) sorted.sort((a, b) => groupValue(a).localeCompare(groupValue(b)));
  const pages = Math.ceil(sorted.length / 12);
  const list = sorted.slice(index * 12, (index + 1) * 12);
  let last = "";
  const content = (
    <>
      <div className="table-toolbar">
        <div>
          <strong>{items.length} обращений</strong>
          <span> · RU / KZ</span>
        </div>
        <div>
          <Select
            label="Группировка"
            value={group}
            onChange={setGroup}
            options={[
              { value: "department", label: "По подразделению" },
              { value: "clusterId", label: "По проблеме" },
              { value: "sentiment", label: "По тональности" },
              { value: "date", label: "По дате" },
            ]}
          />
          <Select
            label="Сортировка"
            value={sort}
            onChange={setSort}
            options={[
              { value: "new", label: "Сначала новые" },
              { value: "old", label: "Сначала ранние" },
              { value: "confidence", label: "По уверенности" },
            ]}
          />
        </div>
      </div>
      <div className="table-scroll">
        <table className="data-table feed-table">
          <thead>
            <tr>
              <th>Дата / источник</th>
              <th>Обращение</th>
              <th>Подразделение</th>
              <th>Тональность</th>
              <th>Уверенность</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((item) => {
              const c = state.clusters.find((c) => c.id === item.clusterId);
              const value = group ? groupValue(item) : "";
              const heading = value !== last;
              last = value;
              return (
                <FeedRow
                  key={item.id}
                  item={item}
                  cluster={c}
                  source={
                    state.sources.find((s) => s.id === item.sourceId)?.name ||
                    ""
                  }
                  onSelect={() => onSelect(item.id)}
                  group={heading ? value : ""}
                />
              );
            })}
          </tbody>
        </table>
        {!items.length && <Empty />}
      </div>
      <div className="pagination">
        <span>
          {items.length
            ? `${index * 12 + 1}–${Math.min((index + 1) * 12, items.length)} из ${items.length}`
            : "0 обращений"}
        </span>
        <div>
          <Button
            size="sm"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            <ChevronLeft size={14} /> Назад
          </Button>
          <span>
            {pages ? index + 1 : 0} / {pages}
          </span>
          <Button
            size="sm"
            disabled={index + 1 >= pages}
            onClick={() => setIndex((i) => i + 1)}
          >
            Далее <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </>
  );
  function groupValue(i: Item) {
    if (group === "date") return i.publishedAt.slice(0, 10);
    if (group === "department") return i.department;
    if (group === "sentiment") return sentimentLabels[i.sentiment];
    if (group === "clusterId")
      return state.clusters.find((c) => c.id === i.clusterId)?.title || "";
    return "";
  }
  return nested ? (
    <>{content}</>
  ) : (
    <Panel
      title="Все обращения"
      sub="Классификация, тональность и оригинальные публикации"
    >
      {content}
    </Panel>
  );
}
function FeedRow({
  item,
  cluster,
  source,
  onSelect,
  group,
}: {
  item: Item;
  cluster?: Cluster;
  source: string;
  onSelect: () => void;
  group: string;
}) {
  return (
    <>
      {group && (
        <tr className="group-row">
          <td colSpan={7}>{group}</td>
        </tr>
      )}
      <tr
        onClick={onSelect}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSelect();
        }}
        aria-label={`Обращение ${item.id}`}
      >
        <td className="date-cell">
          <strong>{date(item.publishedAt)}</strong>
          <small>
            {item.private && <LockKeyhole size={10} />} {source}
          </small>
        </td>
        <td className="item-text">
          <p>
            {item.private ? "Приватное обращение · только агрегаты" : item.text}
          </p>
          <small>
            <span className="language-tag">
              {item.language === "kk" ? "KZ" : "RU"}
            </span>
            {item.topic}
          </small>
        </td>
        <td>
          {item.department}
          <small>{item.district}</small>
        </td>
        <td>
          <Badge kind={item.sentiment}>{sentimentLabels[item.sentiment]}</Badge>
        </td>
        <td>
          <span
            className={item.confidence < 0.6 ? "confidence-low" : "confidence"}
          >
            {Math.round(item.confidence * 100)}%
          </span>
          <small>{item.reviewed ? "Подтверждено" : "Оценка модели"}</small>
        </td>
        <td>
          <Badge kind={cluster?.status === "Решено" ? "positive" : "neutral"}>
            {cluster?.status || "Новое"}
          </Badge>
        </td>
        <td>
          <ChevronRight size={14} />
        </td>
      </tr>
    </>
  );
}
