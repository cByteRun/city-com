"use client";
import { t, useLocale } from "@/shared/i18n";

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
  useLocale();
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
          <strong>
            {t(items.length)} {t("обращений")}
          </strong>
          <span> · RU / KZ</span>
        </div>
        <div>
          <Select
            label={t("Группировка")}
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
            label={t("Сортировка")}
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
              <th>{t("Дата / источник")}</th>
              <th>{t("Обращение")}</th>
              <th>{t("Подразделение")}</th>
              <th>{t("Тональность")}</th>
              <th>{t("Уверенность")}</th>
              <th>{t("Статус")}</th>
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
          {t(
            items.length
              ? t("{0}–{1} из {2}", [
                  index * 12 + 1,
                  Math.min((index + 1) * 12, items.length),
                  items.length,
                ])
              : "0 обращений",
          )}
        </span>
        <div>
          <Button
            size="sm"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
          >
            <ChevronLeft size={14} /> {t("Назад")}
          </Button>
          <span>
            {t(pages ? index + 1 : 0)} / {t(pages)}
          </span>
          <Button
            size="sm"
            disabled={index + 1 >= pages}
            onClick={() => setIndex((i) => i + 1)}
          >
            {t("Далее")} <ChevronRight size={14} />
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
    <>{t(content)}</>
  ) : (
    <Panel
      title={t("Все обращения")}
      sub={t("Классификация, тональность и оригинальные публикации")}
    >
      {t(content)}
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
  useLocale();
  return (
    <>
      {group && (
        <tr className="group-row">
          <td colSpan={7}>{t(group)}</td>
        </tr>
      )}
      <tr
        onClick={onSelect}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSelect();
        }}
        aria-label={t("Обращение {0}", [item.id])}
      >
        <td className="date-cell">
          <strong>{t(date(item.publishedAt))}</strong>
          <small>
            {item.private && <LockKeyhole size={10} />} {t(source)}
          </small>
        </td>
        <td className="item-text">
          <p>
            {item.private
              ? t("Приватное обращение · только агрегаты")
              : item.text}
          </p>
          <small>
            <span className="language-tag">
              {t(item.language === "kk" ? "KZ" : "RU")}
            </span>
            {t(item.topic)}
          </small>
        </td>
        <td>
          {t(item.department)}
          <small>{t(item.district)}</small>
        </td>
        <td>
          <Badge kind={item.sentiment}>
            {t(sentimentLabels[item.sentiment])}
          </Badge>
        </td>
        <td>
          <span
            className={item.confidence < 0.6 ? "confidence-low" : "confidence"}
          >
            {t(Math.round(item.confidence * 100))}%
          </span>
          <small>{t(item.reviewed ? "Подтверждено" : "Оценка модели")}</small>
        </td>
        <td>
          <Badge kind={cluster?.status === "Решено" ? "positive" : "neutral"}>
            {t(cluster?.status || "Новое")}
          </Badge>
        </td>
        <td>
          <ChevronRight size={14} />
        </td>
      </tr>
    </>
  );
}
