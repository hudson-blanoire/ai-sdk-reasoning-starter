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

  // Ensure valid model ID is used
  const modelId = selectedModelId && Object.keys(models).includes(selectedModelId)
    ? selectedModelId 
    : "sonnet-3.7";
    
  console.log("Using model:", modelId);

  // Ensure the API key is properly set
  const exaApiKey = process.env.EXA_API_KEY;
  console.log("Exa API Key configured:", exaApiKey ? "Yes" : "No");
  
  // Prepare system message based on whether we have a valid API key
  const systemMessage = exaApiKey 
    ? `You are an expert research assistant. Follow these strict rules:
1. When using Exa search:
   - Begin with a direct answer to the question
   - Summarize key findings from top 3 most relevant sources
   - Include explanations for complex terms
   - Use markdown formatting for clarity
   - Present sources as: [Title](URL)
   - MUST format response as:
     """
     **Direct Answer**  
     {concise 1-2 sentence response}

     **Key Information**  
     - {Bullet point from Source 1} [Source 1 Title](URL1)  
     - {Bullet point from Source 2} [Source 2 Title](URL2)  
     - {Explanation of complex terms} [Relevant Source]

     **Sources**  
     {Numbered list of all sources used}
     """

2. For time-sensitive queries:
   - Highlight dates/times in bold
   - Compare information across multiple sources
   - Note any discrepancies between sources

3. General guidelines:
   - Keep paragraphs under 3 sentences
   - Use subheadings for different aspects
   - Add "Why this matters" context when relevant
   - DO NOT use markdown beyond headers/links
   - DO NOT list sources without analysis
   `
    : "You are a helpful assistant. Real-time search is currently unavailable.";

  const stream = streamText({
    system: systemMessage,
    model: myProvider.languageModel(modelId),
    experimental_transform: [
      smoothStream({
        chunking: "word",
      }),
    ],
    messages,
    toolCallStreaming: true,
    // Only enable tools if agentic mode is enabled and Exa API key is available
    tools: isAgenticEnabled && exaApiKey ? tools : undefined,
    maxSteps: 3, // Allow up to 3 steps for multi-turn tool interactions
  });

  return stream.toDataStreamResponse({
    sendReasoning: isReasoningEnabled,
    sendSources: true,
    getErrorMessage: errorHandler,
  });
}
