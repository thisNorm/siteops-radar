"use client";

import { Download, FileText, GaugeCircle, Plus, Sparkles } from "lucide-react";
import { LockedPreview } from "@/components/dashboard/locked-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { panelClassName } from "@/components/dashboard/dashboard-view-helpers";
import type { DashboardLocalizedSummary } from "./dashboard-view-types";

export function DashboardSummaryActionsSection({
  isAuthenticated,
  isKo,
  siteHost,
  localizedSummary,
  model,
  unlockCurrentDashboardPath,
  unlockProjectsPath,
}: {
  isAuthenticated: boolean;
  isKo: boolean;
  siteHost: string;
  localizedSummary: DashboardLocalizedSummary;
  model: string;
  unlockCurrentDashboardPath: string;
  unlockProjectsPath: string;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1.65fr_1.35fr]">
      <LockedPreview
        locked={!isAuthenticated}
        signInPath={unlockCurrentDashboardPath}
        title={isKo ? "로그인해서 AI 요약 보기" : "Sign in to unlock AI summary"}
        description={
          isKo
            ? "리스크, 다음 액션, 경쟁사 내러티브까지 포함한 전체 AI 요약은 로그인 후 이어집니다."
            : "The full AI summary with risks, next steps, and competitor narrative unlocks after sign-in."
        }
      >
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
            <Badge variant="outline">{model}</Badge>
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
      </LockedPreview>

      <LockedPreview
        locked={!isAuthenticated}
        signInPath={unlockProjectsPath}
        title={isKo ? "로그인해서 프로젝트 관리하기" : "Sign in to manage projects"}
        description={
          isKo
            ? "프로젝트 저장, 경쟁사 추가, 리포트 다운로드 같은 작업은 로그인 후 사용할 수 있습니다."
            : "Project saving, competitor setup, and report downloads unlock after sign-in."
        }
      >
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
      </LockedPreview>
    </section>
  );
}
