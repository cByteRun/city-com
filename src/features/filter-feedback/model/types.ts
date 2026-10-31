import { priority } from "@/entities/issue";
export interface Filters {
  period: string;
  source: string;
  department: string;
  district: string;
  sentiment: string;
  priority: string;
  status: string;
  problem: string;
  q: string;
  queue: string;
}
export const defaultFilters: Filters = {
  period: "30",
  source: "",
  department: "",
  district: "",
  sentiment: "",
  priority: "",
  status: "",
  problem: "",
  q: "",
  queue: "",
};
