export interface Source {
  id: string;
  name: string;
  type:
    | "JSON"
    | "RSS"
    | "HTML"
    | "VK"
    | "Instagram"
    | "Facebook"
    | "Telegram"
    | "Direct";
  url: string;
  keywords?: string;
  permissionBasis?: string;
  configured?: boolean;
  cursor?: number;
  resourceId?: string;
  city?: string;
  region?: string;
  tags?: string;
  aiConsent?: boolean;
  lastFetched?: number;
  lastMatched?: number;
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
