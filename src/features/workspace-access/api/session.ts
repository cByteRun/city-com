import { requestJson } from "@/shared/api";
import type { User, Role } from "@/entities/session";
import type { Workspace } from "@/entities/workspace";
export const getSession = () =>
  requestJson<{ user: User | null }>("/api/session");
export const authenticateWorkspace = (
  workspace: Workspace,
  role: Role,
  password = "",
) =>
  requestJson<{ user: User }>("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspace, role, password }),
  });
export const logoutWorkspace = () =>
  requestJson<{ ok: boolean }>("/api/session", { method: "DELETE" });
