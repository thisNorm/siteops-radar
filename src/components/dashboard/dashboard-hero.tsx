"use client";

import { CalendarClock } from "lucide-react";
import { AnalyzePanel } from "@/components/dashboard/analyze-panel";
import { formatTimestamp } from "@/components/dashboard/dashboard-view-helpers";
import type { AnalyzerResult, SummaryLocale } from "@/types/analysis";

export function DashboardHero({
  isAuthenticated,
  isKo,
  userName,
  summaryLocale,
  lastAnalyzedAt,
  onResult,
}: {
  isAuthenticated: boolean;
  isKo: boolean;
  userName?: string | null;
  summaryLocale: SummaryLocale;
  lastAnalyzedAt: Date;
  onResult: (result: AnalyzerResult) => void;
}) {
  const displayName = userName?.split(" ")[0] ?? "John";

  return (
    <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-[1.65rem]">
          {isAuthenticated
            ? isKo
              ? `안녕하세요, ${displayName}님!`
              : `Hello, ${displayName}!`
            : isKo
              ? "안녕하세요, John님!"
              : "Hello, John!"}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {isAuthenticated
            ? isKo
              ? "오늘도 사이트의 성장을 함께 모니터링해요."
              : "Keep monitoring your website growth today."
            : isKo
              ? "로그인 없이 핵심 점수를 먼저 확인하고, 상세 리포트는 계정에 저장하세요."
              : "Preview core scores now, then save the full report to your workspace."}
        </p>
      </div>
      <div className="w-full max-w-3xl">
        <AnalyzePanel
          onResult={onResult}
          className="w-full"
          meta={
            <div className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              <span>
                {isKo ? "최근 분석" : "Recent analysis"}: {formatTimestamp(lastAnalyzedAt, summaryLocale)}
              </span>
            </div>
          }
        />
      </div>
    </section>
  );
}
