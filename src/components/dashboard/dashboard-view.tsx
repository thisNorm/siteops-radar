"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowUpRight, Clock, ShieldCheck, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AnalyzePanel } from "@/components/dashboard/analyze-panel";
import { RecommendationList } from "@/components/dashboard/recommendation-list";
import { CategoryRadar } from "@/components/charts/category-radar";
import { CompetitorBars } from "@/components/charts/competitor-bars";
import { HealthGauge } from "@/components/charts/health-gauge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buildCompetitorGapInsights } from "@/lib/analysis/competitor-gap";
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

export function DashboardView({ initialResult }: { initialResult: AnalyzerResult }) {
  const t = useTranslations();
  const locale = useLocale();
  const summaryLocale: SummaryLocale = locale === "ko" ? "ko" : "en";
  const [result, setResult] = useState(initialResult);
  const pageSpeed = result.snapshot.pageSpeed;

  const radarData = useMemo(
    () =>
      categoryKeys.map((category) => ({
        category: t(`categories.${category}`),
        score: result.scores[category],
      })),
    [result, t],
  );

  const competitorData = useMemo(
    () =>
      buildCompetitorGapInsights(result.scores, result.recommendations)
        .slice(0, 4)
        .map((item) => ({
          category: t(`categories.${item.category}`),
          ours: item.ours,
          competitor: item.competitor,
        })),
    [result, t],
  );
  const localizedSummary = result.summary[summaryLocale];

  const vitals = [
    [
      "LCP",
      pageSpeed?.largestContentfulPaintMs
        ? `${(pageSpeed.largestContentfulPaintMs / 1000).toFixed(1)}s`
        : "-",
      pageSpeed?.performance && pageSpeed.performance >= 80 ? "Good" : "Needs watch",
      Zap,
    ],
    [
      "INP",
      pageSpeed?.interactionToNextPaintMs
        ? `${Math.round(pageSpeed.interactionToNextPaintMs)}ms`
        : "-",
      pageSpeed?.interactionToNextPaintMs && pageSpeed.interactionToNextPaintMs < 200
        ? "Good"
        : "Needs watch",
      Activity,
    ],
    [
      "CLS",
      pageSpeed?.cumulativeLayoutShift !== undefined
        ? pageSpeed.cumulativeLayoutShift.toFixed(2)
        : "-",
      pageSpeed?.cumulativeLayoutShift !== undefined && pageSpeed.cumulativeLayoutShift < 0.1
        ? "Good"
        : "Needs watch",
      ShieldCheck,
    ],
    [
      "PSI",
      pageSpeed ? `${pageSpeed.performance ?? "-"} / 100` : "Off",
      pageSpeed?.strategy ?? "api key required",
      Clock,
    ],
  ] as const;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Badge variant="outline">{t("dashboard.eyebrow")}</Badge>
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              {t("dashboard.title")}
            </h1>
            <p className="text-base leading-7 text-muted-foreground md:text-lg">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <AnalyzePanel onResult={setResult} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.overallHealth")}</CardTitle>
          </CardHeader>
          <CardContent>
            <HealthGauge score={result.scores.overall} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {vitals.map(([label, value, detail, Icon]) => (
          <Card key={label as string}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{label as string}</div>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 text-2xl font-semibold">{value as string}</div>
              <div className="mt-1 text-xs text-muted-foreground">{detail as string}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.categoryScores")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryRadar data={radarData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.topRecommendations")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RecommendationList items={result.recommendations} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.competitorGap")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CompetitorBars data={competitorData} />
            <p className="text-sm leading-7 text-muted-foreground">
              {localizedSummary.competitorGapNarrative}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <span>{t("dashboard.aiSummary")}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{result.summary.model}</Badge>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-7 text-muted-foreground">{localizedSummary.overview}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("dashboard.keyRisks")}
                </div>
                <div className="space-y-2 text-sm">
                  {localizedSummary.keyRisks.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("dashboard.nextActions")}
                </div>
                <div className="space-y-2 text-sm">
                  {localizedSummary.nextActions.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {categoryKeys.slice(0, 5).map((category) => (
                <div key={category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{t(`categories.${category}`)}</span>
                    <span className="text-muted-foreground">{result.scores[category]}</span>
                  </div>
                  <Progress value={result.scores[category]} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
