"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthGauge } from "@/components/charts/health-gauge";
import { MiniSparkline } from "@/components/charts/mini-sparkline";
import { cn } from "@/lib/utils";
import {
  buildSparklineValues,
  getScoreTone,
  panelClassName,
} from "@/components/dashboard/dashboard-view-helpers";
import type { AnalysisCategory, AnalyzerResult, Finding, SummaryLocale } from "@/types/analysis";
import type { DashboardAnalysisMode, DashboardMetricCard } from "./dashboard-view-types";

const findingSeverityRank: Record<Finding["severity"], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

function getTopFindings(findings: Finding[], category?: AnalysisCategory) {
  return findings
    .filter((finding) => (category ? finding.category === category : true))
    .sort((left, right) => findingSeverityRank[right.severity] - findingSeverityRank[left.severity])
    .slice(0, 2);
}

function formatSeconds(milliseconds?: number) {
  return typeof milliseconds === "number" ? `${(milliseconds / 1000).toFixed(1)}s` : null;
}

function describeFinding(finding: Finding, isKo: boolean) {
  switch (finding.id) {
    case "seo-title-missing":
      return isKo ? "title 태그 없음" : "Missing title tag";
    case "seo-description-missing":
      return isKo ? "meta description 없음" : "Missing meta description";
    case "aeogeo-structured-data-missing":
      return isKo ? "구조화 데이터 없음" : "No structured data detected";
    case "aeogeo-faq-missing":
      return isKo ? "FAQ 구조 없음" : "FAQ structure missing";
    case "performance-pagespeed-low":
      return isKo ? "PageSpeed 성능 낮음" : "Low PageSpeed performance";
    case "security-csp-missing":
      return isKo ? "CSP 없음" : "Missing CSP";
    case "security-hsts-missing":
      return isKo ? "HSTS 없음" : "Missing HSTS";
    case "security-referrer-policy-missing":
      return isKo ? "Referrer-Policy 없음" : "Missing Referrer-Policy";
    case "security-clickjacking-policy-missing":
      return isKo ? "클릭재킹 보호 없음" : "Missing clickjacking protection";
    case "security-cookie-secure-missing":
      return isKo ? "Secure 쿠키 플래그 없음" : "Cookie missing Secure flag";
    case "security-cookie-httponly-missing":
      return isKo ? "HttpOnly 쿠키 플래그 없음" : "Cookie missing HttpOnly flag";
    case "accessibility-image-alt-missing": {
      const missingAlt = typeof finding.evidence?.missingAlt === "number" ? finding.evidence.missingAlt : undefined;
      return isKo
        ? `alt 누락 이미지${missingAlt ? ` ${missingAlt}개` : ""}`
        : `${missingAlt ?? "Some"} image${missingAlt === 1 ? "" : "s"} missing alt`;
    }
    case "content-h1-count": {
      const h1Count = typeof finding.evidence?.h1 === "number" ? finding.evidence.h1 : undefined;
      return isKo ? `H1 구조 불명확${h1Count !== undefined ? ` (${h1Count}개)` : ""}` : `Unclear H1 structure${h1Count !== undefined ? ` (${h1Count})` : ""}`;
    }
    case "technical-canonical-missing":
      return isKo ? "canonical 없음" : "Missing canonical";
    case "technical-robots-missing":
      return isKo ? "robots.txt 없음" : "robots.txt missing";
    case "technical-sitemap-missing":
      return isKo ? "sitemap 없음" : "Sitemap missing";
    case "technical-external-script-overload":
      return isKo ? "외부 스크립트 과다" : "Too many external scripts";
    case "technical-broken-assets":
      return isKo ? "깨진 asset 있음" : "Broken assets detected";
    default:
      return finding.title;
  }
}

function buildOverallReason(result: AnalyzerResult, isKo: boolean) {
  const topFindings = getTopFindings(result.findings);

  if (topFindings.length === 0) {
    return isKo ? "7개 영역 기준으로 큰 감점 이슈가 적습니다" : "Few major deductions across the 7 score areas";
  }

  return isKo
    ? `주요 이슈: ${topFindings.map((finding) => describeFinding(finding, true)).join(" · ")}`
    : `Top issues: ${topFindings.map((finding) => describeFinding(finding, false)).join(" · ")}`;
}

