"use client";

import { Download, FileText, GaugeCircle, Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { panelClassName } from "@/components/dashboard/dashboard-view-helpers";
import type { DashboardAnalysisMode, DashboardLocalizedSummary } from "./dashboard-view-types";

export function DashboardSummaryActionsSection({
  isKo,
  siteHost,
  localizedSummary,
  model,
  analysisMode,
}: {
  isKo: boolean;
  siteHost: string;
  localizedSummary: DashboardLocalizedSummary;
  model: string;
  analysisMode: DashboardAnalysisMode;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1.65fr_1.35fr]">
      <Card className={panelClassName("border-violet-300/70 bg-linear-to-br from-violet-50/80 via-white to-card dark:from-violet-950/20 dark:via-card dark:to-card")}>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{isKo ? "AI 요약" : "AI summary"}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{siteHost}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {analysisMode === "sample" ? (
              <Badge variant="secondary">{isKo ? "예시 데이터" : "Sample"}</Badge>
            ) : null}
            <Badge variant="outline">{model}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">{localizedSummary.overview}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {isKo ? "핵심 위험" : "Key risks"}
              </div>
              {localizedSummary.keyRisks.map((item) => (
                <div key={item} className="rounded-md bg-white/80 px-3 py-2 text-sm ring-1 ring-black/5 dark:bg-white/5">
                  {item}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {isKo ? "다음 액션" : "Next actions"}
              </div>
              {localizedSummary.nextActions.map((item) => (
                <div key={item} className="rounded-md bg-white/80 px-3 py-2 text-sm ring-1 ring-black/5 dark:bg-white/5">
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
          <Button className="h-11 justify-start rounded-lg">
            <GaugeCircle className="h-4 w-4" />
            {isKo ? "새 분석 시작" : "Start new audit"}
          </Button>
          <Button variant="outline" className="h-11 justify-start rounded-lg">
            <Download className="h-4 w-4" />
            {isKo ? "리포트 다운로드" : "Download report"}
          </Button>
          <Button variant="outline" className="h-11 justify-start rounded-lg">
            <Plus className="h-4 w-4" />
            {isKo ? "경쟁사 추가" : "Add competitor"}
          </Button>
          <Button variant="outline" className="h-11 justify-start rounded-lg">
            <FileText className="h-4 w-4" />
            {isKo ? "알림 설정" : "Alert settings"}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
