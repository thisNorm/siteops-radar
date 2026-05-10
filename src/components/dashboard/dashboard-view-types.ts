import type { LucideIcon } from "lucide-react";
import type { AnalyzerResult, SummaryLocale } from "@/types/analysis";

export type DashboardMetricCard = {
  key: string;
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
