export type ChartSpec = {
  id: string;
  type: "line" | "bar" | "area" | "pie";
  title: string;
  xKey?: string;
  yKeys?: string[];
  categoryKey?: string;
  valueKey?: string;
  data: Record<string, string | number | null>[];
  notes?: string;
};

export type InsightPayload = {
  title: string;
  summary: string;
  tags: string[];
  sql: string;
  columns: string[];
  rows: (string | number | null)[][];
  charts: ChartSpec[];
  dashboardHint?: { layout: "grid"; cardsOrder?: string[] };
};
