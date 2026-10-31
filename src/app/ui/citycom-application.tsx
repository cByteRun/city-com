"use client";
import { t, useLocale } from "@/shared/i18n";

import { useCitycomWorkspace } from "../model/use-citycom-workspace";
import { WorkspaceAccess } from "@/features/workspace-access";
import { ApplicationShell } from "@/widgets/application-shell";
import { ExportControls } from "@/features/export-report";
import { GlobalFilters } from "@/features/filter-feedback/client";
import {
  Layers3,
  Loader2,
  Sparkles,
  RefreshCw,
  BookOpen,
  TriangleAlert,
  Check,
  X,
  LockKeyhole,
} from "lucide-react";
import { Button, Empty, Sheet } from "@/shared/ui";
import { OverviewPage } from "@/pages/overview";
import { DepartmentsPage } from "@/pages/departments";
import { IssuesPage } from "@/pages/issues";
import { FeedPage } from "@/pages/feed";
import { ProcessingPage } from "@/pages/processing";
import { ModerationPage } from "@/pages/moderation";
import { SourcesPage } from "@/pages/sources";
import { QualityView } from "@/pages/quality";
import { SettingsView } from "@/pages/administration";
import { AssistantPage } from "@/pages/assistant";
import { Detail } from "@/widgets/feedback-details";

import { date } from "@/shared/lib/format";

