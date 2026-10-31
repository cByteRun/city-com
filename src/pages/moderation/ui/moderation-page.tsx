"use client";
import { ShieldCheck, Check, Activity, Sparkles } from "lucide-react";
import { Panel, Empty } from "@/shared/ui";
import { Feed } from "@/widgets/feedback-feed";
import { type State } from "@/entities/workspace";
import { type Item } from "@/entities/feedback";
import { kpi } from "@/shared/ui";
import { pct } from "@/shared/lib/format";
export function ModerationPage({
  state,
  items,
  review,
  setSelected,
}: {
  state: State;
  items: Item[];
  review: Item[];
  setSelected: (
    selection: { kind: "item" | "cluster"; id: string } | null,
  ) => void;
}) {
  return (
    <>
      <div className="kpi-grid four">
        {kpi(
          "Требуют проверки",
          review.length,
          "Уверенность ниже 60%",
          <ShieldCheck size={18} />,
        )}
        {kpi(
          "Проверено оператором",
          items.filter((i) => i.reviewed).length,
          "Решение подтверждено человеком",
          <Check size={18} />,
        )}
        {kpi(
          "Доля ручной проверки",
          `${pct(review.length, items.length)}%`,
          "От текущей выборки",
          <Activity size={18} />,
        )}
        {kpi(
          "Порог уверенности",
          "0,60",
          "Самооценка модели требует валидации",
          <Sparkles size={18} />,
        )}
      </div>
      <Panel title="Очередь проверки" sub="Сначала неоднозначные обращения">
        {review.length ? (
          <Feed
            items={review.sort((a, b) => a.confidence - b.confidence)}
            state={state}
            onSelect={(id) => setSelected({ kind: "item", id })}
            nested
          />
        ) : (
          <Empty
            title="Очередь проверена"
            text="В текущей выборке нет обращений с низкой уверенностью."
          />
        )}
      </Panel>
    </>
  );
}
