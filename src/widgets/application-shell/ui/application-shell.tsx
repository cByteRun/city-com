"use client";
import { t, useLocale, setLocale, type Locale } from "@/shared/i18n";

import { type ReactNode } from "react";
import { type User, type Role, roleLabels } from "@/entities/session";
import { type Workspace } from "@/entities/workspace";
import {
  Layers3,
  Building2,
  ChevronDown,
  Sparkles,
  Menu,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import { Badge } from "@/shared/ui";
import type { LucideIcon } from "lucide-react";
export function ApplicationShell({
  children,
  mobile,
  setMobile,
  page,
  title,
  user,
  reviewCount,
  dark,
  setDark,
  go,
  enter,
  setHelp,
  setLoginWorkspace,
  setLogin,
  navigation,
}: {
  children: ReactNode;
  mobile: boolean;
  setMobile: (v: boolean) => void;
  page: string;
  title: string;
  user: User | null;
  reviewCount: number;
  dark: boolean;
  setDark: React.Dispatch<React.SetStateAction<boolean>>;
  go: (view: string) => void;
  enter: (workspace: Workspace, role: Role) => void;
  setHelp: (v: boolean) => void;
  setLoginWorkspace: (workspace: Workspace) => void;
  setLogin: (v: boolean) => void;
  navigation: readonly {
    group: string;
    items: readonly (readonly [string, string, LucideIcon])[];
  }[];
}) {
  const locale = useLocale();
  return (
    <>
      <aside className={`sidebar ${mobile ? "sidebar-open" : ""}`}>
        <a
          className="brand"
          href="?view=overview"
          onClick={(e) => {
            e.preventDefault();
            go("overview");
          }}
        >
          <span className="brand-mark">
            <Layers3 size={28} strokeWidth={1.7} />
          </span>
          <span>
            <strong>
              citycom<span>.</span>
            </strong>
            <small>{t("CITY INTELLIGENCE")}</small>
          </span>
        </a>
        <button className="city-switch" onClick={() => setHelp(true)}>
          <span className="city-icon">
            <Building2 size={16} />
          </span>
          <span>
            <strong>{t("Павлодар")}</strong>
            <small>{t("Акимат города")}</small>
          </span>
          <ChevronDown size={13} />
        </button>
        <div className="workspace-label">{t("РАБОЧЕЕ ПРОСТРАНСТВО")}</div>
        <div className="workspace-switch">
          <button
            className={user?.workspace === "demo" ? "active" : ""}
            onClick={() => enter("demo", "admin")}
          >
            <Layers3 size={12} /> DEMO
          </button>
          <button
            className={user?.workspace === "live" ? "active" : ""}
            onClick={() => {
              if (user?.workspace !== "live") {
                setLoginWorkspace("live");
                setLogin(true);
              }
            }}
          >
            <span className="status-dot" /> LIVE
          </button>
        </div>
        <nav>
          {navigation.map((group) => (
            <div key={group.group} className="nav-group">
              <p>{t(group.group)}</p>
              {group.items.map(([id, label, Icon]) => (
                <button
                  key={id}
                  className={`nav-item ${page === id ? "active" : ""}`}
                  onClick={() => go(id)}
                >
                  <Icon size={15} />
                  <span>{t(label)}</span>
                  {id === "moderation" && reviewCount > 0 && (
                    <b>{t(reviewCount)}</b>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="usp">
            <Sparkles size={19} />
            <strong>{t("AI-assisted governance")}</strong>
            <p>
              {t("Обнаруживать раньше.")}
              <br />
              {t("Реагировать точнее.")}
            </p>
          </div>
          <div className="system-status">
            <span className="status-dot" />{" "}
            {t(
              user?.workspace === "demo"
                ? "Демонстрационный режим"
                : "Рабочее пространство LIVE",
            )}
            <span>v0.1</span>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="mobile-overlay"
          aria-label={t("Закрыть меню")}
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              aria-label={t("Открыть меню")}
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span>{t("Городская аналитика")}</span>
            <ChevronRight size={12} />
            <strong>{t(title)}</strong>
          </div>
          <div className="topbar-right">
            <label className="language-switch">
              <span className="sr-only">{t("Язык интерфейса")}</span>
              <select
                aria-label={t("Язык интерфейса")}
                value={locale}
                onChange={(event) => setLocale(event.target.value as Locale)}
              >
                <option value="en" lang="en">
                  EN
                </option>
                <option value="ru" lang="ru">
                  RU
                </option>
                <option value="kk" lang="kk">
                  KZ
                </option>
              </select>
            </label>
            <Badge kind={user?.workspace === "demo" ? "purple" : "positive"}>
              {t(user?.workspace === "demo" ? "Демо-набор" : "LIVE")}
            </Badge>
            <button
              className="icon-button theme-toggle"
              onClick={() => setDark((v) => !v)}
              aria-label={t("Переключить тему")}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              className="user-menu"
              onClick={() => {
                setLoginWorkspace(user?.workspace || "demo");

                setLogin(true);
              }}
            >
              <span className="avatar">{t("АК")}</span>
              <span>{t(user ? roleLabels[user.role] : "Войти")}</span>
              <ChevronDown size={12} />
            </button>
          </div>
        </header>
        <main>{t(children)}</main>
      </div>
    </>
  );
}
