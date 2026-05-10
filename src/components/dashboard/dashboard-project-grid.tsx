"use client";

import { ExternalLink, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getScoreTone, panelClassName, safeHostname } from "@/components/dashboard/dashboard-view-helpers";
import type { DashboardProjectOption } from "./dashboard-view-types";

function buildFaviconUrl(url: string) {
  return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(url)}`;
}

export function DashboardProjectGrid({
  isKo,
  projects,
  onSelect,
}: {
  isKo: boolean;
  projects: DashboardProjectOption[];
  onSelect: (projectId: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          {isKo ? "저장된 사이트를 선택해보세요" : "Choose a saved site"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isKo
            ? "프로젝트에 추가한 사이트를 카드로 빠르게 둘러보고, 원하는 사이트를 열어 상세 점수와 분석 내용을 확인할 수 있습니다."
            : "Browse your saved sites as cards, then open any site to review its detailed scores and analysis."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const faviconUrl = buildFaviconUrl(project.url);
          const hostname = safeHostname(project.url);
          const overallTone = project.latestScores
            ? getScoreTone(project.latestScores.overall, isKo ? "ko" : "en")
            : null;

          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelect(project.id)}
              className={`${panelClassName("text-left transition-transform hover:-translate-y-0.5")} overflow-hidden`}
            >
              <div className="relative aspect-[16/9] border-b border-border/60 bg-linear-to-br from-slate-100 via-white to-slate-50 px-5 py-5 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
                <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-violet-500 via-sky-500 to-emerald-500" />
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="h-14 w-14 rounded-2xl border border-white/80 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/10"
                      style={{
                        backgroundImage: `url(${faviconUrl})`,
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "30px 30px",
                      }}
                    />
                    <Badge variant="outline" className="gap-1 rounded-md bg-background/80">
                      <ExternalLink className="h-3 w-3" />
                      {hostname}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {project.hasAnalysis
                      ? isKo
                        ? "저장된 최신 분석을 열어봅니다"
                        : "Open the latest saved analysis"
                      : isKo
                        ? "아직 저장된 분석이 없습니다"
                        : "No saved analysis yet"}
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-5 py-4">
                <div className="space-y-1">
                  <div className="line-clamp-1 text-base font-semibold">{project.name}</div>
                  <div className="line-clamp-1 text-sm text-muted-foreground">{project.url}</div>
                </div>

                {project.latestScores ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {isKo ? "전체 점수" : "Overall"}
                        </div>
                        <div className="mt-1 text-3xl font-semibold tracking-tight">
                          {project.latestScores.overall}
                          <span className="ml-1 text-sm font-medium text-muted-foreground">/ 100</span>
                        </div>
                      </div>
                      <Badge className={overallTone?.className}>{overallTone?.label}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "SEO", value: project.latestScores.seo },
                        { label: isKo ? "성능" : "Perf", value: project.latestScores.performance },
                        { label: isKo ? "보안" : "Security", value: project.latestScores.security },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg bg-muted/50 px-3 py-2">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {item.label}
                          </div>
                          <div className="mt-1 text-sm font-semibold">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/70 px-4 py-4 text-sm text-muted-foreground">
                    {isKo
                      ? "프로젝트 페이지에서 첫 분석을 실행하면 여기 카드에 점수가 표시됩니다."
                      : "Run the first project analysis to show scores on this card."}
                  </div>
                )}

                <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-border/70 px-4 py-2.5 text-sm font-medium text-foreground">
                  <FolderOpen className="h-4 w-4" />
                  {project.hasAnalysis
                    ? isKo
                      ? "이 사이트 열기"
                      : "Open this site"
                    : isKo
                      ? "분석 준비하기"
                      : "Prepare analysis"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
