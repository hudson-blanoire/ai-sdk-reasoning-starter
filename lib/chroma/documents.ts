import { getUserCollection, generateEmbedding } from './client';

/**
 * Interface for Document structure with vector embedding
 */
export interface Document {
  id: string;
  title: string;
  content: string;
  url?: string;
  userId: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt?: number;
}

/**
 * Add a document with its embedding to the user's collection
 */
export async function addDocument(
  userId: string,
  document: Omit<Document, 'id' | 'embedding' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const collection = await getUserCollection(userId);
  
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  
  // Generate embedding for the document content
  const embeddingResult = await generateEmbedding(document.content);
  
  // Prepare metadata
  const documentMetadata = {
    title: document.title,
    url: document.url || '',
    userId,
    metadata: JSON.stringify(document.metadata || {}),
    createdAt: createdAt,
    updatedAt: createdAt
  };
  
  // Add document to ChromaDB
  await collection.add({
    ids: [id],
    embeddings: [embeddingResult],
    metadatas: [documentMetadata],
    documents: [document.content]
  });
  
  console.log(`Added document ${id} to collection for user ${userId}`);
  return id;
}

/**
 * Search for similar documents based on a query
 */
export async function searchDocuments(
  userId: string,
  query: string,
  limit = 5
): Promise<Document[]> {
  try {
    const collection = await getUserCollection(userId, false);
    
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search for similar documents
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit
    });
    
    // Format results to match the expected Document type
    const documents: Document[] = [];
    
    if (results.ids[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        const metadata = results.metadatas[0][i];
        // Handle potentially null metadata safely
        const metadataStr = metadata && metadata.metadata ? String(metadata.metadata) : '{}';
        const parsedMetadata = JSON.parse(metadataStr);
        
        documents.push({
          id: results.ids[0][i],
          title: metadata && metadata.title ? String(metadata.title) : 'Untitled',
          content: results.documents && results.documents[0] ? String(results.documents[0][i]) : '',
          url: metadata && metadata.url ? String(metadata.url) : '',
          userId: metadata && metadata.userId ? String(metadata.userId) : userId,
          embedding: [], // Not returning the actual embedding
          metadata: parsedMetadata,
          createdAt: metadata && metadata.createdAt ? Number(metadata.createdAt) : Date.now(),
          updatedAt: metadata && metadata.updatedAt ? Number(metadata.updatedAt) : undefined
        });
      }
    }
    
    return documents;
  } catch (error) {
    console.error(`Error searching documents for user ${userId}:`, error);
    return [];
  }
}

/**
 * Delete a document by ID
 */
export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  try {
    const collection = await getUserCollection(userId, false);
    await collection.delete({
      ids: [documentId]
    });
    console.log(`Deleted document ${documentId} from collection for user ${userId}`);
  } catch (error) {
    console.error(`Error deleting document ${documentId} for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get all documents for a user
 */
export async function getUserDocuments(userId: string): Promise<Document[]> {
  try {
    const collection = await getUserCollection(userId, false);
    
    const results = await collection.get();
    
    // Format results to match the expected Document type
    const documents: Document[] = [];
    
    if (results.ids.length > 0) {
      for (let i = 0; i < results.ids.length; i++) {
        const metadata = results.metadatas[i];
        // Handle potentially null metadata safely
        const metadataStr = metadata && metadata.metadata ? String(metadata.metadata) : '{}';
        const parsedMetadata = JSON.parse(metadataStr);
        
        documents.push({
          id: results.ids[i],
          title: metadata && metadata.title ? String(metadata.title) : 'Untitled',
          content: results.documents ? String(results.documents[i]) : '',
          url: metadata && metadata.url ? String(metadata.url) : '',
          userId: metadata && metadata.userId ? String(metadata.userId) : userId,
          embedding: [], // Not returning the actual embedding
          metadata: parsedMetadata,
          createdAt: metadata && metadata.createdAt ? Number(metadata.createdAt) : Date.now(),
          updatedAt: metadata && metadata.updatedAt ? Number(metadata.updatedAt) : undefined
        });
      }
    }
    
    return documents;
  } catch (error) {
    console.error(`Error fetching documents for user ${userId}:`, error);
    return [];
  }
}
