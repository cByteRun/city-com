"use client";
import { type Workspace } from "@/entities/workspace";
import { type User, type Role, roleLabels } from "@/entities/session";
import { useState, useEffect } from "react";
import { Sheet, Button } from "@/shared/ui";
import { ShieldCheck, ArrowRight, LogOut } from "lucide-react";
import { logoutWorkspace } from "../api/session";
export function WorkspaceAccess({
  open,
  onOpenChange,
  workspace,
  onWorkspaceChange,
  user,
  busy,
  onEnter,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspace: Workspace;
  onWorkspaceChange: (v: Workspace) => void;
  user: User | null;
  busy: boolean;
  onEnter: (workspace: Workspace, role: Role, password: string) => void;
  onLogout: () => void;
}) {
  const [loginRole, setLoginRole] = useState<Role>("admin");
  const [password, setPassword] = useState("");
  useEffect(() => {
    if (open) {
      setLoginRole(user?.role || "admin");
      setPassword("");
    }
  }, [open, user?.role]);
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Доступ к рабочему пространству"
    >
      <div className="sheet-body">
        <div className="info-note">
          <ShieldCheck size={18} />
          <p>
            {workspace === "demo"
              ? "Смена роли действует только на синтетические данные. Права проверяются сервером."
              : "Для LIVE требуется пароль выбранной роли, настроенный администратором."}
          </p>
        </div>
        <label className="field-label">
          Рабочее пространство
          <select
            value={workspace}
            onChange={(e) => onWorkspaceChange(e.target.value as Workspace)}
          >
            <option value="demo">DEMO · синтетические данные</option>
            <option value="live">LIVE · реальные данные</option>
          </select>
        </label>
        <label className="field-label">
          Роль
          <select
            value={loginRole}
            onChange={(e) => setLoginRole(e.target.value as Role)}
          >
            {Object.entries(roleLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        {workspace === "live" && (
          <label className="field-label">
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === "Enter") onEnter(workspace, loginRole, password);
              }}
            />
          </label>
        )}
        <Button
          variant="default"
          disabled={busy}
          onClick={() => onEnter(workspace, loginRole, password)}
        >
          Войти в {workspace}
          <ArrowRight size={14} />
        </Button>
        {user && (
          <Button
            onClick={async () => {
              await logoutWorkspace();
              onLogout();
              onOpenChange(false);
            }}
          >
            <LogOut size={14} /> Выйти
          </Button>
        )}
      </div>
    </Sheet>
  );
}
