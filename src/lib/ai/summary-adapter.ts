import { z } from "zod";
import { buildCompetitorGapInsights } from "@/lib/analysis/competitor-gap";
import type {
  AnalysisCategory,
  AnalysisScores,
  AnalyzerResult,
  Finding,
  PageSnapshot,
  Recommendation,
  SummaryLocale,
} from "@/types/analysis";

type SummaryInput = {
  requestedLocale: SummaryLocale;
  snapshot: PageSnapshot;
  scores: AnalysisScores;
  findings: Finding[];
  recommendations: Recommendation[];
  modelOverride?: string;
};

type SummaryContext = {
  hostname: string;
  finalUrl: string;
  requestedLocale: SummaryLocale;
  scores: AnalysisScores;
  weakestCategories: AnalysisCategory[];
  topFindings: Finding[];
  topRecommendations: Recommendation[];
  gapInsights: ReturnType<typeof buildCompetitorGapInsights>;
  pageSpeed: {
    performance?: number;
    accessibility?: number;
    seo?: number;
    largestContentfulPaintMs?: number;
    interactionToNextPaintMs?: number;
    cumulativeLayoutShift?: number;
  };
};

type LocalizedSummary = AnalyzerResult["summary"]["ko"];

type LlmConfig = {
  provider: "generic" | "gemini";
  apiKey: string;
  model: string;
  baseUrl: string;
  temperature: number;
  reasoningEffort?: "minimal" | "low" | "medium" | "high" | "none";
};

function readOptionalEnv(value: string | undefined) {
  if (!value || value === "undefined" || value === "null") {
    return undefined;
  }

  return value;
}

const summaryShape = z.object({
  overview: z.string().min(1),
  keyRisks: z.array(z.string().min(1)).min(1).max(4),
  nextActions: z.array(z.string().min(1)).min(1).max(4),
  competitorGapNarrative: z.string().min(1),
});

const summaryResponseShape = z.object({
  ko: summaryShape,
  en: summaryShape,
});

const chatCompletionShape = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.union([
            z.string(),
            z.array(
              z.object({
                text: z.string().optional(),
              }),
            ),
          ]),
        }),
      }),
    )
    .min(1),
});

const categoryLabels: Record<SummaryLocale, Record<AnalysisCategory, string>> = {
  ko: {
    performance: "성능",
    seo: "SEO",
    aeogeo: "AEO/GEO",
    security: "보안",
    accessibility: "접근성",
    contentQuality: "콘텐츠 품질",
    technicalHealth: "기술 상태",
  },
  en: {
    performance: "Performance",
    seo: "SEO",
    aeogeo: "AEO/GEO",
    security: "Security",
    accessibility: "Accessibility",
    contentQuality: "Content Quality",
    technicalHealth: "Technical Health",
  },
};

const severityLabels = {
  ko: {
    info: "알림",
    low: "낮음",
    medium: "보통",
    high: "높음",
    critical: "치명적",
  },
  en: {
    info: "Info",
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  },
} as const;

function getWeakestCategories(scores: AnalysisScores) {
  return (
    [
      "performance",
      "seo",
      "aeogeo",
      "security",
      "accessibility",
      "contentQuality",
      "technicalHealth",
    ] as AnalysisCategory[]
  )
    .slice()
    .sort((left, right) => scores[left] - scores[right])
    .slice(0, 3);
}

function getTopFindings(findings: Finding[]) {
  const severityRank = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    info: 0,
  } as const;

  return findings
    .slice()
    .sort(
      (left, right) =>
        severityRank[right.severity] - severityRank[left.severity] ||
        left.category.localeCompare(right.category),
    )
    .slice(0, 3);
}

function buildContext(input: SummaryInput): SummaryContext {
  return {
    hostname: new URL(input.snapshot.finalUrl).hostname,
    finalUrl: input.snapshot.finalUrl,
    requestedLocale: input.requestedLocale,
    scores: input.scores,
    weakestCategories: getWeakestCategories(input.scores),
    topFindings: getTopFindings(input.findings),
    topRecommendations: input.recommendations.slice(0, 3),
    gapInsights: buildCompetitorGapInsights(input.scores, input.recommendations),
    pageSpeed: {
      performance: input.snapshot.pageSpeed?.performance,
      accessibility: input.snapshot.pageSpeed?.accessibility,
      seo: input.snapshot.pageSpeed?.seo,
      largestContentfulPaintMs: input.snapshot.pageSpeed?.largestContentfulPaintMs,
      interactionToNextPaintMs: input.snapshot.pageSpeed?.interactionToNextPaintMs,
      cumulativeLayoutShift: input.snapshot.pageSpeed?.cumulativeLayoutShift,
    },
  };
}

function formatFinding(locale: SummaryLocale, finding: Finding) {
  return `${categoryLabels[locale][finding.category]} · ${severityLabels[locale][finding.severity]}: ${finding.title}`;
}

