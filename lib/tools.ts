import { tool as createTool } from 'ai';
import { z } from 'zod';
import { ExaClient } from '@agentic/exa';
import { ExaSearchResponseSchema } from './search-schema';
import { convertExaResultsToSearchResults } from './types';

export const exaSearchTool = createTool({
  description: 'Search the web for real-time information about a topic or query.',
  parameters: z.object({ 
    query: z.string().describe('The search query to look up information about.') 
  }),
  execute: async ({ query }) => {
    console.log("Executing Exa search with query:", query);
    
    const exaApiKey = process.env.EXA_API_KEY;
    if (!exaApiKey) {
      throw new Error('Exa API key is not configured');
    }

    try {
      // Initialize the ExaClient with the API key
      const exa = new ExaClient({
        apiKey: exaApiKey
      });
      
      // Use the client to perform the search with options in the request body
      const searchResults = await exa.search({
        query,
        numResults: 10,
        useAutoprompt: true,
        contents: {
          text: true,
          highlights: {
            numSentences: 3,
            highlightsPerUrl: 2
          }
        }
      });

      // Add debug logging
      console.log("Raw Exa search results:", JSON.stringify(searchResults, null, 2));
      
      const parsed = ExaSearchResponseSchema.parse(searchResults);
      console.log("Parsed results count:", parsed.results.length);
      
      // Return structured data that can be used by the search components
      return {
        results: parsed.results.map(r => ({
          title: r.title || 'No title',
          url: r.url,
          content: r.text || '',
          snippet: Array.isArray(r.highlights) 
            ? typeof r.highlights[0] === 'string'
              ? r.highlights.join(' ')
              : r.highlights.map(h => h.text).filter(Boolean).join(' ')
            : '',
          publishedDate: r.publishedDate,
          author: r.author,
          score: r.score,
          // Add metadata for source attribution
          metadata: {
            source: {
              type: 'webpage',
              url: r.url,
              title: r.title || 'No title',
              publishedDate: r.publishedDate
            }
          }
        })),
        query
      };
    } catch (error) {
      console.error("Full Exa search error:", error);
      throw new Error(`Failed to execute Exa search: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

export const tools = {
  exaSearch: exaSearchTool
}; 