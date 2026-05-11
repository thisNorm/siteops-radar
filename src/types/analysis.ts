export type AnalysisCategory =
  | "performance"
  | "seo"
  | "aeogeo"
  | "security"
  | "accessibility"
  | "contentQuality"
  | "technicalHealth";

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type AnalysisScores = Record<AnalysisCategory, number> & {
  overall: number;
};

export type SummaryLocale = "ko" | "en";

export type CompetitorBenchmarkCategory = {
  category: AnalysisCategory;
  competitorAverage: number;
  competitorLeader: number;
  sampleSize: number;
};

export type CompetitorBenchmark = {
  linkedCompetitorCount: number;
  analyzedCompetitorCount: number;
  categories: CompetitorBenchmarkCategory[];
};

export type Finding = {
  id: string;
  category: AnalysisCategory;
  severity: Severity;
  title: string;
  description: string;
  evidence?: Record<string, unknown>;
};

export type RecommendationInput = {
  category: AnalysisCategory;
  severity: Severity;
  title: string;
  description: string;
  impact: 1 | 2 | 3 | 4 | 5;
  effort: 1 | 2 | 3 | 4 | 5;
  competitorGap: 0 | 1 | 2 | 3 | 4 | 5;
  expectedImprovement: string;
};

export type Recommendation = RecommendationInput & {
  id: string;
  priorityScore: number;
};

export type PageSnapshot = {
  sourceUrl: string;
  finalUrl: string;
  httpStatus: number;
  fetchedTitle?: string;
  fetchedDescription?: string;
  thumbnailImageUrl?: string;
  canonicalUrl?: string;
  robotsMeta?: string;
  h1?: string;
  headingsSummary: {
    h1: number;
    h2: number;
    h3: number;
  };
  structuredDataTypes: string[];
  imageSummary: {
    total: number;
    missingAlt: number;
  };
  assetSummary: {
    scripts: number;
    externalScripts: number;
    stylesheets: number;
    brokenAssets: number;
    checkedAssets: number;
  };
  robotsTxt: {
    checked: boolean;
    exists: boolean;
    hasSitemap: boolean;
  };
  sitemap: {
    checked: boolean;
    exists: boolean;
  };
  pageSpeed?: PageSpeedSummary;
  responseHeaders: Record<string, string>;
  rawHtmlHash: string;
  htmlLength: number;
};

export type PageSpeedSummary = {
  strategy: "mobile" | "desktop";
  performance?: number;
  accessibility?: number;
  seo?: number;
  bestPractices?: number;
  largestContentfulPaintMs?: number;
  interactionToNextPaintMs?: number;
  cumulativeLayoutShift?: number;
  totalBlockingTimeMs?: number;
  raw?: Record<string, unknown>;
};

export type AnalyzerResult = {
  snapshot: PageSnapshot;
  scores: AnalysisScores;
  findings: Finding[];
  recommendations: Recommendation[];
  summary: {
    requestedLocale: SummaryLocale;
    model: string;
    ko: {
      overview: string;
      keyRisks: string[];
      nextActions: string[];
      competitorGapNarrative: string;
    };
    en: {
      overview: string;
      keyRisks: string[];
      nextActions: string[];
      competitorGapNarrative: string;
    };
  };
};
