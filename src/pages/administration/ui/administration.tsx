"use client";
import { ManageDepartments } from "@/features/manage-departments";
import { Panel, Badge, Button, Empty } from "@/shared/ui";
import { ShieldCheck } from "lucide-react";
import { type State } from "@/entities/workspace";
import { type User, roleLabels } from "@/entities/session";
import { type Action } from "@/shared/api";

import { date } from "@/shared/lib/format";
export function SettingsView({
  state,
  user,
  onLogin,
  busy,
  action,
  notify,
}: {
  state: State;
  user: User;
  onLogin: () => void;
  busy: boolean;
  action: Action;
  notify: (text: string, error?: boolean) => void;
}) {
  return (
    <>
      <div className="two-columns">
        <Panel title="Текущий доступ" sub="Права проверяются в серверных API">
          <div className="access-card">
            <span className="avatar large">АК</span>
            <div>
              <strong>{roleLabels[user.role]}</strong>
              <p>
                {user.role === "department"
                  ? `Сфера: ${user.department}`
                  : "Городское рабочее пространство"}
              </p>
              <Badge kind={user.workspace === "demo" ? "purple" : "positive"}>
                {user.workspace.toUpperCase()}
              </Badge>
            </div>
          </div>
          <Button onClick={onLogin}>
            <ShieldCheck size={14} /> Сменить роль / войти
          </Button>
        </Panel>
        <Panel title="Защита данных" sub="Минимизация на всех этапах обработки">
          <div className="checklist compact">
            {[
              "ИИН, телефоны и email маскируются до анализа",
              "Тексты Direct доступны только администратору и аналитику",
              "Приватные данные исключены из публичного экспорта",
              "Доступ к Direct и изменения пишутся в аудит",
            ].map((s) => (
              <div key={s}>
                <ShieldCheck size={14} />
                {s}
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel
        title="Справочник подразделений"
        sub="Базовые сферы ответственности по техническому заданию"
      >
        <ManageDepartments
          directory={state.directory}
          user={user}
          busy={busy}
          action={action}
          notify={notify}
        />
      </Panel>
      <Panel
        title="Журнал действий"
        sub="Назначения, модерация, сбор, экспорт и доступ к Direct"
      >
        {user.role === "admin" ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Пользователь</th>
                  <th>Действие</th>
                  <th>Запись</th>
                </tr>
              </thead>
              <tbody>
                {state.audit.slice(0, 50).map((a) => (
                  <tr key={a.id}>
                    <td>{date(a.at)}</td>
                    <td>{a.actor}</td>
                    <td>{a.action}</td>
                    <td className="mono">{a.target.slice(0, 12)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Журнал доступен администратору"
            text="Для просмотра аудита требуется соответствующая роль."
          />
        )}
      </Panel>
    </>
  );
}
