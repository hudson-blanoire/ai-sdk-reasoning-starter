import z from 'zod';

// Super permissive schema that will accept any shape of data
export const ExaSearchResultSchema = z.object({
  // Allow any string or null for title
  title: z.union([z.string(), z.null()]).optional(),
  // URL is the only truly required field
  url: z.string(),
  // All other fields are optional
  publishedDate: z.string().optional(),
  author: z.union([z.string(), z.null()]).optional(),
  score: z.number().optional(),
  id: z.string().optional(),
  text: z.string().optional(),
  // Accept both string arrays and object arrays for flexibility
  highlights: z.union([
    z.array(z.string()), 
    z.array(z.object({
      text: z.string().optional(),
      score: z.number().optional()
    }))
  ]).optional(),
  highlightScores: z.array(z.number()).optional(),
  // Document field can be any shape
  document: z.any().optional(),
}).passthrough(); // Allow any additional fields not explicitly defined

export const ExaSearchResponseSchema = z.object({
  // Results array is the only truly required field
  results: z.array(ExaSearchResultSchema),
  // Allow any other fields
  autopromptString: z.string().optional(),
  requestId: z.string().optional(),
}).passthrough(); // Allow any additional fields

export type ExaSearchResult = z.infer<typeof ExaSearchResultSchema>;
export type ExaSearchResponse = z.infer<typeof ExaSearchResponseSchema>;
