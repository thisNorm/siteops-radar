"use client";

import { useEffect, useMemo, useState } from "react";
import { Accessibility, FileText, Search, Send, ShieldAlert, Sparkles, Wrench } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { buildSignInPath } from "@/lib/auth/access";
import { buildCompetitorGapInsights } from "@/lib/analysis/competitor-gap";
import { DashboardDetailSections } from "@/components/dashboard/dashboard-detail-sections";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardInsightsSection } from "@/components/dashboard/dashboard-insights-section";
import { DashboardProjectGrid } from "@/components/dashboard/dashboard-project-grid";
import { DashboardScoreSection } from "@/components/dashboard/dashboard-score-section";
import { DashboardSummaryActionsSection } from "@/components/dashboard/dashboard-summary-actions-section";
import {
  buildTrendSeries,
  categoryKeys,
  clamp,
  panelClassName,
  safeHostname,
} from "@/components/dashboard/dashboard-view-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyzerResult, SummaryLocale } from "@/types/analysis";
import type {
  DashboardAnalysisMode,
  DashboardAnalyzeMeta,
  DashboardMetricCard,
  DashboardProjectOption,
  DashboardVitalRow,
} from "./dashboard-view-types";

type DashboardViewProps = {
  initialResult: AnalyzerResult;
  initialAuthenticated?: boolean;
  initialUserName?: string | null;
  initialProjectOptions?: DashboardProjectOption[];
};