import { navigation, titles } from "../config/navigation";
export function CityApp() {
  useLocale();
  const {
    user,
    setUser,
    state,
    setState,
    loading,
    busy,
    page,
    filters,
    setFilters,
    selected,
    setSelected,
    notice,
    setNotice,
    mobile,
    setMobile,
    dark,
    setDark,
    login,
    setLogin,
    loginWorkspace,
    setLoginWorkspace,
    help,
    setHelp,
    confirmReset,
    setConfirmReset,
    loadMs,
    notify,
    load,
    enter,
    action,
    go,
    updateFilter,
    items,
    clusters,
    previousCount,
    negative,
    positive,
    neutral,
    high,
    resolved,
    review,
    trend,
    byDepartment,
    allowed,
  } = useCitycomWorkspace();
  if (loading)
    return (
      <div className="boot">
        <div className="boot-logo">
          <Layers3 size={28} />
        </div>
        <h1>
          citycom<span>.</span>
        </h1>
        <p>
          <Loader2 size={15} className="spin" />{" "}
          {t("Загружаем городскую аналитику")}
        </p>
      </div>
    );
  return (
    <div className="app-shell">
      <ApplicationShell
        mobile={mobile}
        setMobile={setMobile}
        page={page}
        title={t(titles[page]?.[0])}
        user={user}
        reviewCount={review.length}
        dark={dark}
        setDark={setDark}
        go={go}
        enter={enter}
        setHelp={setHelp}
        setLoginWorkspace={setLoginWorkspace}
        setLogin={setLogin}
        navigation={navigation}
      >
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span />{" "}
              {t(
                ["overview", "departments", "issues"].includes(page)
                  ? "ОБЗОР ГОРОДА"
                  : "ГОРОДСКАЯ ОБРАТНАЯ СВЯЗЬ",
              )}{" "}
              · PAVLODAR
            </div>
            <h1>{t(titles[page]?.[0])}</h1>
            <p>{t(titles[page]?.[1])}</p>
          </div>
          <div className="heading-actions">
            <Button onClick={() => go("processing")}>
              <Sparkles size={14} /> {t("Новый анализ")}
            </Button>
            <ExportControls query={{ ...filters }} />
          </div>
        </div>
        <div
          className={`workspace-banner ${user?.workspace === "live" ? "live-banner" : ""}`}
        >
          <Layers3 size={18} />
          <strong>
            {t(
              user?.workspace === "demo" ? "DEMO WORKSPACE" : "LIVE WORKSPACE",
            )}
          </strong>
          <span>
            {t(
              user?.workspace === "demo"
                ? "Синтетические данные для демонстрации. Реальные источники не подключены."
                : t(
                    "{0} сохранённых обращений. Сбор работает только для разрешённых подключений.",
                    [state?.items.length || 0],
                  ),
            )}
          </span>
          {user?.workspace === "demo" && user.role === "admin" ? (
            <button onClick={() => setConfirmReset(true)}>
              <RefreshCw size={12} /> {t("Сброс")}
            </button>
          ) : (
            <button onClick={load}>
              <RefreshCw size={12} /> {t("Обновить")}
            </button>
          )}
        </div>
        {state && (
          <>
            <GlobalFilters
              state={state}
              filters={filters}
              setFilters={setFilters}
              updateFilter={updateFilter}
              workspace={user!.workspace}
              notify={notify}
            />
            {page === "overview" && (
              <OverviewPage
                state={state!}
                items={items}
                clusters={clusters}
                go={go}
                setSelected={setSelected}
                previousCount={previousCount}
                negative={negative}
                positive={positive}
                neutral={neutral}
                high={high}
                resolved={resolved}
                trend={trend}
              />
            )}
            {page === "departments" && (
              <DepartmentsPage
                state={state!}
                items={items}
                clusters={clusters}
                go={go}
                resolved={resolved}
                byDepartment={byDepartment}
              />
            )}
            {page === "issues" && (
              <IssuesPage
                state={state!}
                items={items}
                clusters={clusters}
                updateFilter={updateFilter}
                setSelected={setSelected}
              />
            )}
            {page === "feed" && (
              <FeedPage
                items={items}
                state={state}
                onSelect={(id) => setSelected({ kind: "item", id })}
              />
            )}
            {page === "processing" && (
              <ProcessingPage
                user={user!}
                busy={busy}
                action={action}
                notify={notify}
                state={state}
                onFeed={() => go("feed")}
              />
            )}
            {page === "moderation" && (
              <ModerationPage
                state={state!}
                items={items}
                review={review}
                setSelected={setSelected}
              />
            )}
            {page === "sources" && (
              <SourcesPage
                state={state!}
                user={user!}
                busy={busy}
                action={action}
                notify={notify}
                items={items}
                go={go}
              />
            )}
            {page === "quality" && (
              <QualityView
                state={state}
                busy={busy}
                canEdit={!!allowed}
                action={action}
                loadMs={loadMs}
              />
            )}
            {page === "settings" && (
              <SettingsView
                state={state}
                user={user!}
                busy={busy}
                action={action}
                notify={notify}
                onLogin={() => {
                  setLoginWorkspace(user?.workspace || "demo");
                  setLogin(true);
                }}
              />
            )}
            {page === "chat" && (
              <AssistantPage
                items={items.filter((i) => !i.private)}
                clusters={clusters}
                onSelect={(id) => setSelected({ kind: "item", id })}
                workspace={user!.workspace}
              />
            )}
          </>
        )}
        {!user && (
          <Empty
            title={t("Войдите в рабочее пространство")}
            action={
              <Button onClick={() => enter("demo", "admin")}>
                {t("Открыть DEMO")}
              </Button>
            }
          />
        )}
        <footer>
          <span>CityCom / AI City Intelligence</span>
          <span>
            <span className="status-dot" />{" "}
            {t(
              state
                ? t("Данные на {0}", [date(state.updatedAt)])
                : "Нет данных",
            )}{" "}
            {t("· Решение принимает сотрудник")}
          </span>
          <button onClick={() => setHelp(true)}>
            <BookOpen size={12} /> {t("Инструкция")}
          </button>
        </footer>
      </ApplicationShell>
      {notice && (
        <div
          className={`toast ${notice.error ? "toast-error" : ""}`}
          role="status"
        >
          {notice.error ? <TriangleAlert size={17} /> : <Check size={17} />}
          <span>{t(notice.text)}</span>
          <button
            aria-label={t("Закрыть уведомление")}
            onClick={() => setNotice(null)}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {busy && (
        <div className="busy-indicator">
          <Loader2 size={14} className="spin" /> {t("Выполняется операция…")}
        </div>
      )}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={t(
          selected?.kind === "cluster"
            ? "Городская проблема"
            : "Карточка обращения",
        )}
      >
        {selected && state && user && (
          <Detail
            key={selected.id}
            selected={selected}
            state={state}
            user={user}
            busy={busy}
            action={action}
            notify={notify}
            onSelect={setSelected}
            onClose={() => setSelected(null)}
          />
        )}
      </Sheet>
      <WorkspaceAccess
        open={login}
        onOpenChange={setLogin}
        workspace={loginWorkspace}
        onWorkspaceChange={setLoginWorkspace}
        user={user}
        busy={busy}
        onEnter={enter}
        onLogout={() => {
          setUser(null);
          setState(null);
        }}
      />
      <Sheet
        open={help}
        onOpenChange={setHelp}
        title={t("Как работать с CityCom")}
      >
        <div className="sheet-body guide">
          <h3>{t("От сигнала к решению")}</h3>
          <ol>
            <li>
              <strong>{t("Проверьте режим.")}</strong>{" "}
              {t(
                "DEMO содержит синтетические сообщения. LIVE использует только подключённые разрешённые источники.",
              )}
            </li>
            <li>
              <strong>{t("Выберите период и сферу.")}</strong>{" "}
              {t("Общие фильтры действуют на всех экранах и при экспорте.")}
            </li>
            <li>
              <strong>{t("Откройте проблему.")}</strong>{" "}
              {t("Сверьте исходные обращения, место и факторы приоритета.")}
            </li>
            <li>
              <strong>{t("Подтвердите назначение.")}</strong>{" "}
              {t(
                "Выберите подразделение и статус «Передано», затем «В работе» и «Решено».",
              )}
            </li>
            <li>
              <strong>{t("Проверьте сомнительные решения.")}</strong>{" "}
              {t(
                "В «Модерации» исправьте подразделение или тональность и добавьте объяснение.",
              )}
            </li>
            <li>
              <strong>{t("Выгрузите результат.")}</strong>{" "}
              {t(
                "CSV и XLSX скачиваются сразу. PDF скачивается как готовый отчёт с кириллицей.",
              )}
            </li>
          </ol>
          <div className="info-note">
            <LockKeyhole size={16} />
            <p>
              {t(
                "Direct виден в аналитике только в агрегатах. Обезличенный текст доступен администратору и аналитику с записью в журнал.",
              )}
            </p>
          </div>
        </div>
      </Sheet>
      <Sheet
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t("Сбросить демонстрационные данные?")}
      >
        <div className="sheet-body">
          <p className="body-copy">
            {t(
              "Изменения, импорт и назначения в DEMO будут заменены исходным демонстрационным набором.",
            )}
          </p>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              await action({ action: "reset" });
              setConfirmReset(false);
              setSelected(null);
              notify("Демонстрационный набор восстановлен");
            }}
          >
            {t("Сбросить DEMO")}
          </Button>
          <Button onClick={() => setConfirmReset(false)}>{t("Отмена")}</Button>
        </div>
      </Sheet>
    </div>
  );
}