function formatAction(locale: SummaryLocale, recommendation: Recommendation) {
  return `${categoryLabels[locale][recommendation.category]}: ${recommendation.title}`;
}

function buildTemplateLocalizedSummary(
  locale: SummaryLocale,
  context: SummaryContext,
): LocalizedSummary {
  const primaryGap = context.gapInsights.find((item) => item.gap > 0);
  const secondaryGap = context.gapInsights.filter((item) => item.gap > 0)[1];
  const topRecommendation = context.topRecommendations[0];
  const weakestPrimary = context.weakestCategories[0];
  const weakestSecondary = context.weakestCategories[1] ?? context.weakestCategories[0];

  if (locale === "ko") {
    return {
      overview: `${context.hostname}의 현재 종합 점수는 ${context.scores.overall}점입니다. ${
        primaryGap
          ? `${categoryLabels.ko[primaryGap.category]}와 ${categoryLabels.ko[secondaryGap?.category ?? weakestPrimary]}에서 경쟁 압박 신호가 크게 보입니다.`
          : `${categoryLabels.ko[weakestPrimary]}와 ${categoryLabels.ko[weakestSecondary]} 점수가 상대적으로 낮습니다.`
      } ${
        topRecommendation
          ? `${formatAction("ko", topRecommendation)}부터 처리하면 가장 빠른 개선 흐름을 만들 수 있습니다.`
          : "핵심 권장 작업부터 정리하면 점수와 안정성을 함께 끌어올릴 수 있습니다."
      }`,
      keyRisks:
        context.topFindings.length > 0
          ? context.topFindings.map((finding) => formatFinding("ko", finding))
          : ["주요 위험 신호가 강하게 감지되진 않았지만 세부 개선 여지는 남아 있습니다."],
      nextActions:
        context.topRecommendations.length > 0
          ? context.topRecommendations.map((recommendation) => formatAction("ko", recommendation))
          : ["핵심 페이지의 구조, 보안 헤더, 성능 병목을 우선 점검하세요."],
      competitorGapNarrative: primaryGap
        ? `경쟁사 대비 열세 신호는 ${categoryLabels.ko[primaryGap.category]}에서 가장 크게 보이고${
            secondaryGap ? `, ${categoryLabels.ko[secondaryGap.category]}도 뒤를 잇습니다` : ""
          }. 현재 권장 항목의 competitorGap 가중치를 기준으로 보면 ${
            primaryGap.topRecommendation
              ? formatAction("ko", primaryGap.topRecommendation)
              : formatAction("ko", topRecommendation ?? context.topRecommendations[0])
          }를 미룰수록 비교 손실이 커질 가능성이 높습니다.`
        : `현재 권장 항목 기준으로는 뚜렷한 경쟁사 격차 신호가 크지 않지만, ${
            categoryLabels.ko[weakestPrimary]
          }와 ${categoryLabels.ko[weakestSecondary]}를 먼저 정리하는 편이 안전합니다.`,
    };
  }

  return {
    overview: `${context.hostname} is currently scoring ${context.scores.overall} overall. ${
      primaryGap
        ? `${categoryLabels.en[primaryGap.category]} and ${categoryLabels.en[secondaryGap?.category ?? weakestPrimary]} show the strongest competitive pressure signals.`
        : `${categoryLabels.en[weakestPrimary]} and ${categoryLabels.en[weakestSecondary]} are the softest scoring areas.`
    } ${
      topRecommendation
        ? `Starting with ${formatAction("en", topRecommendation)} should create the fastest visible lift.`
        : "Tightening the highest-impact recommendations should improve stability and score momentum."
    }`,
    keyRisks:
      context.topFindings.length > 0
        ? context.topFindings.map((finding) => formatFinding("en", finding))
        : ["No severe blocker stands out, but there is still room for targeted improvements."],
    nextActions:
      context.topRecommendations.length > 0
        ? context.topRecommendations.map((recommendation) => formatAction("en", recommendation))
        : ["Review core page structure, security headers, and major performance bottlenecks first."],
    competitorGapNarrative: primaryGap
      ? `The strongest inferred competitor gap appears in ${categoryLabels.en[primaryGap.category]}${
          secondaryGap ? `, with ${categoryLabels.en[secondaryGap.category]} close behind` : ""
        }. Based on the current recommendation gap signals, ${
          primaryGap.topRecommendation
            ? formatAction("en", primaryGap.topRecommendation)
            : formatAction("en", topRecommendation ?? context.topRecommendations[0])
        } is the work most likely to reduce comparison drag quickly.`
      : `No strong competitor-gap signal stands out from the current recommendations, but stabilizing ${categoryLabels.en[weakestPrimary]} and ${categoryLabels.en[weakestSecondary]} remains the safest next move.`,
  };
}

