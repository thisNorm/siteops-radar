import type { PageSpeedSummary } from "@/types/analysis";

type LighthouseCategory = {
  score?: number;
};

type LighthouseAudit = {
  numericValue?: number;
};

type PageSpeedResponse = {
  lighthouseResult?: {
    audits?: Record<string, LighthouseAudit>;
    categories?: {
      performance?: LighthouseCategory;
      accessibility?: LighthouseCategory;
      seo?: LighthouseCategory;
      "best-practices"?: LighthouseCategory;
    };
  };
};

function toScore(category?: LighthouseCategory) {
  return typeof category?.score === "number"
    ? Math.round(category.score * 100)
    : undefined;
}

function toNumber(audit?: LighthouseAudit) {
  return typeof audit?.numericValue === "number" ? audit.numericValue : undefined;
}

export async function runPageSpeed({
  url,
  locale,
  strategy = "mobile",
}: {
  url: string;
  locale: string;
  strategy?: "mobile" | "desktop";
}): Promise<PageSpeedSummary | null> {
  const apiKey = process.env.PAGESPEED_API_KEY;

  if (!apiKey) {
    return null;
  }

  const endpoint = new URL(
    "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed",
  );
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.set("locale", locale);
  endpoint.searchParams.set("key", apiKey);

  for (const category of ["performance", "accessibility", "seo", "best-practices"]) {
    endpoint.searchParams.append("category", category);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as PageSpeedResponse;
    const categories = payload.lighthouseResult?.categories;
    const audits = payload.lighthouseResult?.audits;

    return {
      strategy,
      performance: toScore(categories?.performance),
      accessibility: toScore(categories?.accessibility),
      seo: toScore(categories?.seo),
      bestPractices: toScore(categories?.["best-practices"]),
      largestContentfulPaintMs: toNumber(audits?.["largest-contentful-paint"]),
      interactionToNextPaintMs: toNumber(audits?.["interaction-to-next-paint"]),
      cumulativeLayoutShift: toNumber(audits?.["cumulative-layout-shift"]),
      totalBlockingTimeMs: toNumber(audits?.["total-blocking-time"]),
      raw: {
        lighthouseVersion: payload.lighthouseResult
          ? "available"
          : "missing",
      },
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
