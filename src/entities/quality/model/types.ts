export interface Quality {
  at: string;
  engine: string;
  samples: number;
  sentimentAccuracy: number;
  departmentAccuracy: number;
  p95Ms: number;
  ru: number;
  kk: number;
  errors: { text: string; expected: string; actual: string }[];
}
