import type { Workspace } from "@/entities/workspace/@x/session";
export type Role = "admin" | "analyst" | "department" | "viewer";
export interface User {
  role: Role;
  name: string;
  department: string;
  workspace: Workspace;
}
export const roleLabels: Record<Role, string> = {
  admin: "Администратор",
  analyst: "Аналитик",
  department: "Сотрудник подразделения",
  viewer: "Просмотр",
};
