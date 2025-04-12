import { modelID, myProvider, models } from "@/lib/models";
import { Message, smoothStream, streamText } from "ai";
import { NextRequest } from "next/server";
import { tools } from "@/lib/tools";

// Allow streaming responses up to 120 seconds
export const maxDuration = 120;

// Error handler function for tools
function errorHandler(error: unknown) {
  if (error == null) {
    return 'An unknown error occurred';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }

  return `Error: ${JSON.stringify(error)}`;
}

export async function POST(request: NextRequest) {
  const {
    messages,
    selectedModelId = "sonnet-3.7", // Default to Claude Sonnet if model ID is not provided
    isReasoningEnabled = false,
    isAgenticEnabled = false,
  }: {
    messages: Array<Message>;
    selectedModelId?: modelID;
    isReasoningEnabled?: boolean;
    isAgenticEnabled?: boolean;
  } = await request.json();

  // Ensure valid model ID is used
  const modelId = selectedModelId && Object.keys(models).includes(selectedModelId)
    ? selectedModelId 
    : "sonnet-3.7";
    
  console.log("[DEBUG] Using model:", modelId);
  console.log("[DEBUG] Reasoning mode enabled:", isReasoningEnabled);
  console.log("[DEBUG] Agentic mode enabled:", isAgenticEnabled);

  // Ensure the API key is properly set
  const exaApiKey = process.env.EXA_API_KEY;
  console.log("[DEBUG] Exa API Key configured:", exaApiKey ? "Yes" : "No");
  console.log("[DEBUG] Exa API Key length:", exaApiKey ? exaApiKey.length : 0);
  console.log("[DEBUG] Exa API Key format valid:", exaApiKey ? /^[a-f0-9-]{36}$/.test(exaApiKey) : false);
  
  // Prepare system message based on whether we have a valid API key
  const currentDate = new Date();
  const systemMessage = exaApiKey 
    ? `You are a highly capable PhD research assistant operating on ${currentDate.toISOString()}. Your primary function is to find, analyze, and synthesize current information accurately and efficiently. When searching, prioritize recent content and always consider the temporal context of your searches. Always cite your sources and provide context for your findings, including publication dates when available. The current year is ${currentDate.getFullYear()}, and you should focus on information relevant to this timeframe.`
    : "You are a helpful assistant. Real-time search is currently unavailable.";

  const stream = streamText({
    system: systemMessage,
    model: myProvider.languageModel(modelId),
    // experimental_transform: [
    //   smoothStream({
    //     chunking: "word",
    //   }),
    // ],
    messages,
    toolCallStreaming: true,
    // Only enable tools if agentic mode is enabled and Exa API key is available
    tools: tools,
    maxSteps: 5
  });

  return stream.toDataStreamResponse({
    sendReasoning: isReasoningEnabled,
    sendSources: true,
    getErrorMessage: errorHandler,
  });
}
