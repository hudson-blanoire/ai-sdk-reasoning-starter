import { NextRequest } from 'next/server';
import { Message, streamText } from 'ai';
import { retrieveContextForQuery } from '@/lib/redis/rag';
import { auth } from '@clerk/nextjs/server';
import { openai } from '@ai-sdk/openai';

export const runtime = 'edge';
export const maxDuration = 30; // Allow streaming responses up to 30 seconds

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    const userId = session?.userId;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Please sign in.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const { messages } = await req.json();
    
    // Get the latest user message
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // Retrieve relevant context from Redis vector database
    const { contextText, sources } = await retrieveContextForQuery(
      userQuery, 
      userId
    );

    // Prepare the system message with context
    const systemMessageContent = `You are a helpful assistant that answers questions based on the provided context. 
When the context doesn't contain the answer, acknowledge that you don't know instead of making up a response.

RELEVANT CONTEXT:
${contextText || "No specific context available for this query."}`;

    // Map messages to the format expected by OpenAI
    const promptMessages = [
      {
        role: 'system',
        content: systemMessageContent,
      },
      ...messages.map((message: Message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    // Use the Vercel AI SDK streamText function with context from RAG
    const result = streamText({
      model: openai('gpt-4-turbo'),
      messages: promptMessages,
      temperature: 0.7,
    });
    
    // Convert the stream to a response with source headers
    const response = result.toDataStreamResponse({
      headers: {
        'x-sources': JSON.stringify(sources),
      },
    });
    
    return response;
  } catch (error) {
    console.error('Error in RAG API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process your request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
