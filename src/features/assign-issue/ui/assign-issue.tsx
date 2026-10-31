"use client";
import { t, useLocale } from "@/shared/i18n";

import { type Cluster, type Status } from "@/entities/issue";
import { type User } from "@/entities/session";
import { type Action, type Notify } from "@/shared/api";
import { useState } from "react";
import { departments } from "@/entities/department";
import { Button } from "@/shared/ui";
import { Send } from "lucide-react";
import { date } from "@/shared/lib/format";
export function AssignIssue({
  cluster,
  user,
  busy,
  action,
  notify,
  onSaved,
}: {
  cluster: Cluster;
  user: User;
  busy: boolean;
  action: Action;
  notify: Notify;
  onSaved: (message: string) => void;
}) {
  useLocale();
  const [department, setDepartment] = useState(cluster.department);
  const [status, setStatus] = useState<Status>(cluster.status);
  const canEdit = user.role !== "viewer";
  return (
    <section className="assignment-form">
      <h3>{t("Решение сотрудника")}</h3>
      <label className="field-label">
        {t("Ответственное подразделение")}
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          disabled={!canEdit}
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
        {t("Статус")}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          disabled={!canEdit}
        >
          {["Новое", "Передано", "В работе", "Решено", "Закрыто"].map((s) => (
            <option key={s} value={s}>
              {t(s)}
            </option>
          ))}
        </select>
      </label>
      <Button
        variant="default"
        disabled={busy || !canEdit}
        onClick={async () => {
          const r = await action({
            action: "cluster",
            id: cluster.id,
            department,
            status,
          });
          if (r) {
            onSaved("Назначение и статус сохранены");
            notify("Назначение и статус сохранены");
          }
        }}
      >
        <Send size={14} /> {t("Подтвердить решение")}
      </Button>
      <small>{t("Новое → Передано → В работе → Решено → Закрыто")}</small>
      {cluster.assignedAt && (
        <small>
          {t("Передано:")} {t(date(cluster.assignedAt))}
        </small>
      )}
    </section>
  );
}
