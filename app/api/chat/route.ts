import { modelID, myProvider } from "@/lib/models";
import { Message, smoothStream, streamText } from "ai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const {
    messages,
    selectedModelId,
    isReasoningEnabled,
    isAgenticEnabled,
  }: {
    messages: Array<Message>;
    selectedModelId: modelID;
    isReasoningEnabled: boolean;
    isAgenticEnabled: boolean;
  } = await request.json();

  const stream = streamText({
    system: isAgenticEnabled
      ? "You are a proactive assistant with access to the latest information. When a user asks about recent events, news, or facts that might be outside your training data, use the Exa search tool to find current information. Always cite your sources."
      : "You are a friendly assistant. When you're unsure or need current information, you can search the web to provide accurate answers.",
    providerOptions:
      selectedModelId === "sonnet-3.7" && isReasoningEnabled === false
        ? {
            anthropic: {
              thinking: {
                type: "disabled",
                budgetTokens: 12000,
              },
            },
          }
        : {},
    model: myProvider.languageModel(selectedModelId),
    experimental_transform: [
      smoothStream({
        chunking: "word",
      }),
    ],
    messages,
  });

  return stream.toDataStreamResponse({
    sendReasoning: isReasoningEnabled,
    getErrorMessage: () => {
      return `An error occurred, please try again!`;
    },
  });
}
