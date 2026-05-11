"use client";

import { useEffect, useMemo, useState } from "react";
import { Accessibility, FileText, Search, Send, ShieldAlert, Sparkles, Wrench } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  appRouteSegments,
  getDashboardProjectSegment,
  getDashboardPreviewPath,
  getProjectsPath,
} from "@/lib/app-routes";
import { buildSignInPath } from "@/lib/auth/access";
import { buildCompetitorGapInsights } from "@/lib/analysis/competitor-gap";
import { toDashboardProjectOptions } from "@/components/dashboard/dashboard-project-options";
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
  getCategoryLabel,
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
  initialAnalysisMode?: DashboardAnalysisMode;
  initialSelectedProjectId?: string | null;
  initialLastAnalyzedAt?: string | null;
  initialHasHistory?: boolean;
  routeKind?: "preview" | "sites" | "site-detail";
};

export function DashboardView({
  initialResult,
  initialAuthenticated = false,
  initialUserName = null,
  initialProjectOptions = [],
  initialAnalysisMode = initialAuthenticated && initialProjectOptions.length > 0 ? "project-list" : "sample",
  initialSelectedProjectId = null,
  initialLastAnalyzedAt = null,
  initialHasHistory = false,
  routeKind = "preview",
}: DashboardViewProps) {
  const locale = useLocale();
  const tProjects = useTranslations("projects");
  const { data: session } = useSession();
  const router = useRouter();
  const summaryLocale: SummaryLocale = locale === "ko" ? "ko" : "en";
  const [result, setResult] = useState(initialResult);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date | null>(
    initialLastAnalyzedAt ? new Date(initialLastAnalyzedAt) : null,
  );
  const [analysisMode, setAnalysisMode] = useState<DashboardAnalysisMode>(initialAnalysisMode);
  const [hasHistory, setHasHistory] = useState(initialHasHistory);
  const [projectOptions, setProjectOptions] = useState<DashboardProjectOption[]>(initialProjectOptions);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialSelectedProjectId);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
  const [trendWindow, setTrendWindow] = useState<"6" | "12">("6");
  const [vitalsView, setVitalsView] = useState<"mobile" | "desktop">("mobile");
  const localizedSummary = result.summary[summaryLocale];
  const siteHost = safeHostname(result.snapshot.finalUrl);
  const pageSpeed = result.snapshot.pageSpeed;
  const isKo = summaryLocale === "ko";
  const isAuthenticated = initialAuthenticated || Boolean(session?.user);
  const userName = session?.user?.name ?? initialUserName;
  const previewPath = appRouteSegments.dashboardPreview;
  const sitesPath = appRouteSegments.dashboardSites;
  const unlockCurrentDashboardPath = buildSignInPath(summaryLocale, getDashboardPreviewPath(summaryLocale));
  const unlockRecommendationsPath = buildSignInPath(summaryLocale, getDashboardPreviewPath(summaryLocale));
  const unlockProjectsPath = buildSignInPath(summaryLocale, getProjectsPath(summaryLocale));
  const projectsLoadErrorFallback = tProjects("loadError");
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
          category: getCategoryLabel(category, summaryLocale),
          ours,
          benchmark: clamp(ours + [6, 8, 7, 9, 4, 5, 6][index], 40, 100),
        };
      }),
    [result, summaryLocale],
  );

  const competitorData = useMemo(
    () =>
        buildCompetitorGapInsights(result.scores, result.recommendations)
          .slice(0, 7)
          .map((item) => ({
            category: getCategoryLabel(item.category, summaryLocale),
            ours: item.ours,
            competitorAverage: item.competitor,
            competitorLeader: clamp(item.competitor + 5, 50, 100),
          })),
    [result, summaryLocale],
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
        label: getCategoryLabel("seo", summaryLocale),
        score: result.scores.seo,
        icon: Search,
      },
      {
        key: "aeogeo",
        label: getCategoryLabel("aeogeo", summaryLocale),
        score: result.scores.aeogeo,
        icon: Sparkles,
      },
      {
        key: "performance",
        label: getCategoryLabel("performance", summaryLocale),
        score: result.scores.performance,
        icon: Send,
      },
      {
        key: "security",
        label: getCategoryLabel("security", summaryLocale),
        score: result.scores.security,
        icon: ShieldAlert,
      },
      {
        key: "accessibility",
        label: getCategoryLabel("accessibility", summaryLocale),
        score: result.scores.accessibility,
        icon: Accessibility,
      },
      {
        key: "contentQuality",
        label: getCategoryLabel("contentQuality", summaryLocale),
        score: result.scores.contentQuality,
        icon: FileText,
      },
      {
        key: "technicalHealth",
        label: getCategoryLabel("technicalHealth", summaryLocale),
        score: result.scores.technicalHealth,
        icon: Wrench,
      },
    ],
    [result, summaryLocale],
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
      setProjectLoadError(null);
      if (routeKind !== "preview") {
        router.replace(previewPath);
      }
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
          setProjectLoadError(payload?.errorMessage ?? projectsLoadErrorFallback);
        }
        return;
      }

      if (cancelled) {
        return;
      }

      const nextProjects: DashboardProjectOption[] = toDashboardProjectOptions(payload.projects);

      setProjectOptions(nextProjects);
      setProjectLoadError(null);
      const hasSelectedProject = Boolean(
        selectedProjectId && nextProjects.some((project) => project.id === selectedProjectId),
      );
      setSelectedProjectId((current) =>
        current && nextProjects.some((project) => project.id === current) ? current : null,
      );

      if (nextProjects.length === 0) {
        setHasHistory(false);
        setLastAnalyzedAt(null);
        setAnalysisMode((currentMode) => (currentMode === "adhoc" ? currentMode : "sample"));
        if (routeKind !== "preview") {
          router.replace(previewPath);
        }
        return;
      }

      if (routeKind === "preview") {
        router.replace(sitesPath);
        return;
      }

      if (routeKind === "site-detail" && !hasSelectedProject) {
        router.replace(sitesPath);
        return;
      }

      if (routeKind === "sites") {
        setAnalysisMode((currentMode) => (currentMode === "adhoc" ? currentMode : "project-list"));
      }
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, previewPath, projectsLoadErrorFallback, routeKind, router, selectedProjectId, sitesPath]);

  function handleProjectSelect(projectId: string) {
    if (projectId === "__sample__") {
      router.push(projectOptions.length > 0 ? sitesPath : previewPath);
      return;
    }

    router.push(getDashboardProjectSegment(projectId));
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
            projectActionPath={isAuthenticated ? appRouteSegments.projects : unlockProjectsPath}
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
