export interface Source {
  id: string;
  name: string;
  type: "JSON" | "RSS" | "Direct";
  url: string;
  enabled: boolean;
  permission: boolean;
  intervalMinutes: number;
  lastSync?: string;
  nextSync?: string;
  error?: string;
  fetched: number;
  inserted: number;
  duplicates: number;
}
