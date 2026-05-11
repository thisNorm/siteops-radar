"use client";

import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnalyzePanel } from "@/components/dashboard/analyze-panel";
import { formatTimestamp } from "@/components/dashboard/dashboard-view-helpers";
import type { AnalyzerResult, SummaryLocale } from "@/types/analysis";
import type {
  DashboardAnalysisMode,
  DashboardAnalyzeMeta,
  DashboardProjectOption,
} from "./dashboard-view-types";

export function DashboardHero({
  isAuthenticated,
  isKo,
  userName,
  summaryLocale,
  lastAnalyzedAt,
  analysisMode,
  hasHistory,
  projectOptions,
  selectedProjectId,
  selectedProjectUrl,
  onProjectSelect,
  onResult,
}: {
  isAuthenticated: boolean;
  isKo: boolean;
  userName?: string | null;
  summaryLocale: SummaryLocale;
  lastAnalyzedAt: Date | null;
  analysisMode: DashboardAnalysisMode;
  hasHistory: boolean;
  projectOptions: DashboardProjectOption[];
  selectedProjectId: string | null;
  selectedProjectUrl?: string;
  onProjectSelect: (projectId: string) => void;
  onResult: (result: AnalyzerResult, meta: DashboardAnalyzeMeta) => void;
}) {
  const displayName = userName?.split(" ")[0] ?? (isKo ? "Operator" : "Operator");
  const statusLabel =
    analysisMode === "sample"
      ? isKo
        ? "예시 데이터"
        : "Sample data"
      : analysisMode === "adhoc"
        ? isKo
          ? "단순 검색"
          : "Ad hoc search"
        : analysisMode === "project-list"
          ? isKo
            ? "저장된 사이트 목록"
            : "Saved site list"
        : analysisMode === "managed-empty"
          ? isKo
            ? "분석 대기 중"
            : "Awaiting analysis"
        : hasHistory
          ? isKo
            ? "프로젝트 관리 중"
            : "Managed project"
          : isKo
            ? "첫 프로젝트 분석"
            : "First managed run";
  const noticeMessage =
    analysisMode === "sample"
      ? isKo
        ? "현재 보이는 점수는 예시 데이터입니다. 사이트를 검색하면 실제 현재 점수로 바뀝니다."
        : "The scores currently shown are sample data. Search a site to replace them with live current scores."
      : analysisMode === "adhoc"
        ? isKo
          ? "단순 검색 결과는 현재 점수만 보여주며, 프로젝트에 추가한 뒤부터 이력과 추이를 관리합니다."
          : "Ad hoc searches show only the current score. History and trends begin once the site is added to a project."
        : analysisMode === "project-list"
          ? isKo
            ? "프로젝트에 등록한 사이트들을 카드로 둘러보고, 원하는 사이트를 선택해 상세 정보를 확인하세요. 상단 검색은 계속 단순 검색용으로 사용할 수 있습니다."
            : "Browse your saved sites as cards, open any site for details, and keep using the top search for one-off checks."
        : analysisMode === "managed-empty"
          ? isKo
            ? "선택한 사이트는 프로젝트에 저장되어 있습니다. 첫 분석을 실행하면 이 대시보드에서 바로 결과를 볼 수 있습니다."
            : "The selected site is saved in your projects. Run the first analysis to view it right here on the dashboard."
        : hasHistory
          ? null
          : isKo
            ? "프로젝트에 저장된 첫 분석입니다. 다음 분석부터 점수 변화와 추이가 표시됩니다."
            : "This is the first saved project analysis. Score changes and trends appear from the next run onward.";
  const selectorValue = selectedProjectId ?? "__sample__";

  return (
    <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight md:text-[1.65rem]">
          {isAuthenticated
            ? isKo
              ? `안녕하세요, ${displayName}님!`
              : `Hello, ${displayName}!`
            : isKo
              ? "로그인 없이 사이트 진단을 바로 실행하세요"
              : "Run a live site audit without signing in"}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {isAuthenticated
            ? isKo
              ? "오늘도 사이트의 성장을 함께 모니터링해요."
              : "Keep monitoring your website growth today."
            : isKo
              ? "핵심 점수와 상세 리포트를 공개 워크스페이스에서 바로 확인할 수 있습니다."
              : "Core scores and detailed reports are available immediately in the open workspace."}
        </p>
        <div className="flex max-w-2xl flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-card/70 px-3 py-2 text-sm">
          <Badge variant="outline">{statusLabel}</Badge>
          <span className="text-muted-foreground">{noticeMessage}</span>
        </div>
        {isAuthenticated ? (
          <div className="max-w-2xl rounded-lg border border-border/70 bg-card/70 px-3 py-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {isKo ? "저장된 사이트 보기" : "Saved sites"}
            </div>
            {projectOptions.length > 0 ? (
              <div className="space-y-2">
                <Select
                  value={selectorValue}
                  onValueChange={(value) => {
                    if (value) {
                      onProjectSelect(value);
                    }
                  }}
                >
                  <SelectTrigger className="h-10 w-full rounded-lg bg-background">
                    <SelectValue
                      placeholder={isKo ? "저장된 사이트를 선택하세요" : "Choose a saved site"}
                    />
                  </SelectTrigger>
                    <SelectContent align="start">
                      <SelectItem value="__sample__">
                        {isKo ? "저장된 사이트 목록 보기" : "Show saved site list"}
                      </SelectItem>
                    {projectOptions.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {selectedProjectId
                    ? isKo
                      ? `선택한 사이트: ${selectedProjectUrl ?? "-"}`
                      : `Selected site: ${selectedProjectUrl ?? "-"}`
                    : isKo
                      ? "프로젝트에 추가한 사이트의 최신 분석 결과를 여기서 바로 불러올 수 있습니다."
                      : "Load the latest analysis for any saved site right here."}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isKo
                  ? "프로젝트에 사이트를 추가하면 여기서 바로 선택해 볼 수 있습니다."
                  : "Add a site to your projects to pick it here."}
              </p>
            )}
          </div>
        ) : null}
      </div>
      <div className="w-full max-w-3xl">
        <AnalyzePanel
          onResult={onResult}
          className="w-full"
          defaultUrl={selectedProjectUrl}
          meta={
            <div className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
              {lastAnalyzedAt ? (
                <>
                  <CalendarClock className="h-4 w-4" />
                  <span>
                    {isKo ? "최근 분석" : "Recent analysis"}: {formatTimestamp(lastAnalyzedAt, summaryLocale)}
                  </span>
                </>
              ) : (
                <span>
                  {analysisMode === "project-list"
                    ? isKo
                      ? "저장된 사이트를 선택해보세요"
                      : "Select a saved site"
                    : isKo
                      ? "예시 데이터 표시 중"
                      : "Showing sample preview"}
                </span>
              )}
            </div>
          }
        />
      </div>
    </section>
  );
}
