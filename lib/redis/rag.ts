import { generateEmbedding, chunkText } from './embeddings';
import { findSimilarDocuments, storeDocumentWithEmbedding } from './vector';
import { v4 as uuidv4 } from 'uuid';

/**
 * Index a document for RAG by splitting it into chunks and storing embeddings
 * @param title Document title
 * @param content Document content
 * @param userId Owner of the document
 * @param url Optional URL source of the document
 * @param metadata Additional metadata
 * @returns Array of document IDs created
 */
export async function indexDocumentForRag(
  title: string,
  content: string,
  userId: string,
  url?: string,
  metadata?: Record<string, any>
): Promise<string[]> {
  // Split content into manageable chunks
  const chunks = chunkText(content);
  const documentIds: string[] = [];
  
  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkTitle = chunks.length > 1 ? `${title} (Part ${i + 1}/${chunks.length})` : title;
    
    // Generate embedding for the chunk
    const embedding = await generateEmbedding(chunk);
    
    // Store the chunk with its embedding
    const doc = await storeDocumentWithEmbedding(
      chunkTitle,
      chunk,
      embedding,
      userId,
      url,
      {
        ...metadata,
        chunkIndex: i,
        totalChunks: chunks.length,
        documentId: metadata?.documentId || uuidv4()
      }
    );
    
    documentIds.push(doc.id);
  }
  
  return documentIds;
}

/**
 * Retrieve context for a query using RAG
 * @param query User query
 * @param userId User ID for retrieval
 * @param maxResults Maximum number of results to return
 * @returns Context information relevant to the query
 */
export async function retrieveContextForQuery(
  query: string,
  userId: string,
  maxResults: number = 3
): Promise<{
  contextText: string;
  sources: Array<{ title: string; content: string; url?: string }>;
}> {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);
  
  // Retrieve similar documents
  const { documents } = await findSimilarDocuments(queryEmbedding, userId, maxResults);
  
  // Extract context and sources
  const sources = documents.map(doc => ({
    title: doc.title,
    content: doc.content,
    url: doc.url
  }));
  
  // Combine documents into context text
  const contextText = documents.map(doc => doc.content).join('\n\n');
  
  return {
    contextText,
    sources
  };
}

/**
 * Augment a prompt with retrieved context
 * @param basePrompt Original prompt
 * @param query User query for context retrieval
 * @param userId User ID
 * @returns Augmented prompt with retrieved context
 */
export async function augmentPromptWithContext(
  basePrompt: string,
  query: string,
  userId: string
): Promise<string> {
  // Retrieve relevant context
  const { contextText, sources } = await retrieveContextForQuery(query, userId);
  
  if (!contextText || contextText.trim() === '') {
    return basePrompt;
  }
  
  // Create augmented prompt with context
  const augmentedPrompt = `
${basePrompt}

RELEVANT CONTEXT INFORMATION:
${contextText}

SOURCES:
${sources.map((source, index) => `[${index + 1}] ${source.title}${source.url ? ` (${source.url})` : ''}`).join('\n')}

Based on the above context, respond to the following query: ${query}
`;

  return augmentedPrompt;
}
