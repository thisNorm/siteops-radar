import type { AnalyzerResult } from "@/types/analysis";
import { rankRecommendations } from "@/lib/recommendations/priority";

export const sampleAnalysis: AnalyzerResult = {
  snapshot: {
    sourceUrl: "https://example.com",
    finalUrl: "https://example.com",
    httpStatus: 200,
    fetchedTitle: "Example SaaS",
    fetchedDescription: "A sample B2B SaaS landing page.",
    canonicalUrl: "https://example.com",
    h1: "AI operations platform",
    headingsSummary: { h1: 1, h2: 6, h3: 9 },
    structuredDataTypes: ["Organization", "SoftwareApplication"],
    imageSummary: {
      total: 14,
      missingAlt: 2,
    },
    assetSummary: {
      scripts: 18,
      externalScripts: 9,
      stylesheets: 4,
      brokenAssets: 0,
      checkedAssets: 12,
    },
    robotsTxt: {
      checked: true,
      exists: true,
      hasSitemap: true,
    },
    sitemap: {
      checked: true,
      exists: true,
    },
    pageSpeed: {
      strategy: "mobile",
      performance: 78,
      accessibility: 88,
      seo: 84,
      bestPractices: 82,
      largestContentfulPaintMs: 2300,
      interactionToNextPaintMs: 176,
      cumulativeLayoutShift: 0.04,
      totalBlockingTimeMs: 140,
    },
    responseHeaders: {
      "content-type": "text/html",
      "referrer-policy": "strict-origin-when-cross-origin",
    },
    rawHtmlHash: "sample",
    htmlLength: 42800,
  },
  scores: {
    performance: 78,
    seo: 84,
    aeogeo: 67,
    security: 71,
    accessibility: 88,
    contentQuality: 81,
    technicalHealth: 76,
    overall: 78,
  },
  findings: [
    {
      id: "security-csp-missing",
      category: "security",
      severity: "high",
      title: "Missing Content-Security-Policy",
      description: "CSP is not configured on the primary response.",
    },
    {
      id: "aeogeo-faq-missing",
      category: "aeogeo",
      severity: "medium",
      title: "FAQ structure not detected",
      description: "The page has limited direct answer sections for AI search surfaces.",
    },
  ],
  recommendations: rankRecommendations([
    {
      category: "security",
      severity: "high",
      title: "Add CSP in report-only mode",
      description: "Start collecting CSP violations before enforcing policy.",
      impact: 4,
      effort: 3,
      competitorGap: 2,
      expectedImprovement: "Higher security score and reduced script injection risk.",
    },
    {
      category: "aeogeo",
      severity: "medium",
      title: "Create answer-ready FAQ sections",
      description: "Add concise Q&A blocks with schema.org FAQPage where appropriate.",
      impact: 4,
      effort: 2,
      competitorGap: 4,
      expectedImprovement: "Better answer engine extraction and summary quality.",
    },
    {
      category: "performance",
      severity: "medium",
      title: "Reduce render-blocking scripts",
      description: "Defer non-critical scripts and audit third-party tags.",
      impact: 5,
      effort: 3,
      competitorGap: 3,
      expectedImprovement: "Improves LCP and INP on mobile devices.",
    },
  ]),
  summary: {
    requestedLocale: "ko",
    model: "template-mvp",
    ko: {
      overview:
        "전반적인 상태는 양호하지만 보안 헤더와 AI 검색 친화 구조가 우선 개선 영역입니다. CSP와 FAQ/구조화 데이터를 먼저 적용하면 경쟁사 대비 격차를 빠르게 줄일 수 있습니다.",
      keyRisks: [
        "보안 · 높음: Missing Content-Security-Policy",
        "AEO/GEO · 보통: FAQ structure not detected",
        "성능 · 보통: Render-blocking scripts remain on the page",
      ],
      nextActions: [
        "보안: Add CSP in report-only mode",
        "AEO/GEO: Create answer-ready FAQ sections",
        "성능: Reduce render-blocking scripts",
      ],
      competitorGapNarrative:
        "경쟁사 대비 열세 신호는 AEO/GEO와 보안에서 가장 강하게 보입니다. FAQ 구조와 CSP 적용을 늦출수록 비교 손실이 누적될 가능성이 높습니다.",
    },
    en: {
      overview:
        "Overall health is solid, but security headers and AI-search-friendly structure should be improved first. CSP and structured FAQ content are the fastest ways to close the competitor gap.",
      keyRisks: [
        "Security · High: Missing Content-Security-Policy",
        "AEO/GEO · Medium: FAQ structure not detected",
        "Performance · Medium: Render-blocking scripts remain on the page",
      ],
      nextActions: [
        "Security: Add CSP in report-only mode",
        "AEO/GEO: Create answer-ready FAQ sections",
        "Performance: Reduce render-blocking scripts",
      ],
      competitorGapNarrative:
        "The sharpest inferred competitor pressure sits in AEO/GEO and security. Delaying FAQ structure and CSP rollout is likely to keep the comparison gap open.",
    },
  },
};
