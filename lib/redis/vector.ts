import { v4 as uuidv4 } from 'uuid';
import { getRedisClient } from './client';
import { Document } from './schema';

/**
 * Store a document with its vector embedding in Redis
 */
export async function storeDocumentWithEmbedding(
  title: string,
  content: string,
  embedding: number[],
  userId: string,
  url?: string,
  metadata?: Record<string, any>
): Promise<Document> {
  const client = await getRedisClient();
  
  // Generate unique document ID
  const documentId = `document:${uuidv4()}`;
  const timestamp = Date.now();
  
  // Prepare document object
  const document: Document = {
    id: documentId,
    title,
    content,
    url,
    userId,
    embedding,
    metadata: metadata || {},
    createdAt: timestamp
  };
  
  // Convert embedding to flat string for Redis storage
  const flatEmbedding = embedding.toString();
  
  // Convert metadata to string for storage
  const metadataString = metadata ? JSON.stringify(metadata) : '{}';
  
  // Store in Redis
  // Convert document to a plain object with string values to avoid Redis type errors
  const redisObject = {
    id: documentId,
    title: String(title),
    content: String(content),
    url: url ? String(url) : '',
    userId: String(userId),
    embedding: flatEmbedding,
    metadata: metadataString,
    createdAt: String(timestamp)
  };
  
  // Store each field individually to avoid type errors
  await client.hSet(documentId, redisObject);
  
  return document;
}

/**
 * Retrieve similar documents using vector similarity search
 */
export async function findSimilarDocuments(
  queryEmbedding: number[],
  userId: string,
  limit: number = 5,
  scoreThreshold: number = 0.75
): Promise<{ documents: Document[]; scores: number[] }> {
  const client = await getRedisClient();
  
  // Convert embedding array to string for the query
  const queryVector = queryEmbedding.toString();
  
  // Perform vector similarity search
  const results = await client.ft.search(
    'idx:documents',
    `@userId:{${userId}} => [KNN ${limit} @embedding $query_vector AS score]`,
    {
      PARAMS: {
        query_vector: queryVector
      },
      RETURN: ['title', 'content', 'url', 'metadata', 'createdAt', 'score'],
      SORTBY: {
        BY: 'score',
        DIRECTION: 'DESC'
      },
      DIALECT: 2
    }
  );
  
  if (!results.documents || results.documents.length === 0) {
    return { documents: [], scores: [] };
  }
  
  // Process results and filter by score threshold
  const documents: Document[] = [];
  const scores: number[] = [];
  
  for (const doc of results.documents) {
    // Handle score safely - ensure it's a number
    const scoreValue = doc.value.score;
    const score = typeof scoreValue === 'number' ? scoreValue : 
                  typeof scoreValue === 'string' ? parseFloat(scoreValue) : 0;
    
    // Skip documents below the score threshold
    if (score < scoreThreshold) {
      continue;
    }
    
    // Parse metadata from string
    let metadata = {};
    try {
      const metadataStr = typeof doc.value.metadata === 'string' ? doc.value.metadata : '{}';
      metadata = JSON.parse(metadataStr);
    } catch (error) {
      console.error('Error parsing metadata:', error);
    }
    
    // Add document to results
    documents.push({
      id: doc.id,
      title: String(doc.value.title || ''),
      content: String(doc.value.content || ''),
      url: doc.value.url ? String(doc.value.url) : undefined,
      userId,
      embedding: [], // We don't return the embedding to save bandwidth
      metadata,
      createdAt: typeof doc.value.createdAt === 'string' ? 
        parseInt(doc.value.createdAt) : 
        typeof doc.value.createdAt === 'number' ? 
          doc.value.createdAt : Date.now()
    });
    
    scores.push(score);
  }
  
  return { documents, scores };
}

/**
 * Delete a document from the vector database
 */
export async function deleteDocument(documentId: string): Promise<boolean> {
  const client = await getRedisClient();
  
  // Delete from Redis
  const result = await client.del(documentId);
  
  return result === 1;
}

/**
 * Get all documents for a user
 */
export async function getUserDocuments(userId: string): Promise<Document[]> {
  const client = await getRedisClient();
  
  // Query using the index
  const results = await client.ft.search(
    'idx:documents',
    `@userId:{${userId}}`,
    {
      RETURN: ['title', 'content', 'url', 'metadata', 'createdAt'],
      SORTBY: {
        BY: 'createdAt',
        DIRECTION: 'DESC'
      }
    }
  );
  
  if (!results.documents || results.documents.length === 0) {
    return [];
  }
  
  // Process results
  return results.documents.map((doc: any) => {
    // Parse metadata from string
    let metadata = {};
    try {
      const metadataStr = typeof doc.value.metadata === 'string' ? doc.value.metadata : '{}';
      metadata = JSON.parse(metadataStr);
    } catch (error) {
      console.error('Error parsing metadata:', error);
    }
    
    return {
      id: doc.id,
      title: String(doc.value.title || ''),
      content: String(doc.value.content || ''),
      url: doc.value.url ? String(doc.value.url) : undefined,
      userId,
      embedding: [], // We don't return the embedding to save bandwidth
      metadata,
      createdAt: typeof doc.value.createdAt === 'string' ? 
        parseInt(doc.value.createdAt) : 
        typeof doc.value.createdAt === 'number' ? 
          doc.value.createdAt : Date.now()
    };
  });
}
