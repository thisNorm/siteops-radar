import { cn } from "@/lib/utils";
import type { AnalysisCategory, SummaryLocale } from "@/types/analysis";

export const categoryKeys: AnalysisCategory[] = [
  "performance",
  "seo",
  "aeogeo",
  "security",
  "accessibility",
  "contentQuality",
  "technicalHealth",
];

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getCategoryLabel(category: AnalysisCategory, locale: SummaryLocale) {
  return {
    performance: locale === "ko" ? "성능" : "Performance",
    seo: "SEO",
    aeogeo: "AEO/GEO",
    security: locale === "ko" ? "보안" : "Security",
    accessibility: locale === "ko" ? "접근성" : "Accessibility",
    contentQuality: locale === "ko" ? "콘텐츠 품질" : "Content Quality",
    technicalHealth: locale === "ko" ? "기술 상태" : "Technical Health",
  }[category];
}

export function safeHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function formatTimestamp(date: Date, locale: SummaryLocale) {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function buildSparklineValues(score: number, seed: number) {
  return Array.from({ length: 7 }, (_, index) => {
    const wobble = ((seed + index * 3) % 7) - 3;
    return clamp(score - 11 + index * 2 + wobble * 1.5, 30, 100);
  });
}

export function buildTrendDataFromHistory(
  points: { createdAt: string; score: number }[],
  locale: SummaryLocale,
  window: "6" | "12",
) {
  const formatter = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    month: "2-digit",
    day: "2-digit",
  });
  const limit = window === "6" ? 6 : 12;

  return points.slice(-limit).map((point) => ({
    label: formatter.format(new Date(point.createdAt)),
    score: point.score,
    locale,
  }));
}

export function getScoreTone(score: number, locale: SummaryLocale) {
  if (score >= 85) {
    return {
      label: locale === "ko" ? "우수" : "Strong",
      className: "bg-emerald-50 text-emerald-600",
    };
  }

  if (score >= 75) {
    return {
      label: locale === "ko" ? "양호" : "Good",
      className: "bg-lime-50 text-lime-600",
    };
  }

  if (score >= 60) {
    return {
      label: locale === "ko" ? "보통" : "Fair",
      className: "bg-amber-50 text-amber-600",
    };
  }

  return {
    label: locale === "ko" ? "주의" : "Watch",
    className: "bg-rose-50 text-rose-600",
  };
}

export function getImpactLabel(value: number, locale: SummaryLocale) {
  if (value >= 4) {
    return {
      label: locale === "ko" ? "높음" : "High",
      className: "bg-rose-50 text-rose-600",
    };
  }

  if (value === 3) {
    return {
      label: locale === "ko" ? "보통" : "Medium",
      className: "bg-amber-50 text-amber-600",
    };
  }

  return {
    label: locale === "ko" ? "낮음" : "Low",
    className: "bg-emerald-50 text-emerald-600",
  };
}

export function getEffortLabel(value: number, locale: SummaryLocale) {
  if (value <= 2) {
    return {
      label: locale === "ko" ? "쉬움" : "Easy",
      className: "bg-emerald-50 text-emerald-600",
    };
  }

  if (value === 3) {
    return {
      label: locale === "ko" ? "보통" : "Medium",
      className: "bg-amber-50 text-amber-600",
    };
  }

  return {
    label: locale === "ko" ? "어려움" : "Hard",
    className: "bg-rose-50 text-rose-600",
  };
}

export function getGapLabel(value: number, locale: SummaryLocale) {
  if (value >= 4) {
    return {
      label: locale === "ko" ? "크다" : "Large",
      className: "bg-rose-50 text-rose-600",
    };
  }

  if (value >= 2) {
    return {
      label: locale === "ko" ? "보통" : "Medium",
      className: "bg-amber-50 text-amber-600",
    };
  }

  return {
    label: locale === "ko" ? "적다" : "Low",
    className: "bg-emerald-50 text-emerald-600",
  };
}

export function getVitalTone(
  type: "lcp" | "inp" | "cls",
  value: number | undefined,
  locale: SummaryLocale,
) {
  if (value === undefined) {
    return {
      label: locale === "ko" ? "대기" : "Pending",
      className: "bg-muted text-muted-foreground",
    };
  }

  if (
    (type === "lcp" && value <= 2.5) ||
    (type === "inp" && value <= 200) ||
    (type === "cls" && value <= 0.1)
  ) {
    return {
      label: locale === "ko" ? "좋음" : "Good",
      className: "bg-emerald-50 text-emerald-600",
    };
  }

  if (
    (type === "lcp" && value <= 4) ||
    (type === "inp" && value <= 500) ||
    (type === "cls" && value <= 0.25)
  ) {
    return {
      label: locale === "ko" ? "보통" : "Fair",
      className: "bg-amber-50 text-amber-600",
    };
  }

  return {
    label: locale === "ko" ? "주의" : "Needs work",
    className: "bg-rose-50 text-rose-600",
  };
}

export function metricPosition(value: number, max: number) {
  return `${clamp((value / max) * 100, 2, 98)}%`;
}

export function panelClassName(extra?: string) {
  return cn(
    "rounded-lg border border-border/70 bg-card/95 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]",
    extra,
  );
}