export function DashboardView({
  initialResult,
  initialAuthenticated = false,
  initialUserName = null,
  initialProjectOptions = [],
}: DashboardViewProps) {
  const locale = useLocale();
  const { data: session } = useSession();
  const summaryLocale: SummaryLocale = locale === "ko" ? "ko" : "en";
  const [result, setResult] = useState(initialResult);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date | null>(null);
  const [analysisMode, setAnalysisMode] = useState<DashboardAnalysisMode>(
    initialAuthenticated && initialProjectOptions.length > 0 ? "project-list" : "sample",
  );
  const [hasHistory, setHasHistory] = useState(false);
  const [projectOptions, setProjectOptions] = useState<DashboardProjectOption[]>(initialProjectOptions);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
  const [trendWindow, setTrendWindow] = useState<"6" | "12">("6");
  const [vitalsView, setVitalsView] = useState<"mobile" | "desktop">("mobile");
  const localizedSummary = result.summary[summaryLocale];
  const siteHost = safeHostname(result.snapshot.finalUrl);
  const pageSpeed = result.snapshot.pageSpeed;
  const isKo = summaryLocale === "ko";
  const isAuthenticated = initialAuthenticated || Boolean(session?.user);
  const userName = session?.user?.name ?? initialUserName;
  const unlockCurrentDashboardPath = buildSignInPath(summaryLocale, `/${summaryLocale}/dashboard`);
  const unlockRecommendationsPath = buildSignInPath(summaryLocale, `/${summaryLocale}/dashboard`);
  const unlockProjectsPath = buildSignInPath(summaryLocale, `/${summaryLocale}/projects`);
  const selectedProject = useMemo(
    () => projectOptions.find((project) => project.id === selectedProjectId) ?? null,
    [projectOptions, selectedProjectId],
  );
  const publicRecommendations = isAuthenticated
    ? result.recommendations.slice(0, 5)
    : result.recommendations.slice(0, 2);

  const radarData = useMemo(
    () =>
      categoryKeys.map((category, index) => {
        const ours = result.scores[category];
        return {
          category:
            {
              performance: isKo ? "성능" : "Performance",
              seo: "SEO",
              aeogeo: "AEO/GEO",
              security: isKo ? "보안" : "Security",
              accessibility: isKo ? "접근성" : "Accessibility",
              contentQuality: isKo ? "콘텐츠 품질" : "Content Quality",
              technicalHealth: isKo ? "기술 상태" : "Technical Health",
            }[category],
          ours,
          benchmark: clamp(ours + [6, 8, 7, 9, 4, 5, 6][index], 40, 100),
        };
      }),
    [isKo, result],
  );

  const competitorData = useMemo(
    () =>
      buildCompetitorGapInsights(result.scores, result.recommendations)
        .slice(0, 7)
        .map((item) => ({
          category:
            {
              performance: isKo ? "성능" : "Performance",
              seo: "SEO",
              aeogeo: "AEO/GEO",
              security: isKo ? "보안" : "Security",
              accessibility: isKo ? "접근성" : "Accessibility",
              contentQuality: isKo ? "콘텐츠 품질" : "Content Quality",
              technicalHealth: isKo ? "기술 상태" : "Technical Health",
            }[item.category],
          ours: item.ours,
          competitorAverage: item.competitor,
          competitorLeader: clamp(item.competitor + 5, 50, 100),
        })),
    [isKo, result],
  );

  const trendData = useMemo(
    () => (hasHistory ? buildTrendSeries(result.scores.overall, summaryLocale, trendWindow) : []),
    [hasHistory, result.scores.overall, summaryLocale, trendWindow],
  );

  const healthDelta = hasHistory && trendData.length > 1 ? trendData.at(-1)!.score - trendData[0].score : null;

  const severityData = useMemo(() => {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    [...result.findings, ...result.recommendations].forEach((item) => {
      if (item.severity === "critical") {
        counts.critical += 1;
      } else if (item.severity === "high") {
        counts.high += 1;
      } else if (item.severity === "medium") {
        counts.medium += 1;
      } else {
        counts.low += 1;
      }
    });

    return [
      {
        label: isKo ? "치명" : "Critical",
        value: counts.critical,
        color: "#ef4444",
      },
      {
        label: isKo ? "높음" : "High",
        value: counts.high,
        color: "#fb923c",
      },
      {
        label: isKo ? "보통" : "Medium",
        value: counts.medium,
        color: "#facc15",
      },
      {
        label: isKo ? "낮음" : "Low",
        value: counts.low,
        color: "#4ade80",
      },
    ].filter((item) => item.value > 0);
  }, [isKo, result.findings, result.recommendations]);

  const severityTotal = severityData.reduce((total, item) => total + item.value, 0);

  const metricCards = useMemo<DashboardMetricCard[]>(
    () => [
      {
        key: "seo",
        label: "SEO",
        score: result.scores.seo,
        icon: Search,
      },
      {
        key: "aeogeo",
        label: "AEO/GEO",
        score: result.scores.aeogeo,
        icon: Sparkles,
      },
      {
        key: "performance",
        label: isKo ? "성능" : "Performance",
        score: result.scores.performance,
        icon: Send,
      },
      {
        key: "security",
        label: isKo ? "보안" : "Security",
        score: result.scores.security,
        icon: ShieldAlert,
      },
      {
        key: "accessibility",
        label: isKo ? "접근성" : "Accessibility",
        score: result.scores.accessibility,
        icon: Accessibility,
      },
      {
        key: "contentQuality",
        label: isKo ? "콘텐츠 품질" : "Content Quality",
        score: result.scores.contentQuality,
        icon: FileText,
      },
      {
        key: "technicalHealth",
        label: isKo ? "기술 상태" : "Technical Health",
        score: result.scores.technicalHealth,
        icon: Wrench,
      },
    ],
    [isKo, result],
  );

  const desktopVitals = useMemo(
    () =>
      pageSpeed
        ? {
            lcp: pageSpeed.largestContentfulPaintMs
              ? Number((pageSpeed.largestContentfulPaintMs / 1000) * 0.78)
              : undefined,
            inp: pageSpeed.interactionToNextPaintMs
              ? Math.round(pageSpeed.interactionToNextPaintMs * 0.74)
              : undefined,
            cls:
              pageSpeed.cumulativeLayoutShift !== undefined
                ? Number((pageSpeed.cumulativeLayoutShift * 0.65).toFixed(2))
                : undefined,
          }
        : {
            lcp: undefined,
            inp: undefined,
            cls: undefined,
          },
    [pageSpeed],
  );

  const vitalRows = useMemo<DashboardVitalRow[]>(
    () =>
      vitalsView === "mobile"
        ? [
          {
            key: "lcp",
            label: "LCP",
            value: pageSpeed?.largestContentfulPaintMs
              ? Number((pageSpeed.largestContentfulPaintMs / 1000).toFixed(1))
              : undefined,
            display: pageSpeed?.largestContentfulPaintMs
              ? `${(pageSpeed.largestContentfulPaintMs / 1000).toFixed(1)}s`
              : "-",
            ticks: ["2.5s", "4.0s"],
            max: 5,
          },
          {
            key: "inp",
            label: "INP",
            value: pageSpeed?.interactionToNextPaintMs,
            display: pageSpeed?.interactionToNextPaintMs
              ? `${Math.round(pageSpeed.interactionToNextPaintMs)}ms`
              : "-",
            ticks: ["200ms", "500ms"],
            max: 800,
          },
          {
            key: "cls",
            label: "CLS",
            value: pageSpeed?.cumulativeLayoutShift,
            display:
              pageSpeed?.cumulativeLayoutShift !== undefined
                ? pageSpeed.cumulativeLayoutShift.toFixed(2)
                : "-",
            ticks: ["0.10", "0.25"],
            max: 0.35,
          },
        ]
        : [
          {
            key: "lcp",
            label: "LCP",
            value: desktopVitals.lcp,
            display: desktopVitals.lcp !== undefined ? `${desktopVitals.lcp.toFixed(1)}s` : "-",
            ticks: ["2.5s", "4.0s"],
            max: 5,
          },
          {
            key: "inp",
            label: "INP",
            value: desktopVitals.inp,
            display: desktopVitals.inp !== undefined ? `${desktopVitals.inp}ms` : "-",
            ticks: ["200ms", "500ms"],
            max: 800,
          },
          {
            key: "cls",
            label: "CLS",
            value: desktopVitals.cls,
            display: desktopVitals.cls !== undefined ? desktopVitals.cls.toFixed(2) : "-",
            ticks: ["0.10", "0.25"],
            max: 0.35,
          },
        ],
    [desktopVitals.cls, desktopVitals.inp, desktopVitals.lcp, pageSpeed, vitalsView],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setProjectOptions([]);
      setSelectedProjectId(null);
      return;
    }

    let cancelled = false;

    async function loadProjects() {
      const response = await fetch("/api/projects", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | {
            projects?: {
              id: string;
              name: string;
              url: string;
              lastAnalyzedAt?: string;
              latestScores?: AnalyzerResult["scores"];
              runs?: { id: string }[];
            }[];
            errorMessage?: string;
          }
        | null;

      if (!response.ok || !payload?.projects) {
        if (!cancelled) {
          setProjectLoadError(payload?.errorMessage ?? "Projects could not be loaded.");
        }
        return;
      }

      if (cancelled) {
        return;
      }

      const nextProjects: DashboardProjectOption[] = payload.projects.map((project) => ({
        id: project.id,
        name: project.name,
        url: project.url,
        lastAnalyzedAt: project.lastAnalyzedAt,
        hasAnalysis: Boolean(project.runs?.length),
        latestScores: project.latestScores,
      }));

      setProjectOptions(nextProjects);
      setProjectLoadError(null);
      setSelectedProjectId((current) =>
        current && nextProjects.some((project) => project.id === current) ? current : null,
      );
      setAnalysisMode((currentMode) => {
        if (nextProjects.length === 0) {
          return currentMode === "adhoc" ? currentMode : "sample";
        }

        if (currentMode === "adhoc" || currentMode === "managed" || currentMode === "managed-empty") {
          return currentMode;
        }

        return "project-list";
      });
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !selectedProjectId) {
      return;
    }

    let cancelled = false;

    async function loadProjectContext() {
      const response = await fetch(`/api/projects/${selectedProjectId}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | {
            latestResult?: AnalyzerResult | null;
            latestAnalyzedAt?: string | null;
            hasHistory?: boolean;
            errorMessage?: string;
          }
        | null;

      if (!response.ok || !payload) {
        if (!cancelled) {
          setProjectLoadError(payload?.errorMessage ?? "Project could not be loaded.");
        }
        return;
      }

      if (cancelled) {
        return;
      }

      if (payload.latestResult) {
        setResult(payload.latestResult);
        setAnalysisMode("managed");
        setHasHistory(Boolean(payload.hasHistory));
        setLastAnalyzedAt(payload.latestAnalyzedAt ? new Date(payload.latestAnalyzedAt) : null);
      } else {
        setAnalysisMode("managed-empty");
        setHasHistory(false);
        setLastAnalyzedAt(null);
      }

      setProjectLoadError(null);
    }

    void loadProjectContext();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, selectedProjectId]);

  function handleProjectSelect(projectId: string) {
    if (projectId === "__sample__") {
      setSelectedProjectId(null);
      if (projectOptions.length > 0) {
        setAnalysisMode("project-list");
      } else {
        setResult(initialResult);
        setAnalysisMode("sample");
      }
      setHasHistory(false);
      setLastAnalyzedAt(null);
      return;
    }

    setSelectedProjectId(projectId);
  }

  function handleResult(next: AnalyzerResult, meta: DashboardAnalyzeMeta) {
    setResult(next);
    setAnalysisMode(meta.persisted ? "managed" : "adhoc");
    setHasHistory(Boolean(meta.hasHistory));
    setLastAnalyzedAt(new Date());
    if (!meta.persisted) {
      setSelectedProjectId(null);
    }
  }

  return (
    <div className="space-y-6">
      <DashboardHero
        isAuthenticated={isAuthenticated}
        isKo={isKo}
        userName={userName}
        summaryLocale={summaryLocale}
        lastAnalyzedAt={lastAnalyzedAt}
        analysisMode={analysisMode}
        hasHistory={hasHistory}
        projectOptions={projectOptions}
        selectedProjectId={selectedProjectId}
        selectedProjectUrl={selectedProject?.url}
        onProjectSelect={handleProjectSelect}
        onResult={handleResult}
      />
      {projectLoadError ? (
        <Card className={panelClassName()}>
          <CardContent className="py-6 text-sm text-destructive">{projectLoadError}</CardContent>
        </Card>
      ) : null}
      {analysisMode === "project-list" && projectOptions.length > 0 ? (
        <DashboardProjectGrid
          isKo={isKo}
          projects={projectOptions}
          onSelect={(projectId) => handleProjectSelect(projectId)}
        />
      ) : analysisMode === "managed-empty" ? (
        <Card className={panelClassName()}>
          <CardHeader>
            <CardTitle>{isKo ? "아직 저장된 분석이 없습니다" : "No saved analysis yet"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              {isKo
                ? "선택한 사이트는 프로젝트에 추가되어 있지만, 아직 저장된 분석 결과가 없습니다."
                : "The selected site exists in your projects, but no saved analysis is available yet."}
            </p>
            <p>
              {isKo
                ? "프로젝트 페이지에서 분석 실행을 누르면 다음부터 이 사이트의 결과를 대시보드에서 바로 불러올 수 있습니다."
                : "Run an analysis from the projects page and this site's results will show up here on the dashboard."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <DashboardScoreSection
            result={result}
            summaryLocale={summaryLocale}
            healthDelta={healthDelta}
            hasHistory={hasHistory}
            analysisMode={analysisMode}
            metricCards={metricCards}
            isKo={isKo}
          />
          <DashboardInsightsSection
            isAuthenticated={isAuthenticated}
            isKo={isKo}
            radarData={radarData}
            competitorData={competitorData}
            localizedSummary={localizedSummary}
            trendData={trendData}
            trendWindow={trendWindow}
            hasHistory={hasHistory}
            analysisMode={analysisMode}
            onTrendWindowChange={setTrendWindow}
            unlockCurrentDashboardPath={unlockCurrentDashboardPath}
            projectActionPath={isAuthenticated ? `/${summaryLocale}/projects` : unlockProjectsPath}
          />
          <DashboardDetailSections
            recommendations={result.recommendations}
            publicRecommendations={publicRecommendations}
            isAuthenticated={isAuthenticated}
            isKo={isKo}
            summaryLocale={summaryLocale}
            severityData={severityData}
            severityTotal={severityTotal}
            vitalRows={vitalRows}
            vitalsView={vitalsView}
            onVitalsViewChange={setVitalsView}
            unlockRecommendationsPath={unlockRecommendationsPath}
          />
          <DashboardSummaryActionsSection
            isAuthenticated={isAuthenticated}
            isKo={isKo}
            siteHost={siteHost}
            localizedSummary={localizedSummary}
            model={result.summary.model}
            analysisMode={analysisMode}
            unlockCurrentDashboardPath={unlockCurrentDashboardPath}
            unlockProjectsPath={unlockProjectsPath}
          />
        </>
      )}
    </div>
  );
}
