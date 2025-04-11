import { tool as createTool } from 'ai';
import { z } from 'zod';
import Exa from 'exa-js';
import { ExaSearchResponseSchema } from './search-schema';
import { convertExaResultsToSearchResults } from './types';

export const exaSearchTool = createTool({
  description: 'Search the web for real-time information about a topic or query.',
  parameters: z.object({ 
    query: z.string().describe('The search query to look up information about.') 
  }),
  execute: async ({ query }) => {
    console.log("[DEBUG] Executing Exa search with query:", query);
    
    // Check for API key with specific logging
    const exaApiKey = process.env.EXA_API_KEY;
    console.log("[DEBUG] Exa API Key available:", !!exaApiKey);
    if (!exaApiKey) {
      throw new Error('Exa API key is not configured');
    }

    try {
      // Initialize Exa with the API key directly
      const exa = new Exa(exaApiKey);
      
      console.log("Exa client initialized, executing searchAndContents with query:", query);
      
      // Use the searchAndContents method as specified
      console.log("[DEBUG] Calling exa.searchAndContents with options:", {
        text: true,
        type: "auto",
        numResults: 10,
        livecrawl: "always",
        subpages: 1,
        extras: { links: 1 }
      });
      
      const searchResults = await exa.searchAndContents(
        query,
        {
          text: true,
          type: "auto",
          numResults: 10,
          livecrawl: "always",
          subpages: 1,
          extras: {
            links: 1
          }
        }
      );

      // Add detailed debug logging
      console.log("[DEBUG] Raw Exa search results structure:",
        JSON.stringify({
          resultCount: searchResults?.results?.length || 0,
          hasResults: !!searchResults?.results,
          firstResultKeys: searchResults?.results?.[0] ? Object.keys(searchResults.results[0]) : []
        }, null, 2)
      );
      
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
              : r.highlights.map(h => typeof h === 'string' ? h : (h.text || '')).filter(Boolean).join(' ')
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
      console.error("[ERROR] Full Exa search error:", error);
      console.error("[ERROR] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("[ERROR] Error type:", Object.prototype.toString.call(error));
      
      // Create a more informative error message
      const errorMessage = error instanceof Error
        ? `Failed to execute Exa search: ${error.message}`
        : `Failed to execute Exa search: ${String(error)}`;
        
      console.error("[ERROR] Final error message:", errorMessage);
      throw new Error(errorMessage);
    }
  }
});

export const tools = {
  exaSearch: exaSearchTool
}; 