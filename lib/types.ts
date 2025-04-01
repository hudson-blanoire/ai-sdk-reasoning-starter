import { ExaSearchResult } from './search-schema';

export interface SearchResultItem {
  title: string | null;
  url: string;
  content?: string;
  snippet?: string;
  publishedDate?: string;
  author?: string | null;
  score?: number;
}

export interface SearchResultImage {
  url: string;
  description: string;
}

export interface SearchResults {
  results: SearchResultItem[];
  images?: SearchResultImage[];
  query?: string;
}

// Helper function to convert Exa search results to our app format
export function convertExaResultsToSearchResults(exaResults: ExaSearchResult[]): SearchResults {
  const results: SearchResultItem[] = exaResults.map(result => ({
    title: result.title,
    url: result.url,
    content: result.text,
    snippet: Array.isArray(result.highlights) 
      ? typeof result.highlights[0] === 'string'
        ? result.highlights.join(' ')
        : result.highlights.map(h => h.text).filter(Boolean).join(' ')
      : undefined,
    publishedDate: result.publishedDate,
    author: result.author,
    score: result.score
  }));

  return {
    results
  };
} 