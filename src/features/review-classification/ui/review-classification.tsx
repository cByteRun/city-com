"use client";
import { t, useLocale } from "@/shared/i18n";

import { type Item, sentimentLabels } from "@/entities/feedback";
import { type User } from "@/entities/session";
import { type Action, type Notify } from "@/shared/api";
import { useState } from "react";
import { departments } from "@/entities/department";
import { Button } from "@/shared/ui";
import { Check } from "lucide-react";
export function ReviewClassification({
  item,
  user,
  busy,
  action,
  notify,
  onSaved,
}: {
  item: Item;
  user: User;
  busy: boolean;
  action: Action;
  notify: Notify;
  onSaved: (message: string) => void;
}) {
  useLocale();
  const [department, setDepartment] = useState(item.department);
  const [sentiment, setSentiment] = useState(item.sentiment);
  const [reason, setReason] = useState("");
  return (
    <div className="review-form">
      <h3>{t("Проверка оператором")}</h3>
      <label className="field-label">
        {t("Подразделение")}
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          {departments
            .filter((d) => user.role !== "department" || d === user.department)
            .map((d) => (
              <option key={d} value={d}>
                {t(d)}
              </option>
            ))}
        </select>
      </label>
      <label className="field-label">
        {t("Тональность")}
        <select
          value={sentiment}
          onChange={(e) => setSentiment(e.target.value as Item["sentiment"])}
        >
          {Object.entries(sentimentLabels).map(([v, l]) => (
            <option key={v} value={v}>
              {t(l)}
            </option>
          ))}
        </select>
      </label>
      <label className="field-label">
        {t("Почему это решение верно?")}
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("Основание подтверждения или исправления")}
        />
      </label>
      <Button
        variant="default"
        disabled={busy || reason.length < 3}
        onClick={async () => {
          const r = await action({
            action: "review",
            id: item.id,
            department,
            sentiment,
            reason,
          });
          if (r) {
            onSaved("Классификация подтверждена и записана в журнал");
            notify("Классификация подтверждена и записана в журнал");
          }
        }}
      >
        <Check size={14} /> {t("Подтвердить классификацию")}
      </Button>
    </div>
  );
}