export function generateTemplateAnalysisSummary(
  input: SummaryInput,
): AnalyzerResult["summary"] {
  const context = buildContext(input);

  return {
    requestedLocale: input.requestedLocale,
    model: input.modelOverride ?? "template-mvp",
    ko: buildTemplateLocalizedSummary("ko", context),
    en: buildTemplateLocalizedSummary("en", context),
  };
}

function parseTemperature(value: string | undefined, fallback: number) {
  const parsedTemperature = Number(readOptionalEnv(value) ?? String(fallback));

  return Number.isFinite(parsedTemperature)
    ? Math.min(Math.max(parsedTemperature, 0), 1)
    : fallback;
}

function parseReasoningEffort(
  value: string | undefined,
): LlmConfig["reasoningEffort"] | undefined {
  if (!value) {
    return undefined;
  }

  if (value === "minimal" || value === "low" || value === "medium" || value === "high" || value === "none") {
    return value;
  }

  return undefined;
}

export function resolveLlmConfig(): LlmConfig | null {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiBaseUrl = readOptionalEnv(process.env.GEMINI_BASE_URL);
  const llmModel = readOptionalEnv(process.env.LLM_MODEL);
  const llmBaseUrl = readOptionalEnv(process.env.LLM_BASE_URL);

  if (geminiApiKey) {
    return {
      provider: "gemini",
      apiKey: geminiApiKey,
      model: readOptionalEnv(process.env.GEMINI_MODEL) || llmModel || "gemini-3-flash-preview",
      baseUrl: (geminiBaseUrl || "https://generativelanguage.googleapis.com/v1beta/openai").replace(
        /\/$/,
        "",
      ),
      temperature: parseTemperature(process.env.GEMINI_TEMPERATURE ?? process.env.LLM_TEMPERATURE, 0.2),
      reasoningEffort: parseReasoningEffort(
        process.env.GEMINI_REASONING_EFFORT ?? process.env.LLM_REASONING_EFFORT,
      ),
    };
  }

  const genericApiKey = process.env.LLM_API_KEY;

  if (!genericApiKey) {
    return null;
  }

  const model = llmModel || "gpt-4.1-mini";
  const baseUrl = (llmBaseUrl || "https://api.openai.com/v1").replace(/\/$/, "");

  return {
    provider: "generic",
    apiKey: genericApiKey,
    model,
    baseUrl,
    temperature: parseTemperature(process.env.LLM_TEMPERATURE, 0.2),
    reasoningEffort: parseReasoningEffort(process.env.LLM_REASONING_EFFORT),
  };
}

function buildSystemPrompt() {
  return [
    "You are a SaaS website intelligence analyst.",
    "Write concise executive summaries for both Korean and English readers.",
    "Use only the provided analysis context.",
    "Treat competitor-gap language as inferred from recommendation gap signals unless explicit competitor measurements are present.",
    "Return strict JSON only.",
  ].join(" ");
}

function buildUserPrompt(context: SummaryContext) {
  return [
    "Summarize this analysis in strict JSON.",
    'Return this exact shape: {"ko":{"overview":"","keyRisks":[],"nextActions":[],"competitorGapNarrative":""},"en":{"overview":"","keyRisks":[],"nextActions":[],"competitorGapNarrative":""}}',
    "Rules:",
    "- Keep each overview to 2 sentences max.",
    "- Keep keyRisks and nextActions to 3 items each.",
    "- Be specific, operational, and non-repetitive.",
    "- Do not wrap the JSON in markdown fences.",
    "",
    JSON.stringify(context, null, 2),
  ].join("\n");
}

function extractContent(response: z.infer<typeof chatCompletionShape>) {
  const content = response.choices[0].message.content;

  if (typeof content === "string") {
    return content;
  }

  return content.map((part) => part.text ?? "").join("\n");
}

function parseSummaryPayload(content: string) {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("LLM_SUMMARY_INVALID_JSON");
  }

  const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as unknown;
  return summaryResponseShape.parse(parsed);
}

async function requestLlmSummary(input: SummaryInput) {
  const config = resolveLlmConfig();

  if (!config) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: config.temperature,
        ...(config.reasoningEffort ? { reasoning_effort: config.reasoningEffort } : {}),
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(),
          },
          {
            role: "user",
            content: buildUserPrompt(buildContext(input)),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM_SUMMARY_HTTP_${response.status}`);
    }

    const payload = chatCompletionShape.parse(await response.json());
    const summaries = parseSummaryPayload(extractContent(payload));

    return {
      model: config.model,
      summaries,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateAnalysisSummary(
  input: SummaryInput,
): Promise<AnalyzerResult["summary"]> {
  const llmResult = await requestLlmSummary(input);

  if (!llmResult) {
    return generateTemplateAnalysisSummary(input);
  }

  return {
    requestedLocale: input.requestedLocale,
    model: llmResult.model,
    ko: llmResult.summaries.ko,
    en: llmResult.summaries.en,
  };
}
