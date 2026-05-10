"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Globe2, Loader2, Radar } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { AnalyzerResult } from "@/types/analysis";

const steps = ["seo", "security", "competitors", "recommendations"] as const;

export function AnalyzePanel({
  onResult,
  className,
  meta,
}: {
  onResult?: (result: AnalyzerResult) => void;
  className?: string;
  meta?: ReactNode;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const [url, setUrl] = useState("https://example.com");
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const progress = useMemo(() => ((stepIndex + 1) / steps.length) * 100, [stepIndex]);

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
        body: JSON.stringify({ url, locale }),
      });
      const payload = await response.json();

      if (payload.result) {
        onResult?.(payload.result as AnalyzerResult);
      }

      if (!session?.user && payload.persistence?.reason === "AUTH_REQUIRED_FOR_PERSISTENCE") {
        setNotice(t("dashboard.previewNotice"));
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
