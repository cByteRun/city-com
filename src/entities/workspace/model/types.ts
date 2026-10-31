import type { Item } from "@/entities/feedback/@x/workspace";
import type { Cluster } from "@/entities/issue/@x/workspace";
import type { Source } from "@/entities/source/@x/workspace";
import type { Audit } from "@/entities/audit/@x/workspace";
import type { Quality } from "@/entities/quality/@x/workspace";
import type { Department } from "@/entities/department/@x/workspace";
export type Workspace = "demo" | "live";
export interface State {
  directory: Department[];
  items: Item[];
  clusters: Cluster[];
  sources: Source[];
  audit: Audit[];
  quality: Quality | null;
  updatedAt: string;
}
