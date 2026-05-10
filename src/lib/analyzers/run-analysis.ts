import {
  generateAnalysisSummary,
  generateTemplateAnalysisSummary,
} from "@/lib/ai/summary-adapter";
import { assertSafePublicUrl } from "@/lib/security/ssrf";
import { rankRecommendations } from "@/lib/recommendations/priority";
import { calculateCategoryScores } from "@/lib/scoring/scores";
import type { AnalyzerResult, SummaryLocale } from "@/types/analysis";
import { analyzeSnapshot, createSnapshot, extractAssetUrls } from "./html";
import { runPageSpeed } from "./pagespeed";
import { countBrokenAssets, inspectRobotsAndSitemap } from "./site-metadata";

function mergePageSpeedScores(
  scores: AnalyzerResult["scores"],
  pageSpeed: AnalyzerResult["snapshot"]["pageSpeed"],
) {
  if (!pageSpeed) {
    return scores;
  }

  const performance = pageSpeed.performance ?? scores.performance;
  const accessibility = pageSpeed.accessibility ?? scores.accessibility;
  const seo = pageSpeed.seo ?? scores.seo;
  const technicalHealth =
    pageSpeed.bestPractices !== undefined
      ? Math.round((scores.technicalHealth + pageSpeed.bestPractices) / 2)
      : scores.technicalHealth;
  const overall = Math.round(
    (performance +
      accessibility +
      seo +
      scores.aeogeo +
      scores.security +
      scores.contentQuality +
      technicalHealth) /
      7,
  );

  return {
    ...scores,
    performance,
    accessibility,
    seo,
    technicalHealth,
    overall,
  };
}

export async function runSinglePageAnalysis(
  inputUrl: string,
  locale: SummaryLocale = "en",
): Promise<AnalyzerResult> {
  const safeUrl = await assertSafePublicUrl(inputUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(safeUrl.normalizedUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "SiteOpsRadar/0.1 (+https://siteops-radar.local)",
        accept: "text/html,application/xhtml+xml",
      },
    });

    const finalUrl = response.url;
    await assertSafePublicUrl(finalUrl);
    const html = (await response.text()).slice(0, 1_000_000);
    const assetUrls = extractAssetUrls(html, finalUrl);
    const [siteMetadata, assetHealth, pageSpeed] = await Promise.all([
      inspectRobotsAndSitemap(finalUrl),
      countBrokenAssets(finalUrl, assetUrls),
      runPageSpeed({
        url: finalUrl,
        locale,
        strategy: "mobile",
      }),
    ]);
    const snapshot = createSnapshot({
      sourceUrl: safeUrl.normalizedUrl,
      finalUrl,
      httpStatus: response.status,
      html,
      headers: response.headers,
      robotsTxt: siteMetadata.robotsTxt,
      sitemap: siteMetadata.sitemap,
      brokenAssets: assetHealth.brokenAssets,
      checkedAssets: assetHealth.checkedAssets,
      pageSpeed,
    });
    const { findings, recommendations } = analyzeSnapshot(snapshot);
    const rankedRecommendations = rankRecommendations(recommendations);
    const heuristicScores = calculateCategoryScores(findings);
    const scores = mergePageSpeedScores(heuristicScores, pageSpeed ?? undefined);
    let summary: AnalyzerResult["summary"];

    try {
      summary = await generateAnalysisSummary({
        requestedLocale: locale,
        snapshot,
        scores,
        findings,
        recommendations: rankedRecommendations,
      });
    } catch {
      summary = generateTemplateAnalysisSummary({
        requestedLocale: locale,
        snapshot,
        scores,
        findings,
        recommendations: rankedRecommendations,
        modelOverride: "template-fallback",
      });
    }

    return {
      snapshot,
      findings,
      recommendations: rankedRecommendations,
      scores,
      summary,
    };
  } finally {
    clearTimeout(timeout);
  }
}
