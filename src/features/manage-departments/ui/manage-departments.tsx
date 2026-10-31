"use client";
import { type Department } from "@/entities/department";
import { type User } from "@/entities/session";
import { type Action, type Notify } from "@/shared/api";
import { useState } from "react";
import { Building2, Settings2 } from "lucide-react";
import { Button } from "@/shared/ui";
export function ManageDepartments({
  directory,
  user,
  busy,
  action,
  notify,
}: {
  directory: Department[];
  user: User;
  busy: boolean;
  action: Action;
  notify: Notify;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [topics, setTopics] = useState("");
  const [responsible, setResponsible] = useState("");
  return (
    <>
      <div className="department-tags">
        {directory.map((d) => (
          <button
            key={d.id}
            disabled={user.role !== "admin"}
            onClick={() => {
              setEditing(d.id);
              setTopics(d.topics);
              setResponsible(d.responsible);
            }}
          >
            <Building2 size={14} />
            {d.name}
            {user.role === "admin" && <Settings2 size={11} />}
          </button>
        ))}
      </div>
      {editing && (
        <div className="directory-edit">
          <h3>{directory.find((d) => d.id === editing)?.name}</h3>
          <label className="field-label">
            Тематики и правила маршрутизации
            <textarea
              rows={3}
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
            />
          </label>
          <label className="field-label">
            Ответственная должность / отдел
            <input
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Например: дежурный специалист"
            />
          </label>
          <Button
            variant="default"
            disabled={busy || topics.length < 3}
            onClick={async () => {
              const r = await action({
                action: "department",
                id: editing,
                topics,
                responsible,
              });
              if (r) {
                notify("Справочник обновлён");
                setEditing(null);
              }
            }}
          >
            Сохранить изменения
          </Button>
          <Button onClick={() => setEditing(null)}>Отмена</Button>
          <p className="body-copy">
            Тематические подсказки используются при следующем LIVE-анализе.
            Названия базовых сфер сохраняют сопоставимость с ТЗ.
          </p>
        </div>
      )}
    </>
  );
}
