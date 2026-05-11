import type { LucideIcon } from "lucide-react";
import type {
  AnalysisCategory,
  AnalysisScores,
  AnalyzerResult,
  CompetitorBenchmark,
  SummaryLocale,
} from "@/types/analysis";

export type DashboardMetricCard = {
  key: AnalysisCategory;
  label: string;
  score: number;
  icon: LucideIcon;
};

export type DashboardRadarDatum = {
  category: string;
  ours: number;
  benchmark: number;
};

export type DashboardCompetitorDatum = {
  category: string;
  ours: number;
  competitorAverage: number;
  competitorLeader: number;
};

export type DashboardTrendDatum = {
  label: string;
  score: number;
  locale: SummaryLocale;
};

export type DashboardSeverityDatum = {
  label: string;
  value: number;
  color: string;
};

export type DashboardVitalRow = {
  key: "lcp" | "inp" | "cls";
  label: string;
  value: number | undefined;
  display: string;
  ticks: string[];
  max: number;
};

export type DashboardLocalizedSummary = AnalyzerResult["summary"]["ko"];

export type DashboardAnalysisMode = "sample" | "adhoc" | "managed" | "managed-empty" | "project-list";

export type DashboardAnalyzeMeta = {
  persisted: boolean;
  reason?: string;
  hasHistory?: boolean;
};

export type DashboardProjectOption = {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  lastAnalyzedAt?: string;
  hasAnalysis: boolean;
  competitorCount: number;
  latestScores?: AnalysisScores;
};

export type DashboardCompetitorGapLevels = Partial<Record<AnalysisCategory, 0 | 1 | 2 | 3 | 4 | 5>>;

export type DashboardCompetitorBenchmark = CompetitorBenchmark;
