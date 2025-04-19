import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
  defaultSettingsMiddleware,
} from "ai";

// Create OpenRouter provider instance
const openrouter = createOpenRouter({
  // apiKey will be read from OPENROUTER_API_KEY environment variable
});

// custom provider with different model settings:
export const myProvider = customProvider({
  languageModels: {
    "sonnet-3.7": wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {
          providerMetadata: {
            anthropic: {
              thinking: { type: "enabled", budgetTokens: 32000 },
            },
          },
        },
      }),
      model: anthropic("claude-3-7-sonnet-20250219"),
    }),
    "gpt-4o": wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: "think",
      }),
      model: openai("gpt-4o"),
    }),
    "google/gemini-2.5-pro-preview-03-25": wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: "think",
      }),
      model: openrouter("google/gemini-2.5-pro-preview-03-25"),
    }),
    "meta-llama/llama-3.3-70b-instruct": wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: "think",
      }),
      model: openrouter("meta-llama/llama-3.3-70b-instruct"),
    }),
  },
});

export type modelID = Parameters<(typeof myProvider)["languageModel"]>["0"];

export const models: Record<modelID, string> = {
  "sonnet-3.7": "Claude Sonnet 3.7",
  "gpt-4o": "GPT-4o",
  "google/gemini-2.5-pro-preview-03-25": "Gemini 2.5 Pro (Preview)",
  "meta-llama/llama-3.3-70b-instruct": "Llama 3.3 70B Instruct",
};
