"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { IssueSeverityDonut } from "@/components/charts/issue-severity-donut";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getEffortLabel,
  getGapLabel,
  getCategoryLabel,
  getImpactLabel,
  getVitalTone,
  metricPosition,
  panelClassName,
} from "@/components/dashboard/dashboard-view-helpers";
import type { Finding, Recommendation, Severity, SummaryLocale } from "@/types/analysis";
import type {
  DashboardCompetitorGapLevels,
  DashboardSeverityDatum,
  DashboardVitalRow,
} from "./dashboard-view-types";

const severityOrder: Severity[] = ["critical", "high", "medium", "low", "info"];

export function DashboardDetailSections({
  recommendations,
  findings,
  publicRecommendations,
  isAuthenticated,
  isKo,
  showCompetitorGap,
  competitorGapLevels,
  summaryLocale,
  severityData,
  severityTotal,
  vitalRows,
  vitalsView,
  onVitalsViewChange,
  unlockRecommendationsPath,
}: {
  recommendations: Recommendation[];
  findings: Finding[];
  publicRecommendations: Recommendation[];
  isAuthenticated: boolean;
  isKo: boolean;
  showCompetitorGap: boolean;
  competitorGapLevels?: DashboardCompetitorGapLevels | null;
  summaryLocale: SummaryLocale;
  severityData: DashboardSeverityDatum[];
  severityTotal: number;
  vitalRows: DashboardVitalRow[];
  vitalsView: "mobile" | "desktop";
  onVitalsViewChange: (view: "mobile" | "desktop") => void;
  unlockRecommendationsPath: string;
}) {
  const [improvementsOpen, setImprovementsOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const securityFindings = useMemo(
    () => findings.filter((finding) => finding.category === "security"),
    [findings],
  );
  const securityRecommendations = useMemo(
    () => recommendations.filter((recommendation) => recommendation.category === "security"),
    [recommendations],
  );
  const securitySections = useMemo(
    () =>
      severityOrder
        .map((severity) => ({
          severity,
          findings: securityFindings.filter((finding) => finding.severity === severity),
          recommendations: securityRecommendations.filter(
            (recommendation) => recommendation.severity === severity,
          ),
        }))
        .filter((section) => section.findings.length > 0 || section.recommendations.length > 0),
    [securityFindings, securityRecommendations],
  );

  function getSeverityTone(severity: Severity) {
    if (severity === "critical") {
      return { label: isKo ? "치명" : "Critical", className: "bg-rose-50 text-rose-600" };
    }

    if (severity === "high") {
      return { label: isKo ? "높음" : "High", className: "bg-orange-50 text-orange-600" };
    }

    if (severity === "medium") {
      return { label: isKo ? "보통" : "Medium", className: "bg-amber-50 text-amber-600" };
    }

    if (severity === "low") {
      return { label: isKo ? "낮음" : "Low", className: "bg-emerald-50 text-emerald-600" };
    }

    return { label: isKo ? "알림" : "Info", className: "bg-slate-100 text-slate-600" };
  }

  function openImprovements() {
    if (!isAuthenticated) {
      window.location.assign(unlockRecommendationsPath);
      return;
    }

    setImprovementsOpen(true);
  }

  function formatEvidence(evidence: Record<string, unknown> | undefined) {
    if (!evidence) {
      return null;
    }

    const text = JSON.stringify(evidence);
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr_1.15fr]">
      <Card className={panelClassName()}>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            {isKo ? "개선 우선순위 TOP 5" : "Top 5 priority improvements"}
          </CardTitle>
          <Badge variant="outline">{recommendations.length}</Badge>
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
                  {showCompetitorGap ? (
                    <th className="px-2 py-3 font-medium">{isKo ? "경쟁사 격차" : "Gap"}</th>
                  ) : null}
                  <th className="px-2 py-3 font-medium">{isKo ? "우선순위 점수" : "Priority"}</th>
                </tr>
              </thead>
              <tbody>
                {publicRecommendations.map((item, index) => {
                  const impact = getImpactLabel(item.impact, summaryLocale);
                  const effort = getEffortLabel(item.effort, summaryLocale);
                  const gap = getGapLabel(competitorGapLevels?.[item.category] ?? 0, summaryLocale);

                  return (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="px-2 py-3 font-medium">{index + 1}</td>
                      <td className="px-2 py-3">
                        <div className="font-medium">{item.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{item.expectedImprovement}</div>
                      </td>
                      <td className="px-2 py-3">
                        <Badge className={impact.className}>{impact.label}</Badge>
                      </td>
                      <td className="px-2 py-3">
                        <Badge className={effort.className}>{effort.label}</Badge>
                      </td>
                      {showCompetitorGap ? (
                        <td className="px-2 py-3">
                          <Badge className={gap.className}>{gap.label}</Badge>
                        </td>
                      ) : null}
                      <td className="px-2 py-3">
                        <div className="flex min-w-32 items-center gap-3">
                          <span className="w-8 text-sm font-medium">{item.priorityScore.toFixed(1)}</span>
                          <div className="h-2 flex-1 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-linear-to-r from-amber-400 to-rose-500"
                              style={{ width: `${(item.priorityScore / 5) * 100}%` }}
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
            onClick={openImprovements}
          >
            {isAuthenticated
              ? isKo
                ? "전체 개선 항목 보기"
                : "View all improvements"
              : isKo
                ? "로그인해서 전체 개선 항목 보기"
                : "Sign in to unlock all improvements"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </CardContent>
      </Card>

      <Dialog open={improvementsOpen} onOpenChange={setImprovementsOpen}>
        <DialogContent className="max-w-5xl p-0">
          <DialogHeader className="border-b px-6 pt-6">
            <DialogTitle>{isKo ? "전체 개선 항목" : "All improvement items"}</DialogTitle>
            <DialogDescription>
              {isKo
                ? "권장 작업 전체를 우선순위, 영향도, 난이도 기준으로 한 번에 확인할 수 있습니다."
                : "Review the full recommendation list with priority, impact, and effort in one place."}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
            {recommendations.map((item, index) => {
              const impact = getImpactLabel(item.impact, summaryLocale);
              const effort = getEffortLabel(item.effort, summaryLocale);
              const gap = getGapLabel(competitorGapLevels?.[item.category] ?? 0, summaryLocale);
              const severity = getSeverityTone(item.severity);

              return (
                <div key={item.id} className="rounded-xl border bg-card/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <Badge variant="outline">{getCategoryLabel(item.category, summaryLocale)}</Badge>
                        <Badge className={severity.className}>{severity.label}</Badge>
                      </div>
                      <div className="text-base font-semibold">{item.title}</div>
                      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="min-w-44 rounded-lg bg-muted/40 px-3 py-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {isKo ? "우선순위 점수" : "Priority score"}
                      </div>
                      <div className="mt-1 text-2xl font-semibold">{item.priorityScore.toFixed(1)}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className={impact.className}>
                      {isKo ? "영향도" : "Impact"} · {impact.label}
                    </Badge>
                    <Badge className={effort.className}>
                      {isKo ? "수정 난이도" : "Effort"} · {effort.label}
                    </Badge>
                    {showCompetitorGap ? (
                      <Badge className={gap.className}>
                        {isKo ? "경쟁사 격차" : "Gap"} · {gap.label}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-4 rounded-lg border bg-background/70 px-3 py-3 text-sm text-muted-foreground">
                    <div className="text-xs font-medium uppercase tracking-wide">
                      {isKo ? "예상 개선 효과" : "Expected improvement"}
                    </div>
                    <div className="mt-1 leading-6">{item.expectedImprovement}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <Card className={panelClassName()}>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            {isKo ? "보안 취약점 심각도" : "Security severity mix"}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setSecurityOpen(true)}>
            <ShieldAlert className="h-3.5 w-3.5" />
            {isKo ? "자세히 보기" : "View details"}
          </Button>
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

      <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="border-b px-6 pt-6">
            <DialogTitle>{isKo ? "보안 취약점 심각도 상세" : "Security severity details"}</DialogTitle>
            <DialogDescription>
              {isKo
                ? "보안 카테고리에서 감지된 취약점과 권장 조치를 심각도 기준으로 정리했습니다."
                : "Review security findings and recommended fixes grouped by severity."}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {severityData.map((item) => (
                <div key={item.label} className="rounded-xl border bg-card/60 p-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <div className="text-sm font-medium">{item.label}</div>
                  </div>
                  <div className="mt-2 text-2xl font-semibold">{item.value}</div>
                </div>
              ))}
            </div>

            {securitySections.length > 0 ? (
              securitySections.map((section) => {
                const severity = getSeverityTone(section.severity);

                return (
                  <section key={section.severity} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={severity.className}>{severity.label}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {(section.findings.length + section.recommendations.length).toString()}
                      </span>
                    </div>
                    <div className="grid gap-3">
                      {section.findings.map((finding) => {
                        const evidence = formatEvidence(finding.evidence);

                        return (
                          <div key={finding.id} className="rounded-xl border bg-card/60 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{isKo ? "취약점" : "Finding"}</Badge>
                              <Badge variant="outline">{getCategoryLabel(finding.category, summaryLocale)}</Badge>
                            </div>
                            <div className="mt-3 text-base font-semibold">{finding.title}</div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {finding.description}
                            </p>
                            {evidence ? (
                              <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {isKo ? "근거 데이터" : "Evidence"}
                                </span>
                                <div className="mt-1 break-all">{evidence}</div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                      {section.recommendations.map((recommendation) => {
                        const impact = getImpactLabel(recommendation.impact, summaryLocale);
                        const effort = getEffortLabel(recommendation.effort, summaryLocale);

                        return (
                          <div key={recommendation.id} className="rounded-xl border bg-card/60 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{isKo ? "권장 조치" : "Recommended action"}</Badge>
                              <Badge variant="outline">{getCategoryLabel(recommendation.category, summaryLocale)}</Badge>
                              <Badge className={impact.className}>
                                {isKo ? "영향도" : "Impact"} · {impact.label}
                              </Badge>
                              <Badge className={effort.className}>
                                {isKo ? "난이도" : "Effort"} · {effort.label}
                              </Badge>
                            </div>
                            <div className="mt-3 text-base font-semibold">{recommendation.title}</div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {recommendation.description}
                            </p>
                            <div className="mt-3 rounded-lg bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                              <div className="text-xs font-medium uppercase tracking-wide">
                                {isKo ? "예상 개선 효과" : "Expected improvement"}
                              </div>
                              <div className="mt-1 leading-6">{recommendation.expectedImprovement}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                {isKo
                  ? "현재 결과에서는 별도의 보안 취약점 상세 항목이 없습니다."
                  : "No detailed security items are available in the current result."}
              </div>
            )}
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <Card className={panelClassName()}>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">{isKo ? "Core Web Vitals" : "Core Web Vitals"}</CardTitle>
          <div className="flex items-center rounded-lg bg-muted/80 p-1 text-xs">
            <button
              type="button"
              onClick={() => onVitalsViewChange("mobile")}
              className={
                vitalsView === "mobile"
                  ? "rounded-md bg-background px-3 py-1.5 font-medium text-primary shadow-sm"
                  : "rounded-md px-3 py-1.5 text-muted-foreground transition-colors"
              }
            >
              {isKo ? "모바일" : "Mobile"}
            </button>
            <button
              type="button"
              onClick={() => onVitalsViewChange("desktop")}
              className={
                vitalsView === "desktop"
                  ? "rounded-md bg-background px-3 py-1.5 font-medium text-primary shadow-sm"
                  : "rounded-md px-3 py-1.5 text-muted-foreground transition-colors"
              }
            >
              {isKo ? "데스크톱" : "Desktop"}
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {vitalRows.map((item) => {
            const tone = getVitalTone(item.key, item.value, summaryLocale);

            return (
              <div key={item.key} className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{item.label}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-primary">{item.display}</div>
                    <Badge className={tone.className}>{tone.label}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative h-2 rounded-full bg-linear-to-r from-emerald-400 via-amber-400 to-rose-500">
                    {item.value !== undefined ? (
                      <span
                        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow-sm"
                        style={{ left: metricPosition(item.value, item.max) }}
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
  );
}
