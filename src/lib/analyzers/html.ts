import crypto from "node:crypto";
import type { Finding, PageSnapshot, PageSpeedSummary, RecommendationInput } from "@/types/analysis";

function matchContent(html: string, pattern: RegExp) {
  return html.match(pattern)?.[1]?.trim();
}

function countTag(html: string, tag: string) {
  return (html.match(new RegExp(`<${tag}(\\s|>)`, "gi")) ?? []).length;
}

function matchAll(html: string, pattern: RegExp) {
  return [...html.matchAll(pattern)].map((match) => match[1] ?? "");
}

function parseStructuredDataTypes(html: string) {
  const jsonLdBlocks = matchAll(
    html,
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  const types = new Set<string>();

  for (const block of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(block.trim()) as unknown;
      const candidates = Array.isArray(parsed) ? parsed : [parsed];

      for (const candidate of candidates) {
        if (candidate && typeof candidate === "object" && "@type" in candidate) {
          const type = (candidate as { "@type"?: unknown })["@type"];

          if (Array.isArray(type)) {
            type.filter((item): item is string => typeof item === "string").forEach((item) => types.add(item));
          } else if (typeof type === "string") {
            types.add(type);
          }
        }
      }
    } catch {
      continue;
    }
  }

  return [...types];
}

function getImageSummary(html: string) {
  const images = html.match(/<img\b[^>]*>/gi) ?? [];
  const missingAlt = images.filter((image) => !/\salt=["'][^"']*["']/i.test(image)).length;

  return {
    total: images.length,
    missingAlt,
  };
}

function getAssetSummary(html: string, finalUrl: string) {
  const scripts = matchAll(html, /<script[^>]+src=["']([^"']+)["'][^>]*>/gi);
  const stylesheets = matchAll(
    html,
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/gi,
  );
  const origin = new URL(finalUrl).origin;

  return {
    scripts: scripts.length,
    externalScripts: scripts.filter((src) => {
      try {
        return new URL(src, origin).origin !== origin;
      } catch {
        return false;
      }
    }).length,
    stylesheets: stylesheets.length,
    assetUrls: [...scripts, ...stylesheets],
  };
}

export function createSnapshot({
  sourceUrl,
  finalUrl,
  httpStatus,
  html,
  headers,
  robotsTxt = { checked: false, exists: false, hasSitemap: false },
  sitemap = { checked: false, exists: false },
  brokenAssets = 0,
  checkedAssets = 0,
  pageSpeed,
}: {
  sourceUrl: string;
  finalUrl: string;
  httpStatus: number;
  html: string;
  headers: Headers;
  robotsTxt?: PageSnapshot["robotsTxt"];
  sitemap?: PageSnapshot["sitemap"];
  brokenAssets?: number;
  checkedAssets?: number;
  pageSpeed?: PageSpeedSummary | null;
}): PageSnapshot {
  const responseHeaders = Object.fromEntries(headers.entries());
  const assetSummary = getAssetSummary(html, finalUrl);

  return {
    sourceUrl,
    finalUrl,
    httpStatus,
    fetchedTitle: matchContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    fetchedDescription: matchContent(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ),
    canonicalUrl: matchContent(
      html,
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    ),
    robotsMeta: matchContent(
      html,
      /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ),
    h1: matchContent(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)?.replace(/<[^>]+>/g, ""),
    headingsSummary: {
      h1: countTag(html, "h1"),
      h2: countTag(html, "h2"),
      h3: countTag(html, "h3"),
    },
    structuredDataTypes: parseStructuredDataTypes(html),
    imageSummary: getImageSummary(html),
    assetSummary: {
      scripts: assetSummary.scripts,
      externalScripts: assetSummary.externalScripts,
      stylesheets: assetSummary.stylesheets,
      brokenAssets,
      checkedAssets,
    },
    robotsTxt,
    sitemap,
    pageSpeed: pageSpeed ?? undefined,
    responseHeaders,
    rawHtmlHash: crypto.createHash("sha256").update(html).digest("hex"),
    htmlLength: html.length,
  };
}

