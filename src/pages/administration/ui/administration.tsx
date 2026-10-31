"use client";
import { t, useLocale, formatAudit } from "@/shared/i18n";

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
  useLocale();
  return (
    <>
      <div className="two-columns">
        <Panel
          title={t("Текущий доступ")}
          sub={t("Права проверяются в серверных API")}
        >
          <div className="access-card">
            <span className="avatar large">{t("АК")}</span>
            <div>
              <strong>{t(roleLabels[user.role])}</strong>
              <p>
                {t(
                  user.role === "department"
                    ? t("Сфера: {0}", [user.department])
                    : "Городское рабочее пространство",
                )}
              </p>
              <Badge kind={user.workspace === "demo" ? "purple" : "positive"}>
                {t(user.workspace.toUpperCase())}
              </Badge>
            </div>
          </div>
          <Button onClick={onLogin}>
            <ShieldCheck size={14} /> {t("Сменить роль / войти")}
          </Button>
        </Panel>
        <Panel
          title={t("Защита данных")}
          sub={t("Минимизация на всех этапах обработки")}
        >
          <div className="checklist compact">
            {[
              "ИИН, телефоны и email маскируются до анализа",
              "Тексты Direct доступны только администратору и аналитику",
              "Приватные данные исключены из публичного экспорта",
              "Доступ к Direct и изменения пишутся в аудит",
            ].map((s) => (
              <div key={s}>
                <ShieldCheck size={14} />
                {t(s)}
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel
        title={t("Справочник подразделений")}
        sub={t("Базовые сферы ответственности по техническому заданию")}
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
        title={t("Журнал действий")}
        sub={t("Назначения, модерация, сбор, экспорт и доступ к Direct")}
      >
        {user.role === "admin" ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("Время")}</th>
                  <th>{t("Пользователь")}</th>
                  <th>{t("Действие")}</th>
                  <th>{t("Запись")}</th>
                </tr>
              </thead>
              <tbody>
                {state.audit.slice(0, 50).map((a) => (
                  <tr key={a.id}>
                    <td>{t(date(a.at))}</td>
                    <td>{t(a.actor)}</td>
                    <td>{formatAudit(a.action)}</td>
                    <td className="mono">{t(a.target.slice(0, 12))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={t("Журнал доступен администратору")}
            text="Для просмотра аудита требуется соответствующая роль."
          />
        )}
      </Panel>
    </>
  );
}
