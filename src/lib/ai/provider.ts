import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";

export interface AIProviderConfig {
  provider: "google" | "openai" | "anthropic" | "none";
  modelName: string;
  isAvailable: boolean;
}

export function getAIProviderConfig(): AIProviderConfig {
  const provider = (process.env.AI_PROVIDER || "google").toLowerCase();

  if (provider === "google" && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      provider: "google",
      modelName: process.env.AI_MODEL || "gemini-1.5-flash",
      isAvailable: true,
    };
  }

  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      modelName: process.env.AI_MODEL || "gpt-4o-mini",
      isAvailable: true,
    };
  }

  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic",
      modelName: process.env.AI_MODEL || "claude-3-5-sonnet-20241022",
      isAvailable: true,
    };
  }

  return {
    provider: "none",
    modelName: "rule-based-deterministic-fallback",
    isAvailable: false,
  };
}

export function getAIModel() {
  const config = getAIProviderConfig();
  if (!config.isAvailable) return null;

  try {
    if (config.provider === "google") {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
      return google(config.modelName);
    }

    if (config.provider === "openai") {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      return openai(config.modelName);
    }

    if (config.provider === "anthropic") {
      const anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      return anthropic(config.modelName);
    }
  } catch (err) {
    console.warn("Failed to initialize AI SDK client; falling back to deterministic rules:", err);
  }

  return null;
}
