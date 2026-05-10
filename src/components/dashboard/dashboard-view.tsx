"use client";

import { useMemo, useState } from "react";
import { Accessibility, FileText, Search, Send, ShieldAlert, Sparkles, Wrench } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { buildSignInPath } from "@/lib/auth/access";
import { buildCompetitorGapInsights } from "@/lib/analysis/competitor-gap";
import { DashboardDetailSections } from "@/components/dashboard/dashboard-detail-sections";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardInsightsSection } from "@/components/dashboard/dashboard-insights-section";
import { DashboardScoreSection } from "@/components/dashboard/dashboard-score-section";
import { DashboardSummaryActionsSection } from "@/components/dashboard/dashboard-summary-actions-section";
import {
  buildTrendSeries,
  categoryKeys,
  clamp,
  safeHostname,
} from "@/components/dashboard/dashboard-view-helpers";
import type { AnalyzerResult, SummaryLocale } from "@/types/analysis";
import type { DashboardMetricCard, DashboardVitalRow } from "./dashboard-view-types";

export function DashboardView({ initialResult }: { initialResult: AnalyzerResult }) {
  const locale = useLocale();
  const { data: session } = useSession();
  const summaryLocale: SummaryLocale = locale === "ko" ? "ko" : "en";
  const [result, setResult] = useState(initialResult);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState(() => new Date());
  const [trendWindow, setTrendWindow] = useState<"6" | "12">("6");
  const [vitalsView, setVitalsView] = useState<"mobile" | "desktop">("mobile");
  const localizedSummary = result.summary[summaryLocale];
  const siteHost = safeHostname(result.snapshot.finalUrl);
  const pageSpeed = result.snapshot.pageSpeed;
  const isKo = summaryLocale === "ko";
  const isAuthenticated = Boolean(session?.user);
  const unlockCurrentDashboardPath = buildSignInPath(summaryLocale, `/${summaryLocale}/dashboard`);
  const unlockRecommendationsPath = buildSignInPath(summaryLocale, `/${summaryLocale}/dashboard`);
  const unlockProjectsPath = buildSignInPath(summaryLocale, `/${summaryLocale}/projects`);
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
    () => buildTrendSeries(result.scores.overall, summaryLocale, trendWindow),
    [result.scores.overall, summaryLocale, trendWindow],
  );

  const healthDelta = trendData.at(-1) ? trendData.at(-1)!.score - trendData[0].score : 0;

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

  function handleResult(next: AnalyzerResult) {
    setResult(next);
    setLastAnalyzedAt(new Date());
  }

  return (
    <div className="space-y-6">
      <DashboardHero
        isAuthenticated={isAuthenticated}
        isKo={isKo}
        userName={session?.user?.name}
        summaryLocale={summaryLocale}
        lastAnalyzedAt={lastAnalyzedAt}
        onResult={handleResult}
      />
      <DashboardScoreSection
        result={result}
        summaryLocale={summaryLocale}
        healthDelta={healthDelta}
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
        onTrendWindowChange={setTrendWindow}
        unlockCurrentDashboardPath={unlockCurrentDashboardPath}
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
        unlockCurrentDashboardPath={unlockCurrentDashboardPath}
        unlockProjectsPath={unlockProjectsPath}
      />
    </div>
  );
}
