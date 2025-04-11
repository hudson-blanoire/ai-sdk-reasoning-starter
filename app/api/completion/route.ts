import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  // Log the incoming request
  console.log('Received completion request with prompt:', prompt);

  try {
    const result = streamText({
      model: openai('gpt-3.5-turbo'),
      prompt,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in completion route:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate completion' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
