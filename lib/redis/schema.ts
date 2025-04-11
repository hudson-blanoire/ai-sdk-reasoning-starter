import { SchemaFieldTypes } from '@redis/search';

/**
 * Redis index definition for user sessions
 */
export const sessionIndexDefinition = {
  indexName: 'idx:sessions',
  prefix: 'session:',
  schema: {
    userId: {
      type: SchemaFieldTypes.TAG,
      sortable: true
    },
    createdAt: {
      type: SchemaFieldTypes.NUMERIC,
      sortable: true
    },
    updatedAt: {
      type: SchemaFieldTypes.NUMERIC,
      sortable: true
    },
    title: {
      type: SchemaFieldTypes.TEXT
    }
  }
};

/**
 * Redis index definition for messages
 */
export const messageIndexDefinition = {
  indexName: 'idx:messages',
  prefix: 'message:',
  schema: {
    sessionId: {
      type: SchemaFieldTypes.TAG,
      sortable: true
    },
    createdAt: {
      type: SchemaFieldTypes.NUMERIC,
      sortable: true
    },
    role: {
      type: SchemaFieldTypes.TAG
    },
    content: {
      type: SchemaFieldTypes.TEXT
    }
  }
};

/**
 * Redis vector index definition for document embeddings
 */
export const documentVectorIndexDefinition = {
  indexName: 'idx:documents',
  prefix: 'document:',
  schema: {
    title: {
      type: SchemaFieldTypes.TEXT
    },
    content: {
      type: SchemaFieldTypes.TEXT
    },
    metadata: {
      type: SchemaFieldTypes.TEXT
    },
    url: {
      type: SchemaFieldTypes.TEXT
    },
    userId: {
      type: SchemaFieldTypes.TAG,
    },
    embedding: {
      type: SchemaFieldTypes.VECTOR,
      ALGORITHM: 'HNSW',
      TYPE: 'FLOAT32',
      DIM: 1536, // OpenAI's embedding dimension (ada-002)
      DISTANCE_METRIC: 'COSINE'
    }
  }
};

/**
 * Schema interface for User Session
 */
export interface Session {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageIds: string[];
  metadata?: Record<string, any>;
}

/**
 * Schema interface for Message
 */
export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  embedding?: number[]; // Vector embedding for retrieval
  metadata?: Record<string, any>;
}

/**
 * Schema interface for Document with vector embedding
 */
export interface Document {
  id: string;
  title: string;
  content: string;
  url?: string;
  userId: string;
  embedding: number[];
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt?: number;
}