export function analyzeSnapshot(snapshot: PageSnapshot) {
  const findings: Finding[] = [];
  const recommendations: RecommendationInput[] = [];
  const headers = snapshot.responseHeaders;

  if (!snapshot.fetchedTitle) {
    findings.push({
      id: "seo-title-missing",
      category: "seo",
      severity: "high",
      title: "Missing title tag",
      description: "The page does not expose a readable title tag.",
    });
    recommendations.push({
      category: "seo",
      severity: "high",
      title: "Add a concise page title",
      description: "Create a unique title that explains the page intent within search result constraints.",
      impact: 5,
      effort: 1,
      competitorGap: 3,
      expectedImprovement: "Improves search result clarity and click-through potential.",
    });
  }

  if (!snapshot.fetchedDescription) {
    findings.push({
      id: "seo-description-missing",
      category: "seo",
      severity: "medium",
      title: "Missing meta description",
      description: "The page has no meta description for search and AI summaries.",
    });
  }

  if (snapshot.headingsSummary.h1 !== 1) {
    findings.push({
      id: "content-h1-count",
      category: "contentQuality",
      severity: "medium",
      title: "Unclear H1 structure",
      description: "A page should generally expose exactly one clear H1.",
      evidence: snapshot.headingsSummary,
    });
  }

  if (snapshot.imageSummary.missingAlt > 0) {
    findings.push({
      id: "accessibility-image-alt-missing",
      category: "accessibility",
      severity: snapshot.imageSummary.missingAlt > 5 ? "high" : "medium",
      title: "Images missing alt text",
      description: "Some images do not expose alt text for assistive technologies and image search.",
      evidence: snapshot.imageSummary,
    });
    recommendations.push({
      category: "accessibility",
      severity: "medium",
      title: "Add alt text to meaningful images",
      description: "Describe meaningful images and mark decorative images with empty alt attributes.",
      impact: 4,
      effort: 2,
      competitorGap: 2,
      expectedImprovement: "Improves accessibility and image context quality.",
    });
  }

  if (!headers["content-security-policy"]) {
    findings.push({
      id: "security-csp-missing",
      category: "security",
      severity: "high",
      title: "Missing Content-Security-Policy",
      description: "CSP reduces the impact of script injection and content injection attacks.",
    });
    recommendations.push({
      category: "security",
      severity: "high",
      title: "Introduce a Content-Security-Policy",
      description: "Start with a report-only CSP, then enforce a policy for scripts, frames, and connections.",
      impact: 4,
      effort: 3,
      competitorGap: 2,
      expectedImprovement: "Reduces exposure to XSS and third-party script abuse.",
    });
  }

  if (!headers["strict-transport-security"] && snapshot.finalUrl.startsWith("https://")) {
    findings.push({
      id: "security-hsts-missing",
      category: "security",
      severity: "medium",
      title: "Missing HSTS",
      description: "Strict-Transport-Security helps browsers enforce HTTPS.",
    });
  }

  if (!snapshot.canonicalUrl) {
    findings.push({
      id: "technical-canonical-missing",
      category: "technicalHealth",
      severity: "low",
      title: "Missing canonical URL",
      description: "Canonical URLs reduce duplicate URL ambiguity.",
    });
  }

  if (snapshot.structuredDataTypes.length === 0) {
    findings.push({
      id: "aeogeo-structured-data-missing",
      category: "aeogeo",
      severity: "medium",
      title: "Limited structured data signals",
      description: "No JSON-LD signal was detected in the initial page snapshot.",
    });
    recommendations.push({
      category: "aeogeo",
      severity: "medium",
      title: "Add structured data for answer engines",
      description: "Use schema.org JSON-LD for organization, article, product, FAQ, or software entities where relevant.",
      impact: 4,
      effort: 2,
      competitorGap: 3,
      expectedImprovement: "Improves machine readability for search and AI answer surfaces.",
    });
  }

  if (snapshot.robotsTxt.checked && !snapshot.robotsTxt.exists) {
    findings.push({
      id: "technical-robots-missing",
      category: "technicalHealth",
      severity: "low",
      title: "robots.txt not found",
      description: "robots.txt helps crawlers discover crawl policies and sitemap locations.",
    });
  }

  if (snapshot.sitemap.checked && !snapshot.sitemap.exists && !snapshot.robotsTxt.hasSitemap) {
    findings.push({
      id: "technical-sitemap-missing",
      category: "technicalHealth",
      severity: "medium",
      title: "Sitemap not detected",
      description: "A sitemap helps search engines discover important URLs and update cadence.",
    });
    recommendations.push({
      category: "technicalHealth",
      severity: "medium",
      title: "Publish and reference a sitemap",
      description: "Expose /sitemap.xml and reference it from robots.txt for reliable crawler discovery.",
      impact: 3,
      effort: 2,
      competitorGap: 2,
      expectedImprovement: "Improves crawler discovery and technical health confidence.",
    });
  }

  if (snapshot.assetSummary.externalScripts > 12) {
    findings.push({
      id: "technical-external-script-overload",
      category: "technicalHealth",
      severity: "medium",
      title: "High third-party script count",
      description: "Many external scripts can increase blocking time, privacy risk, and operational fragility.",
      evidence: snapshot.assetSummary,
    });
  }

  if (snapshot.assetSummary.brokenAssets > 0) {
    findings.push({
      id: "technical-broken-assets",
      category: "technicalHealth",
      severity: "medium",
      title: "Broken assets detected",
      description: "Some sampled scripts or stylesheets did not return a successful response.",
      evidence: snapshot.assetSummary,
    });
  }

  if (!headers["referrer-policy"]) {
    findings.push({
      id: "security-referrer-policy-missing",
      category: "security",
      severity: "low",
      title: "Missing Referrer-Policy",
      description: "Referrer-Policy limits how much URL context is sent to external destinations.",
    });
  }

  if (!headers["x-frame-options"] && !/frame-ancestors/i.test(headers["content-security-policy"] ?? "")) {
    findings.push({
      id: "security-clickjacking-policy-missing",
      category: "security",
      severity: "medium",
      title: "Missing clickjacking protection",
      description: "Use X-Frame-Options or CSP frame-ancestors to control framing.",
    });
  }

  const setCookieHeader = headers["set-cookie"] ?? "";
  if (setCookieHeader && !/;\s*secure/i.test(setCookieHeader)) {
    findings.push({
      id: "security-cookie-secure-missing",
      category: "security",
      severity: "medium",
      title: "Cookie without Secure flag",
      description: "Cookies set over HTTPS should include the Secure attribute.",
    });
  }

  if (setCookieHeader && !/;\s*httponly/i.test(setCookieHeader)) {
    findings.push({
      id: "security-cookie-httponly-missing",
      category: "security",
      severity: "low",
      title: "Cookie without HttpOnly flag",
      description: "HttpOnly reduces exposure of sensitive cookies to client-side scripts.",
    });
  }

  if (snapshot.pageSpeed?.performance !== undefined && snapshot.pageSpeed.performance < 70) {
    findings.push({
      id: "performance-pagespeed-low",
      category: "performance",
      severity: snapshot.pageSpeed.performance < 50 ? "high" : "medium",
      title: "Low PageSpeed performance score",
      description: "Lighthouse lab data indicates performance issues on the selected strategy.",
      evidence: {
        strategy: snapshot.pageSpeed.strategy,
        performance: snapshot.pageSpeed.performance,
        lcp: snapshot.pageSpeed.largestContentfulPaintMs,
        inp: snapshot.pageSpeed.interactionToNextPaintMs,
      },
    });
    recommendations.push({
      category: "performance",
      severity: "medium",
      title: "Prioritize Core Web Vitals improvements",
      description: "Use PageSpeed audit data to reduce LCP, blocking time, and slow interaction paths.",
      impact: 5,
      effort: 3,
      competitorGap: 3,
      expectedImprovement: "Improves user experience and search performance signals.",
    });
  }

  return { findings, recommendations };
}

export function extractAssetUrls(html: string, finalUrl: string) {
  return getAssetSummary(html, finalUrl).assetUrls;
}
