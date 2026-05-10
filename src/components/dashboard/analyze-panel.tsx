"use client";

import { useMemo, useState } from "react";
import { Loader2, Radar } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { AnalyzerResult } from "@/types/analysis";

const steps = ["seo", "security", "competitors", "recommendations"] as const;

export function AnalyzePanel({
  onResult,
}: {
  onResult?: (result: AnalyzerResult) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [url, setUrl] = useState("https://example.com");
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={t("dashboard.urlPlaceholder")}
          aria-label={t("dashboard.urlPlaceholder")}
          className="h-11"
        />
        <Button className="h-11 md:w-40" onClick={runAnalysis} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          {t("actions.analyze")}
        </Button>
      </div>
      {running ? (
        <div className="mt-4 space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">
            {t(`dashboard.progress.${steps[stepIndex]}`)}
          </p>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
