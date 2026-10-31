export type Status = "Новое" | "Передано" | "В работе" | "Решено" | "Закрыто";
export interface Cluster {
  id: string;
  title: string;
  location: string;
  district: string;
  department: string;
  status: Status;
  assignedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  assignee: string;
  summary: string;
}
