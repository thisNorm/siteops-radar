"use client";

import { useMemo, useState } from "react";
import {
  Accessibility,
  ArrowRight,
  CalendarClock,
  Download,
  FileText,
  GaugeCircle,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AnalyzePanel } from "@/components/dashboard/analyze-panel";
import { CategoryRadar } from "@/components/charts/category-radar";
import { CompetitorBars } from "@/components/charts/competitor-bars";
import { HealthGauge } from "@/components/charts/health-gauge";
import { IssueSeverityDonut } from "@/components/charts/issue-severity-donut";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { ScoreTrendChart } from "@/components/charts/score-trend-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCompetitorGapInsights } from "@/lib/analysis/competitor-gap";
import { cn } from "@/lib/utils";
import type { AnalysisCategory, AnalyzerResult, SummaryLocale } from "@/types/analysis";

const categoryKeys: AnalysisCategory[] = [
  "performance",
  "seo",
  "aeogeo",
  "security",
  "accessibility",
  "contentQuality",
  "technicalHealth",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function formatTimestamp(date: Date, locale: SummaryLocale) {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildSparklineValues(score: number, seed: number) {
  return Array.from({ length: 7 }, (_, index) => {
    const wobble = ((seed + index * 3) % 7) - 3;
    return clamp(score - 11 + index * 2 + wobble * 1.5, 30, 100);
  });
}

function buildTrendSeries(score: number, locale: SummaryLocale, window: "6" | "12") {
  const labels =
    window === "6"
      ? ["04.01", "04.08", "04.15", "04.22", "04.29", "05.12"]
      : ["02.18", "03.03", "03.17", "03.31", "04.14", "05.12"];
  const offsets = window === "6" ? [-18, -12, -7, -5, -2, 0] : [-22, -17, -12, -8, -4, 0];

  return labels.map((label, index) => ({
    label,
    score: clamp(score + offsets[index], 28, 100),
    locale,
  }));
}

function getScoreTone(score: number, locale: SummaryLocale) {
  if (score >= 85) {
    return {
      label: locale === "ko" ? "우수" : "Strong",
      className: "bg-emerald-50 text-emerald-600",
    };
  }

  if (score >= 75) {
    return {
      label: locale === "ko" ? "양호" : "Good",
      className: "bg-lime-50 text-lime-600",
    };
  }

  if (score >= 60) {
    return {
      label: locale === "ko" ? "보통" : "Fair",
      className: "bg-amber-50 text-amber-600",
    };
  }

  return {
    label: locale === "ko" ? "주의" : "Watch",
    className: "bg-rose-50 text-rose-600",
  };
}

function getImpactLabel(value: number, locale: SummaryLocale) {
  if (value >= 4) {
    return {
      label: locale === "ko" ? "높음" : "High",
      className: "bg-rose-50 text-rose-600",
    };
  }

  if (value === 3) {
    return {
      label: locale === "ko" ? "보통" : "Medium",
      className: "bg-amber-50 text-amber-600",
    };
  }

  return {
    label: locale === "ko" ? "낮음" : "Low",
    className: "bg-emerald-50 text-emerald-600",
  };
}

function getEffortLabel(value: number, locale: SummaryLocale) {
  if (value <= 2) {
    return {
      label: locale === "ko" ? "쉬움" : "Easy",
      className: "bg-emerald-50 text-emerald-600",
    };
  }

  if (value === 3) {
    return {
      label: locale === "ko" ? "보통" : "Medium",
      className: "bg-amber-50 text-amber-600",
    };
  }

  return {
    label: locale === "ko" ? "어려움" : "Hard",
    className: "bg-rose-50 text-rose-600",
  };
}

function getGapLabel(value: number, locale: SummaryLocale) {
  if (value >= 4) {
    return {
      label: locale === "ko" ? "크다" : "Large",
      className: "bg-rose-50 text-rose-600",
    };
  }

  if (value >= 2) {
    return {
      label: locale === "ko" ? "보통" : "Medium",
      className: "bg-amber-50 text-amber-600",
    };
  }

  return {
    label: locale === "ko" ? "적다" : "Low",
    className: "bg-emerald-50 text-emerald-600",
  };
}

function getVitalTone(
  type: "lcp" | "inp" | "cls",
  value: number | undefined,
  locale: SummaryLocale,
) {
  if (value === undefined) {
    return {
      label: locale === "ko" ? "대기" : "Pending",
      className: "bg-muted text-muted-foreground",
    };
  }

  if (
    (type === "lcp" && value <= 2.5) ||
    (type === "inp" && value <= 200) ||
    (type === "cls" && value <= 0.1)
  ) {
    return {
      label: locale === "ko" ? "좋음" : "Good",
      className: "bg-emerald-50 text-emerald-600",
    };
  }

  if (
    (type === "lcp" && value <= 4) ||
    (type === "inp" && value <= 500) ||
    (type === "cls" && value <= 0.25)
  ) {
    return {
      label: locale === "ko" ? "보통" : "Fair",
      className: "bg-amber-50 text-amber-600",
    };
  }

  return {
    label: locale === "ko" ? "주의" : "Needs work",
    className: "bg-rose-50 text-rose-600",
  };
}

function metricPosition(value: number, max: number) {
  return `${clamp((value / max) * 100, 2, 98)}%`;
}

function panelClassName(extra?: string) {
  return cn(
    "rounded-[2rem] border border-white/70 bg-card/90 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.35)] ring-1 ring-black/5 backdrop-blur",
    extra,
  );
}

export function DashboardView({ initialResult }: { initialResult: AnalyzerResult }) {
  const t = useTranslations();
  const locale = useLocale();
  const summaryLocale: SummaryLocale = locale === "ko" ? "ko" : "en";
  const [result, setResult] = useState(initialResult);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState(() => new Date());
  const [trendWindow, setTrendWindow] = useState<"6" | "12">("6");
  const [vitalsView, setVitalsView] = useState<"mobile" | "desktop">("mobile");
  const localizedSummary = result.summary[summaryLocale];
  const siteHost = safeHostname(result.snapshot.finalUrl);
  const pageSpeed = result.snapshot.pageSpeed;
  const isKo = summaryLocale === "ko";

  const radarData = useMemo(
    () =>
      categoryKeys.map((category, index) => {
        const ours = result.scores[category];
        return {
          category: t(`categories.${category}`),
          ours,
          benchmark: clamp(ours + [6, 8, 7, 9, 4, 5, 6][index], 40, 100),
        };
      }),
    [result, t],
  );

  const competitorData = useMemo(
    () =>
      buildCompetitorGapInsights(result.scores, result.recommendations)
        .slice(0, 7)
        .map((item) => ({
          category: t(`categories.${item.category}`),
          ours: item.ours,
          competitorAverage: item.competitor,
          competitorLeader: clamp(item.competitor + 5, 50, 100),
        })),
    [result, t],
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

  const metricCards = useMemo(
    () => [
      {
        key: "seo",
        label: t("categories.seo"),
        score: result.scores.seo,
        icon: Search,
      },
      {
        key: "aeogeo",
        label: t("categories.aeogeo"),
        score: result.scores.aeogeo,
        icon: Sparkles,
      },
      {
        key: "performance",
        label: t("categories.performance"),
        score: result.scores.performance,
        icon: Send,
      },
      {
        key: "security",
        label: t("categories.security"),
        score: result.scores.security,
        icon: ShieldAlert,
      },
      {
        key: "accessibility",
        label: t("categories.accessibility"),
        score: result.scores.accessibility,
        icon: Accessibility,
      },
      {
        key: "contentQuality",
        label: t("categories.contentQuality"),
        score: result.scores.contentQuality,
        icon: FileText,
      },
      {
        key: "technicalHealth",
        label: t("categories.technicalHealth"),
        score: result.scores.technicalHealth,
        icon: Wrench,
      },
    ],
    [result, t],
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

  const vitalRows =
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
        ];

  function handleResult(next: AnalyzerResult) {
    setResult(next);
    setLastAnalyzedAt(new Date());
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">{t("dashboard.eyebrow")}</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {isKo ? "안녕하세요, John님! 👋" : "Hello, John! 👋"}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground md:text-base">
            {isKo
              ? "오늘도 사이트의 성장을 함께 모니터링해요."
              : "Let’s keep a close eye on today’s website growth signals."}
          </p>
        </div>
        <div className="w-full max-w-3xl space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
            <AnalyzePanel onResult={handleResult} className="w-full lg:flex-1" />
          </div>
          <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            <span>
              {isKo ? "최근 분석" : "Recent analysis"}: {formatTimestamp(lastAnalyzedAt, summaryLocale)}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-9">
        <Card className={panelClassName("xl:col-span-2")}>
          <CardHeader>
            <CardTitle className="text-sm">{t("dashboard.overallHealth")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <HealthGauge score={result.scores.overall} />
            <div className="flex items-center justify-center">
              <Badge className={cn("border-0", getScoreTone(result.scores.overall, summaryLocale).className)}>
                {getScoreTone(result.scores.overall, summaryLocale).label}
              </Badge>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              <span className={healthDelta >= 0 ? "font-medium text-emerald-600" : "font-medium text-rose-600"}>
                {healthDelta >= 0 ? "+" : ""}
                {healthDelta}
              </span>{" "}
              {isKo ? "점수 변화" : "score change"}
            </p>
          </CardContent>
        </Card>

        {metricCards.map((metric, index) => {
          const tone = getScoreTone(metric.score, summaryLocale);
          const Icon = metric.icon;

          return (
            <Card key={metric.key} size="sm" className={panelClassName()}>
              <CardContent className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-primary/80" />
                  <Badge className={cn("border-0", tone.className)}>{tone.label}</Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{metric.label}</div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight">
                    {metric.score}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <MiniSparkline
                  values={buildSparklineValues(metric.score, index + 2)}
                  stroke={
                    metric.score >= 75
                      ? "var(--chart-2)"
                      : metric.score >= 60
                        ? "var(--chart-4)"
                        : "var(--destructive)"
                  }
                />
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_1.6fr_1.2fr]">
        <Card className={panelClassName()}>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.categoryScores")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryRadar
              data={radarData}
              oursLabel={isKo ? "내 사이트" : "Our site"}
              benchmarkLabel={isKo ? "경쟁사 평균" : "Competitor avg"}
            />
          </CardContent>
        </Card>

        <Card className={panelClassName()}>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.competitorGap")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CompetitorBars
              data={competitorData}
              oursLabel={isKo ? "내 사이트" : "Our site"}
              competitorAverageLabel={isKo ? "경쟁사 평균" : "Competitor avg"}
              competitorLeaderLabel={isKo ? "경쟁사 상위" : "Category leader"}
            />
            <p className="text-sm leading-7 text-muted-foreground">
              {localizedSummary.competitorGapNarrative}
            </p>
          </CardContent>
        </Card>

        <Card className={panelClassName()}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">{isKo ? "점수 변화 추이" : "Score trend"}</CardTitle>
            <div className="flex items-center rounded-2xl bg-muted/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setTrendWindow("6")}
                className={cn(
                  "rounded-xl px-3 py-1.5 transition-colors",
                  trendWindow === "6" ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {isKo ? "최근 6회" : "Last 6"}
              </button>
              <button
                type="button"
                onClick={() => setTrendWindow("12")}
                className={cn(
                  "rounded-xl px-3 py-1.5 transition-colors",
                  trendWindow === "12"
                    ? "bg-background font-medium text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {isKo ? "최근 12주" : "Last 12w"}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart data={trendData} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr_1.15fr]">
        <Card className={panelClassName()}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">
              {isKo ? "개선 우선순위 TOP 5" : "Top 5 priority improvements"}
            </CardTitle>
            <Badge variant="outline">{result.recommendations.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="px-2 py-3 font-medium">{isKo ? "순위" : "Rank"}</th>
                    <th className="px-2 py-3 font-medium">{isKo ? "개선 항목" : "Recommendation"}</th>
                    <th className="px-2 py-3 font-medium">{isKo ? "영향도" : "Impact"}</th>
                    <th className="px-2 py-3 font-medium">{isKo ? "수정 난이도" : "Effort"}</th>
                    <th className="px-2 py-3 font-medium">{isKo ? "경쟁사 격차" : "Gap"}</th>
                    <th className="px-2 py-3 font-medium">{isKo ? "우선순위 점수" : "Priority"}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.recommendations.slice(0, 5).map((item, index) => {
                    const impact = getImpactLabel(item.impact, summaryLocale);
                    const effort = getEffortLabel(item.effort, summaryLocale);
                    const gap = getGapLabel(item.competitorGap, summaryLocale);

                    return (
                      <tr key={item.id} className="border-b last:border-b-0">
                        <td className="px-2 py-3 font-medium">{index + 1}</td>
                        <td className="px-2 py-3">
                          <div className="font-medium">{item.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{item.expectedImprovement}</div>
                        </td>
                        <td className="px-2 py-3">
                          <Badge className={cn("border-0", impact.className)}>{impact.label}</Badge>
                        </td>
                        <td className="px-2 py-3">
                          <Badge className={cn("border-0", effort.className)}>{effort.label}</Badge>
                        </td>
                        <td className="px-2 py-3">
                          <Badge className={cn("border-0", gap.className)}>{gap.label}</Badge>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex min-w-32 items-center gap-3">
                            <span className="w-8 text-sm font-medium">
                              {item.priorityScore.toFixed(1)}
                            </span>
                            <div className="h-2 flex-1 rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-linear-to-r from-amber-400 to-rose-500"
                                style={{
                                  width: `${(item.priorityScore / 5) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium text-primary"
            >
              {isKo ? "전체 개선 항목 보기" : "View all improvements"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>

        <Card className={panelClassName()}>
          <CardHeader>
            <CardTitle className="text-base">
              {isKo ? "보안 취약점 심각도" : "Security severity mix"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 lg:grid-cols-[1fr_140px] lg:items-center">
            <IssueSeverityDonut
              data={severityData}
              total={severityTotal}
              centerLabel={isKo ? "총 발견" : "total issues"}
            />
            <div className="space-y-3">
              {severityData.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={panelClassName()}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">{t("dashboard.coreVitals")}</CardTitle>
            <div className="flex items-center rounded-2xl bg-muted/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setVitalsView("mobile")}
                className={cn(
                  "rounded-xl px-3 py-1.5 transition-colors",
                  vitalsView === "mobile"
                    ? "bg-background font-medium text-primary shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {isKo ? "모바일" : "Mobile"}
              </button>
              <button
                type="button"
                onClick={() => setVitalsView("desktop")}
                className={cn(
                  "rounded-xl px-3 py-1.5 transition-colors",
                  vitalsView === "desktop"
                    ? "bg-background font-medium text-primary shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {isKo ? "데스크톱" : "Desktop"}
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {vitalRows.map((item) => {
              const tone = getVitalTone(item.key as "lcp" | "inp" | "cls", item.value, summaryLocale);

              return (
                <div key={item.key} className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{item.label}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-primary">{item.display}</div>
                      <Badge className={cn("border-0", tone.className)}>{tone.label}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative h-2 rounded-full bg-linear-to-r from-emerald-400 via-amber-400 to-rose-500">
                      {item.value !== undefined ? (
                        <span
                          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow-sm"
                          style={{
                            left: metricPosition(item.value, item.max),
                          }}
                        />
                      ) : null}
                    </div>
                    <div className="flex justify-end gap-12 text-xs text-muted-foreground">
                      {item.ticks.map((tick) => (
                        <span key={tick}>{tick}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.65fr_1.35fr]">
        <Card className={panelClassName("border-violet-200/70 bg-linear-to-br from-violet-50/80 via-white to-white")}>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{t("dashboard.aiSummary")}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{siteHost}</p>
              </div>
            </div>
            <Badge variant="outline">{result.summary.model}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-muted-foreground">{localizedSummary.overview}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("dashboard.keyRisks")}
                </div>
                {localizedSummary.keyRisks.map((item) => (
                  <div key={item} className="rounded-2xl bg-white/80 px-3 py-2 text-sm shadow-sm ring-1 ring-black/5">
                    {item}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("dashboard.nextActions")}
                </div>
                {localizedSummary.nextActions.map((item) => (
                  <div key={item} className="rounded-2xl bg-white/80 px-3 py-2 text-sm shadow-sm ring-1 ring-black/5">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={panelClassName()}>
          <CardHeader>
            <CardTitle className="text-base">{isKo ? "빠른 작업" : "Quick actions"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button className="h-12 justify-start rounded-2xl">
              <GaugeCircle className="h-4 w-4" />
              {isKo ? "새 분석 시작" : "Start new audit"}
            </Button>
            <Button variant="outline" className="h-12 justify-start rounded-2xl">
              <Download className="h-4 w-4" />
              {isKo ? "리포트 다운로드" : "Download report"}
            </Button>
            <Button variant="outline" className="h-12 justify-start rounded-2xl">
              <Plus className="h-4 w-4" />
              {t("actions.addCompetitor")}
            </Button>
            <Button variant="outline" className="h-12 justify-start rounded-2xl">
              <FileText className="h-4 w-4" />
              {isKo ? "알림 설정" : "Alert settings"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
