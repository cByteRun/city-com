export type Sentiment = "negative" | "neutral" | "positive";
export interface Analysis {
  department: string;
  sentiment: Sentiment;
  confidence: number;
  sentimentConfidence: number;
  sentimentScore: number;
  language: "ru" | "kk";
  topic: string;
  district: string;
  location: string;
  reason: string;
  sentimentReason: string;
  severity: number;
  requestType: string;
}
export interface Item extends Analysis {
  id: string;
  sourceId: string;
  text: string;
  url: string;
  publishedAt: string;
  ingestedAt: string;
  authorHash: string;
  private: boolean;
  clusterId: string;
  reviewed: boolean;
  latencyMs: number;
  engine: string;
  fingerprint: string;
}
export const sentimentLabels: Record<string, string> = {
  negative: "Негатив",
  neutral: "Нейтрально",
  positive: "Позитив",
};
