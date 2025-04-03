import { tool as createTool, ToolCallUnion, ToolResultUnion } from 'ai';
import { z } from 'zod';
import Exa from 'exa-js';
import { ExaSearchResponseSchema, CitationSchema } from './search-schema';
// We need the type definition if we are mapping results
import { SearchResultItem } from './types'; // Correct type for a single result item

// Define the Citation type based on the expected structure from Exa API
interface Citation {
  id?: string;
  title?: string;
  url: string;
  content?: string;
  snippet?: string;
  publishedDate?: string;
  author?: string;
  image?: string;
  favicon?: string;
}

// Define interfaces for tool results

export const exaSearchTool = createTool({
  description: 'Search the web for current information. This tool returns a list of search results with titles, URLs, snippets, publication dates, and images. Use this tool WHENEVER you need to find specific facts, recent events, or up-to-date information that may not be in your training data.',
  parameters: z.object({
    query: z.string().describe('A clear, specific search query focused on the information you need. Be precise and include key terms for better results.')
  }),
  execute: async ({ query }, { toolCallId, messages, abortSignal }): Promise<{ results: SearchResultItem[], images?: { url: string, description: string }[], query: string }> => {
    console.log("Executing Exa search with query:", query);
    console.log("Tool call ID:", toolCallId);
    
    // Log the number of messages in the conversation for context
    if (messages) {
      console.log(`Processing search with ${messages.length} messages in conversation history`);
    }

    const exaApiKey = process.env.EXA_API_KEY;
    if (!exaApiKey) {
      throw new Error('Exa API key is not configured');
    }

    try {
      // Initialize the Exa client with the API key
      const exa = new Exa(exaApiKey);

      console.log("Using Exa streamAnswer API for real-time information");

      // Create abort controller for fetch operations if abortSignal is provided
      const controller = abortSignal ? new AbortController() : null;
      if (controller && abortSignal) {
        // Forward abort signal to our controller
        abortSignal.addEventListener('abort', () => {
          controller.abort();
        });
      }

      // Use the streamAnswer API to get accurate and relevant results
      // Define options with the correct type for the model parameter
      const options: { text?: boolean; model?: "exa" | "exa-pro"; highlight_images?: boolean; include_domains?: string[] } = {
        model: "exa-pro",
        highlight_images: true, // Enable image retrieval from search results
        text: true
      };
      
      // Use the streamAnswer API with the appropriate options
      const streamResponse = exa.streamAnswer(query, options);
      
      // Note: The Exa API doesn't directly support abort signals in its type definition
      // We would need to modify the library or use a different approach for cancellation
      
      // Collect all chunks from the AsyncGenerator
      let finalChunk = null;
      let citations: Citation[] = [];
      
      // Process each chunk from the stream
      for await (const chunk of streamResponse) {
        // Check if operation was aborted
        if (abortSignal?.aborted) {
          console.log("Search operation aborted");
          break;
        }
        
        // Store the latest chunk (the final one will contain citations)
        finalChunk = chunk;
        console.log("Received chunk:", JSON.stringify(chunk, null, 2));
        
        // If this chunk has citations, store them
        if (chunk.citations && chunk.citations.length > 0) {
          citations = chunk.citations;
        }
      }
      
      console.log("Stream processing complete");
      console.log("Citations found:", citations.length);
      
      if (citations.length > 0) {
        console.log("First citation:", JSON.stringify(citations[0], null, 2));
      }

      // Map the citations to the SearchResultItem structure
      const mappedResults: SearchResultItem[] = citations.map(citation => ({
        title: citation.title || 'No title',
        url: citation.url,
        content: citation.content || '',
        snippet: citation.snippet || citation.content || '', // Use snippet or content if available
        publishedDate: citation.publishedDate,
        author: citation.author,
        score: 1, // Default score
        metadata: {
          source: {
            type: 'webpage',
            url: citation.url,
            title: citation.title || 'No title',
            publishedDate: citation.publishedDate
          }
        }
      }));

      // If no results were found, log a message
      if (mappedResults.length === 0) {
        console.log("No results found for query:", query);
      }

      // Extract images from citations
      const images = citations
        .filter(citation => citation.image)
        .map(citation => ({
          url: citation.image as string,
          description: citation.title || 'Image'
        }));

      console.log(`Found ${images.length} images in search results`);
      
      // Return the mapped results, images, and the original query
      return {
        results: mappedResults,
        images: images.length > 0 ? images : undefined,
        query
      };
    } catch (error) {
      console.error("Full Exa search error:", error);
      // Rethrow a more informative error
      throw new Error(`Failed to execute Exa search: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});



// Export the tools in the expected format
export const tools = {
  exaSearch: exaSearchTool
};

// Export type definitions for tool calls and results
export type ExaSearchToolCall = ToolCallUnion<typeof tools>;
export type ExaSearchToolResult = ToolResultUnion<typeof tools>;
