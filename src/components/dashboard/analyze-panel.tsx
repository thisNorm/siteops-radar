"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Globe2, Loader2, Radar } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AnalyzerResult } from "@/types/analysis";
import type { DashboardAnalyzeMeta } from "./dashboard-view-types";

const steps = ["seo", "security", "competitors", "recommendations"] as const;

export function AnalyzePanel({
  onResult,
  className,
  meta,
  defaultUrl,
  projectId,
}: {
  onResult?: (result: AnalyzerResult, meta: DashboardAnalyzeMeta) => void;
  className?: string;
  meta?: ReactNode;
  defaultUrl?: string;
  projectId?: string | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const isKo = locale === "ko";
  const [url, setUrl] = useState(defaultUrl ?? "https://example.com");
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const progress = useMemo(() => ((stepIndex + 1) / steps.length) * 100, [stepIndex]);

  useEffect(() => {
    if (defaultUrl) {
      setUrl(defaultUrl);
    }
  }, [defaultUrl]);

  async function runAnalysis() {
    setRunning(true);
    setError(null);
    setStepIndex(0);

    const interval = window.setInterval(() => {
      setStepIndex((value) => Math.min(value + 1, steps.length - 1));
    }, 650);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, locale, projectId: projectId ?? undefined }),
      });
      const payload = await response.json();
      const analyzeMeta: DashboardAnalyzeMeta = {
        persisted: Boolean(payload.persistence?.persisted),
        reason: payload.persistence?.reason,
        hasHistory: Boolean(payload.persistence?.hasHistory),
        trendPoints: payload.persistence?.scoreTrend,
      };

      if (payload.result) {
        onResult?.(payload.result as AnalyzerResult, analyzeMeta);
      }

      if (payload.persistence?.reason === "PROJECT_REQUIRED_FOR_PERSISTENCE") {
        setNotice(
          isKo
            ? "단순 검색은 현재 점수만 보여줍니다. 프로젝트에 추가하면 다음 분석부터 이력과 추이를 관리할 수 있습니다."
            : "Ad hoc searches only show the current score. Add the site to a project to start tracking history and trends.",
        );
      } else {
        setNotice(null);
      }

      if (!response.ok) {
        setError(payload.errorMessage ?? "Analysis failed.");
      } else if (payload.status === "partial") {
        setError(payload.errorMessage ?? "Live analysis partially failed.");
      }
    } catch {
      setError("Analysis request failed.");
    } finally {
      window.clearInterval(interval);
      setStepIndex(steps.length - 1);
      setRunning(false);
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border bg-card px-4 py-2.5 shadow-[0_12px_30px_-26px_rgba(15,23,42,0.45)] lg:max-w-[300px]">
          <Globe2 className="h-4 w-4 text-muted-foreground" />
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={t("dashboard.urlPlaceholder")}
            aria-label={t("dashboard.urlPlaceholder")}
            className="h-auto border-0 bg-transparent px-0 py-0 shadow-none ring-0 focus-visible:ring-0"
          />
        </div>
        {meta}
        <Button
          className="h-11 rounded-lg bg-linear-to-r from-violet-500 to-indigo-500 px-5 text-white shadow-[0_12px_28px_-18px_rgba(99,102,241,0.8)] hover:from-violet-500 hover:to-indigo-600 lg:min-w-36"
          onClick={runAnalysis}
          disabled={running}
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          {t("actions.analyze")}
        </Button>
      </div>
      {running ? (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">
            {t(`dashboard.progress.${steps[stepIndex]}`)}
          </p>
        </div>
      ) : null}
      {notice ? <p className="mt-3 text-sm text-muted-foreground">{notice}</p> : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
