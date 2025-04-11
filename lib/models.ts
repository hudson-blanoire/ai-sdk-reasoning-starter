import { anthropic } from "@ai-sdk/anthropic";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
  defaultSettingsMiddleware,
} from "ai";

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
    "llama-4-maverick": wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: "think",
      }),
      model: groq("meta-llama/llama-4-maverick-17b-128e-instruct"),
    }),
    "gpt-4o": wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: "think",
      }),
      model: openai("gpt-4o"),
    }),
    "o3-mini": wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: "think",
      }),
      model: openai("o3-mini"),
    }),
  },
});

export type modelID = Parameters<(typeof myProvider)["languageModel"]>["0"];

export const models: Record<modelID, string> = {
  "sonnet-3.7": "Claude Sonnet 3.7",
  "llama-4-maverick": "Llama 4 Maverick",
  "gpt-4o": "GPT-4o",
  "o3-mini": "o3-mini",
};
