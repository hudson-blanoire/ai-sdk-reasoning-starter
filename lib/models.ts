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
              thinking: { type: "enabled", budgetTokens: 5000 },
            },
          },
        },
      }),
      model: anthropic("claude-3-7-sonnet"),
    }),
    "llama-3.3-70b": wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: "think",
      }),
      model: groq("llama-3.3-70b-versatile"),
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
  "llama-3.3-70b": "Llama 3.3 70B",
  "gpt-4o": "GPT-4o",
  "o3-mini": "o3-mini",
};
