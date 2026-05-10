import { afterEach, describe, expect, it } from "vitest";
import { resolveLlmConfig } from "@/lib/ai/summary-adapter";

const originalEnv = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  GEMINI_BASE_URL: process.env.GEMINI_BASE_URL,
  GEMINI_TEMPERATURE: process.env.GEMINI_TEMPERATURE,
  GEMINI_REASONING_EFFORT: process.env.GEMINI_REASONING_EFFORT,
  LLM_API_KEY: process.env.LLM_API_KEY,
  LLM_MODEL: process.env.LLM_MODEL,
  LLM_BASE_URL: process.env.LLM_BASE_URL,
  LLM_TEMPERATURE: process.env.LLM_TEMPERATURE,
  LLM_REASONING_EFFORT: process.env.LLM_REASONING_EFFORT,
};

function restoreEnvValue(key: keyof typeof originalEnv, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

afterEach(() => {
  restoreEnvValue("GEMINI_API_KEY", originalEnv.GEMINI_API_KEY);
  restoreEnvValue("GEMINI_MODEL", originalEnv.GEMINI_MODEL);
  restoreEnvValue("GEMINI_BASE_URL", originalEnv.GEMINI_BASE_URL);
  restoreEnvValue("GEMINI_TEMPERATURE", originalEnv.GEMINI_TEMPERATURE);
  restoreEnvValue("GEMINI_REASONING_EFFORT", originalEnv.GEMINI_REASONING_EFFORT);
  restoreEnvValue("LLM_API_KEY", originalEnv.LLM_API_KEY);
  restoreEnvValue("LLM_MODEL", originalEnv.LLM_MODEL);
  restoreEnvValue("LLM_BASE_URL", originalEnv.LLM_BASE_URL);
  restoreEnvValue("LLM_TEMPERATURE", originalEnv.LLM_TEMPERATURE);
  restoreEnvValue("LLM_REASONING_EFFORT", originalEnv.LLM_REASONING_EFFORT);
});

describe("resolveLlmConfig", () => {
  it("prefers Gemini when GEMINI_API_KEY is configured", () => {
    process.env.GEMINI_API_KEY = "gemini-key";
    process.env.GEMINI_MODEL = "gemini-3-flash-preview";
    process.env.GEMINI_REASONING_EFFORT = "low";
    process.env.LLM_API_KEY = "generic-key";

    const config = resolveLlmConfig();

    expect(config).toEqual({
      provider: "gemini",
      apiKey: "gemini-key",
      model: "gemini-3-flash-preview",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      temperature: 0.2,
      reasoningEffort: "low",
    });
  });

  it("falls back to generic OpenAI-compatible config when Gemini is absent", () => {
    delete process.env.GEMINI_API_KEY;
    process.env.LLM_API_KEY = "generic-key";
    process.env.LLM_MODEL = "gpt-4.1-mini";
    process.env.LLM_TEMPERATURE = "0.4";

    const config = resolveLlmConfig();

    expect(config).toEqual({
      provider: "generic",
      apiKey: "generic-key",
      model: "gpt-4.1-mini",
      baseUrl: "https://api.openai.com/v1",
      temperature: 0.4,
      reasoningEffort: undefined,
    });
  });
});
