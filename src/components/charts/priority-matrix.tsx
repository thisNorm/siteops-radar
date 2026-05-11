"use client";

import type { Recommendation, Severity, SummaryLocale } from "@/types/analysis";
import { cn } from "@/lib/utils";

const severityClassNames: Record<Severity, string> = {
  critical: "border-rose-500 bg-rose-500 text-white",
  high: "border-orange-500 bg-orange-500 text-white",
  medium: "border-amber-500 bg-amber-500 text-slate-950",
  low: "border-emerald-500 bg-emerald-500 text-slate-950",
  info: "border-slate-400 bg-slate-400 text-white",
};

function axisLabel(locale: SummaryLocale, key: "impact" | "effort" | "quickWins" | "strategic") {
  const labels = {
    ko: {
      impact: "영향도",
      effort: "난이도",
      quickWins: "빠른 개선",
      strategic: "큰 개선",
    },
    en: {
      impact: "Impact",
      effort: "Effort",
      quickWins: "Quick wins",
      strategic: "Big bets",
    },
  } as const;

  return labels[locale][key];
}

export function PriorityMatrix({
  items,
  locale,
}: {
  items: Recommendation[];
  locale: SummaryLocale;
}) {
  const plottedItems = items.slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{axisLabel(locale, "quickWins")}</span>
        <span>{axisLabel(locale, "strategic")}</span>
      </div>
      <div
        className="relative h-[260px] overflow-hidden rounded-xl border bg-background"
        aria-label={
          locale === "ko"
            ? "영향도와 난이도 기준 우선순위 매트릭스"
            : "Priority matrix by impact and effort"
        }
      >
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          <div className="border-r border-b bg-emerald-500/5" />
          <div className="border-b bg-amber-500/5" />
          <div className="border-r bg-slate-500/5" />
          <div className="bg-rose-500/5" />
        </div>
        <div className="absolute inset-x-4 top-3 flex justify-between text-[11px] font-medium text-muted-foreground">
          <span>{locale === "ko" ? "높은 영향" : "High impact"}</span>
          <span>{locale === "ko" ? "높은 난이도" : "High effort"}</span>
        </div>
        <div className="absolute bottom-3 left-4 text-[11px] font-medium text-muted-foreground">
          {locale === "ko" ? "낮은 영향" : "Low impact"}
        </div>
        <div className="absolute right-4 bottom-3 text-[11px] font-medium text-muted-foreground">
          {locale === "ko" ? "낮은 우선순위" : "Lower priority"}
        </div>
        <div className="absolute top-9 bottom-9 left-9 w-px bg-border" />
        <div className="absolute right-9 bottom-9 left-9 h-px bg-border" />
        <div className="absolute top-9 bottom-9 left-9 flex flex-col justify-between text-[10px] text-muted-foreground">
          <span>5</span>
          <span>3</span>
          <span>1</span>
        </div>
        <div className="absolute right-9 bottom-5 left-9 flex justify-between text-[10px] text-muted-foreground">
          <span>1</span>
          <span>3</span>
          <span>5</span>
        </div>
        {plottedItems.map((item, index) => {
          const left = `${18 + ((Math.max(1, Math.min(5, item.effort)) - 1) / 4) * 70}%`;
          const bottom = `${18 + ((Math.max(1, Math.min(5, item.impact)) - 1) / 4) * 70}%`;
          const size = 28 + Math.max(0, Math.min(5, item.priorityScore)) * 5;

          return (
            <div
              key={item.id}
              className="group absolute -translate-x-1/2 translate-y-1/2"
              style={{ left, bottom }}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-full border-2 text-xs font-semibold shadow-sm ring-2 ring-background",
                  severityClassNames[item.severity],
                )}
                style={{ width: size, height: size }}
                title={item.title}
              >
                {index + 1}
              </div>
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-56 -translate-x-1/2 rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg group-hover:block">
                <div className="font-medium text-popover-foreground">{item.title}</div>
                <div className="mt-1 text-muted-foreground">
                  {axisLabel(locale, "impact")}: {item.impact} · {axisLabel(locale, "effort")}:{" "}
                  {item.effort} · {item.priorityScore.toFixed(1)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{axisLabel(locale, "impact")}</span>
        <span>{axisLabel(locale, "effort")}</span>
      </div>
    </div>
  );
}
