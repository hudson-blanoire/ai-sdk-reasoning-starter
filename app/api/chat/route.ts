import { modelID, myProvider, models } from "@/lib/models";
import { Message, smoothStream, streamText } from "ai";
import { NextRequest } from "next/server";
import { tools } from "@/lib/tools";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

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
  
  // Get current date and time information
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentTime = now.toLocaleTimeString('en-US');
  
  // Prepare system message with specific 2-step flow instructions and current temporal context
  const systemMessage = `You are a research assistant who follows a strict 2-step process:

1. FIRST STEP: When you receive a question, use the exaSearch tool ONCE to gather relevant information.
2. SECOND STEP: After receiving search results, provide a comprehensive answer based ONLY on those results without making additional searches.

Current temporal context: Today is ${currentDate}, and the current time is ${currentTime}. It is currently the year ${now.getFullYear()}. Always consider this current temporal information when formulating search queries and providing responses.

Never make more than one search query per user question. Answer directly after receiving search results.`;

  const stream = streamText({
    system: systemMessage,
    model: myProvider.languageModel(selectedModelId),
    temperature: 0, // Set temperature to 0 for deterministic output
    experimental_transform: [
      smoothStream({
        chunking: "word",
      }),
    ],
    messages,
    toolCallStreaming: true,
    // Enable tools with specific constraints to enforce the 2-step flow
    tools,
    toolChoice: "auto", // Allow tool selection but control via system prompt
    // We control the flow via the system prompt and maxSteps
    maxSteps: 2, // Increase max steps slightly for potential multi-query breakdown
    // Add onStepFinish callback to track and log each step of the tool execution process
    onStepFinish({ toolCalls, finishReason, usage }) {
      console.log(`Step finished: ${toolCalls.length} tool calls executed`);
      
      // Log tool calls and results for debugging
      if (toolCalls.length > 0) {
        console.log('Tool calls:', JSON.stringify(toolCalls.map(call => ({
          id: call.toolCallId, // Use toolCallId instead of id
          name: call.toolName, // Use toolName instead of name
          args: call.args
        })), null, 2));
      }
      
      // Log finish reason and token usage if available
      console.log(`Finish reason: ${finishReason}`);
      if (usage) {
        console.log(`Token usage: ${JSON.stringify(usage)}`);
      }
    },
  });

  return stream.toDataStreamResponse({
    sendReasoning: isReasoningEnabled,
    sendSources: true,
    getErrorMessage: errorHandler,
  });
}
