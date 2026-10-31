"use client";
import { deriveCityAnalytics } from "@/widgets/analytics-charts";
import { useState, useCallback, useEffect, useMemo } from "react";
import { type User, type Role } from "@/entities/session";
import { type State, type Workspace } from "@/entities/workspace";
import {
  defaultFilters,
  type Filters,
  filterItems,
} from "@/features/filter-feedback";

import { titles } from "../config/navigation";
import { requestJson, ApiError, type ActionResult } from "@/shared/api";
import { getSession, authenticateWorkspace } from "@/features/workspace-access";
export function useCitycomWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState("overview");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selected, setSelected] = useState<{
    kind: "item" | "cluster";
    id: string;
  } | null>(null);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(false);
  const [login, setLogin] = useState(false);
  const [loginWorkspace, setLoginWorkspace] = useState<Workspace>("live");

  const [help, setHelp] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [loadMs, setLoadMs] = useState<number | null>(null);
  const notify = useCallback(
    (text: string, error = false) => setNotice({ text, error }),
    [],
  );
  const load = useCallback(async () => {
    const started = performance.now();
    try {
      const data = await requestJson<{ state: State; user: User }>("/api/data");
      setState(data.state);
      setUser(data.user);
      setLoadMs(Math.round(performance.now() - started));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUser(null);
        setState(null);
      } else notify(e instanceof Error ? e.message : "Ошибка загрузки", true);
    } finally {
      setLoading(false);
    }
  }, [notify]);
  const enter = useCallback(
    async (workspace: Workspace, role: Role, pwd = "") => {
      setBusy(true);
      try {
        const data = await authenticateWorkspace(workspace, role, pwd);
        setUser(data.user);
        setSelected(null);
        setLogin(false);

        setFilters(defaultFilters);
        await load();
      } catch (e) {
        notify(e instanceof Error ? e.message : "Ошибка входа", true);
      } finally {
        setBusy(false);
        setLoading(false);
      }
    },
    [load, notify],
  );
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setPage(
      params.get("view") && titles[params.get("view")!]
        ? params.get("view")!
        : "overview",
    );
    const f = { ...defaultFilters };
    for (const k of Object.keys(f) as (keyof Filters)[])
      if (params.has(k)) f[k] = params.get(k)!;
    setFilters(f);
    setDark(localStorage.getItem("citycom-theme") === "dark");
    getSession()
      .then((d) => {
        if (d.user) load();
        else enter("demo", "admin");
      })
      .catch(() => setLoading(false));
  }, [load, enter]);
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [user, load]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("citycom-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    const params = new URLSearchParams({ view: page });
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== defaultFilters[k as keyof Filters]) params.set(k, v);
    });
    history.replaceState(null, "", "?" + params);
  }, [filters, page]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  async function action(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const data = await requestJson<{ state: State; result: ActionResult }>(
        "/api/action",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (data.state) setState(data.state);
      return data.result;
    } catch (e) {
      notify(e instanceof Error ? e.message : "Ошибка операции", true);
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  function go(view: string, patch: Partial<Filters> = {}) {
    setPage(view);
    setFilters((f) => ({ ...f, ...patch }));
    setMobile(false);
    setSelected(null);
  }
  function updateFilter(key: keyof Filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  const items = useMemo(
    () => (state ? filterItems(state, filters) : []),
    [state, filters],
  );
  const {
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
  } = useMemo(
    () => deriveCityAnalytics(state, items, filters),
    [state, items, filters],
  );
  const allowed = user && user.role !== "viewer";

  return {
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
  };
}