function buildMetricReason(category: AnalysisCategory, result: AnalyzerResult, isKo: boolean) {
  const categoryFindings = getTopFindings(result.findings, category);
  const reasons: string[] = [];
  const { snapshot } = result;

  if (category === "performance" && snapshot.pageSpeed?.performance !== undefined) {
    const lcp = formatSeconds(snapshot.pageSpeed.largestContentfulPaintMs);
    reasons.push(
      isKo
        ? `PageSpeed ${snapshot.pageSpeed.strategy} ${snapshot.pageSpeed.performance}점${lcp ? ` · LCP ${lcp}` : ""}`
        : `PageSpeed ${snapshot.pageSpeed.strategy} ${snapshot.pageSpeed.performance}${lcp ? ` · LCP ${lcp}` : ""}`,
    );
  }

  if (category === "seo" && snapshot.pageSpeed?.seo !== undefined) {
    reasons.push(
      isKo ? `Lighthouse SEO ${snapshot.pageSpeed.seo}점 기준` : `Based on Lighthouse SEO ${snapshot.pageSpeed.seo}`,
    );
  }

  if (category === "accessibility" && snapshot.pageSpeed?.accessibility !== undefined) {
    reasons.push(
      isKo
        ? `Lighthouse 접근성 ${snapshot.pageSpeed.accessibility}점 기준`
        : `Based on Lighthouse accessibility ${snapshot.pageSpeed.accessibility}`,
    );
  }

  if (categoryFindings.length > 0) {
    reasons.push(...categoryFindings.map((finding) => describeFinding(finding, isKo)));
  } else {
    switch (category) {
      case "seo":
        reasons.push(
          snapshot.fetchedTitle && snapshot.fetchedDescription
            ? isKo
              ? "title·description 확인됨"
              : "Title and description detected"
            : isKo
              ? "메타 정보 일부만 확인됨"
              : "Only part of the meta setup was detected",
        );
        break;
      case "aeogeo":
        reasons.push(
          snapshot.structuredDataTypes.length > 0
            ? isKo
              ? `구조화 데이터 ${snapshot.structuredDataTypes.length}종 감지`
              : `${snapshot.structuredDataTypes.length} structured data type${snapshot.structuredDataTypes.length > 1 ? "s" : ""} detected`
            : isKo
              ? "답변형 신호가 제한적입니다"
              : "Answer-engine signals are limited",
        );
        break;
      case "performance":
        reasons.push(
          isKo ? "핵심 성능 감점 이슈가 크지 않습니다" : "No major performance deduction detected",
        );
        break;
      case "security":
        reasons.push(
          isKo ? "주요 보안 헤더는 비교적 안정적입니다" : "Core security headers look relatively healthy",
        );
        break;
      case "accessibility":
        reasons.push(
          snapshot.imageSummary.missingAlt > 0
            ? isKo
              ? `alt 누락 이미지 ${snapshot.imageSummary.missingAlt}개`
              : `${snapshot.imageSummary.missingAlt} image${snapshot.imageSummary.missingAlt > 1 ? "s" : ""} missing alt`
            : isKo
              ? "대표 접근성 감점 이슈가 없습니다"
              : "No notable accessibility deduction detected",
        );
        break;
      case "contentQuality":
        reasons.push(
          snapshot.headingsSummary.h1 === 1
            ? isKo
              ? "H1 구조가 명확합니다"
              : "The H1 structure is clear"
            : isKo
              ? `H1 ${snapshot.headingsSummary.h1}개 감지`
              : `${snapshot.headingsSummary.h1} H1 tags detected`,
        );
        break;
      case "technicalHealth":
        reasons.push(
          snapshot.sitemap.exists || snapshot.robotsTxt.exists
            ? isKo
              ? "robots·sitemap 점검 결과 반영"
              : "Based on robots and sitemap checks"
            : isKo
              ? "기술 설정 점검 신호가 부족합니다"
              : "Technical setup signals are limited",
        );
        break;
    }
  }

  return reasons.slice(0, 2).join(" · ");
}

export function DashboardScoreSection({
  result,
  summaryLocale,
  healthDelta,
  hasHistory,
  analysisMode,
  metricCards,
  isKo,
}: {
  result: AnalyzerResult;
  summaryLocale: SummaryLocale;
  healthDelta: number | null;
  hasHistory: boolean;
  analysisMode: DashboardAnalysisMode;
  metricCards: DashboardMetricCard[];
  isKo: boolean;
}) {
  const currentScoreLabel =
    analysisMode === "sample"
      ? isKo
        ? "예시 점수"
        : "Sample score"
      : isKo
        ? "현재 점수"
        : "Current score";
  const overallReason = buildOverallReason(result, isKo);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-9">
      <Card className={panelClassName("xl:col-span-2")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isKo ? "전체 건강 점수" : "Overall health score"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <HealthGauge score={result.scores.overall} />
          <div className="flex items-center justify-center">
            <Badge className={getScoreTone(result.scores.overall, summaryLocale).className}>
              {getScoreTone(result.scores.overall, summaryLocale).label}
            </Badge>
          </div>
          <p className="text-center text-xs leading-5 text-muted-foreground">{overallReason}</p>
          {hasHistory && healthDelta !== null ? (
            <p className="text-center text-sm text-muted-foreground">
              <span className={healthDelta >= 0 ? "font-medium text-emerald-600" : "font-medium text-rose-600"}>
                {healthDelta >= 0 ? "▲ " : ""}
                {healthDelta}
              </span>{" "}
              {isKo ? "점 상승" : "score change"}
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground">{currentScoreLabel}</p>
          )}
        </CardContent>
      </Card>

      {metricCards.map((metric, index) => {
        const tone = getScoreTone(metric.score, summaryLocale);
        const Icon = metric.icon;
        const scoreReason = buildMetricReason(metric.key, result, isKo);

        return (
          <Card key={metric.key} size="sm" className={panelClassName("min-h-[198px]")}>
            <CardContent className="flex h-full flex-col justify-between gap-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{metric.label}</div>
                <div className="mt-4 text-2xl font-semibold tracking-tight">
                  {metric.score}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">/ 100</span>
                </div>
                <Badge className={cn("mt-2 rounded-md px-2", tone.className)}>{tone.label}</Badge>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">{scoreReason}</p>
              </div>
              {hasHistory ? (
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
              ) : (
                <div className="text-xs font-medium text-muted-foreground">{currentScoreLabel}</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
