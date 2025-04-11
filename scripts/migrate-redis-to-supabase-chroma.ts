/**
 * Migration Script: Redis to Supabase and ChromaDB
 * 
 * This script migrates data from Redis to Supabase for chat history
 * and ChromaDB for vector search functionality.
 * 
 * Usage:
 * 1. Ensure all environment variables are set
 * 2. Run with: npx tsx scripts/migrate-redis-to-supabase-chroma.ts
 */

import dotenv from 'dotenv';
import { createClient } from 'redis';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from '@langchain/openai';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Type definitions for Redis data
interface RedisSession {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageIds: string[];
  metadata?: Record<string, any>;
}

interface RedisMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  embedding?: number[];
  metadata?: Record<string, any>;
}

interface RedisDocument {
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

// User ID mapping interface
interface UserIdMapping {
  [redisUserId: string]: string; // Maps Redis user IDs to Clerk user IDs
}

/**
 * Main migration function
 */
async function migrateData() {
  console.log('Starting migration from Redis to Supabase and ChromaDB');
  
  // Connect to Redis
  const redisClient = await connectToRedis();
  
  // Connect to Supabase
  const supabase = connectToSupabase();
  
  // Connect to ChromaDB
  const chromaClient = new ChromaClient({
    path: process.env.CHROMADB_URL || 'http://localhost:8000'
  });
  
  // Initialize OpenAI embeddings
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY!,
    modelName: "text-embedding-3-small"
  });
  
  try {
    // Get user mapping (if available)
    const userMapping = await getUserIdMapping();
    
    // 1. Migrate Sessions
    console.log('Migrating sessions...');
    const sessionKeys = await redisClient.keys('session:*');
    console.log(`Found ${sessionKeys.length} sessions to migrate`);
    
    let successfulSessions = 0;
    
    for (const key of sessionKeys) {
      try {
        const sessionData = await redisClient.hGetAll(key);
        const redisUserId = sessionData.userId;
        
        // Map Redis user ID to Clerk user ID if mapping exists
        const clerkUserId = userMapping[redisUserId] || redisUserId;
        
        // Parse session data
        const session: RedisSession = {
          id: key.replace('session:', ''),
          userId: clerkUserId,
          title: sessionData.title || 'Untitled Session',
          createdAt: parseInt(sessionData.createdAt) || Date.now(),
          updatedAt: parseInt(sessionData.updatedAt) || Date.now(),
          messageIds: JSON.parse(sessionData.messageIds || '[]'),
          metadata: sessionData.metadata ? JSON.parse(sessionData.metadata) : undefined
        };
        
        // Insert into Supabase
        const { error } = await supabase.from('sessions').insert({
          id: session.id,
          user_id: session.userId,
          title: session.title,
          created_at: new Date(session.createdAt).toISOString(),
          updated_at: new Date(session.updatedAt).toISOString(),
          metadata: session.metadata
        });
        
        if (error) {
          console.error(`Error migrating session ${session.id}:`, error);
        } else {
          successfulSessions++;
        }
      } catch (error) {
        console.error(`Error processing session ${key}:`, error);
      }
    }
    
    console.log(`Successfully migrated ${successfulSessions} of ${sessionKeys.length} sessions`);
    
    // 2. Migrate Messages
    console.log('Migrating messages...');
    const messageKeys = await redisClient.keys('message:*');
    console.log(`Found ${messageKeys.length} messages to migrate`);
    
    let successfulMessages = 0;
    
    for (const key of messageKeys) {
      try {
        const messageData = await redisClient.hGetAll(key);
        
        // Parse message data
        const message: RedisMessage = {
          id: key.replace('message:', ''),
          sessionId: messageData.sessionId,
          role: messageData.role as 'user' | 'assistant' | 'system',
          content: messageData.content || '',
          createdAt: parseInt(messageData.createdAt) || Date.now(),
          metadata: messageData.metadata ? JSON.parse(messageData.metadata) : undefined
        };
        
        // Insert into Supabase
        const { error } = await supabase.from('messages').insert({
          id: message.id,
          session_id: message.sessionId,
          role: message.role,
          content: message.content,
          created_at: new Date(message.createdAt).toISOString(),
          metadata: message.metadata
        });
        
        if (error) {
          console.error(`Error migrating message ${message.id}:`, error);
        } else {
          successfulMessages++;
        }
      } catch (error) {
        console.error(`Error processing message ${key}:`, error);
      }
    }
    
    console.log(`Successfully migrated ${successfulMessages} of ${messageKeys.length} messages`);
    
    // 3. Migrate Documents to ChromaDB
    console.log('Migrating documents to ChromaDB...');
    const documentKeys = await redisClient.keys('document:*');
    console.log(`Found ${documentKeys.length} documents to migrate`);
    
    // Group documents by user for better organization
    const documentsByUser: Record<string, RedisDocument[]> = {};
    
    // Process document data
    for (const key of documentKeys) {
      try {
        const docData = await redisClient.hGetAll(key);
        const redisUserId = docData.userId;
        
        // Map Redis user ID to Clerk user ID if mapping exists
        const clerkUserId = userMapping[redisUserId] || redisUserId;
        
        // Parse document data
        const document: RedisDocument = {
          id: key.replace('document:', ''),
          title: docData.title || 'Untitled Document',
          content: docData.content || '',
          url: docData.url,
          userId: clerkUserId,
          embedding: docData.embedding ? JSON.parse(docData.embedding) : [],
          metadata: docData.metadata ? JSON.parse(docData.metadata) : {},
          createdAt: parseInt(docData.createdAt) || Date.now(),
          updatedAt: parseInt(docData.updatedAt) || Date.now()
        };
        
        if (!documentsByUser[document.userId]) {
          documentsByUser[document.userId] = [];
        }
        
        documentsByUser[document.userId].push(document);
      } catch (error) {
        console.error(`Error processing document ${key}:`, error);
      }
    }
    
    // Process each user's documents
    let totalMigratedDocuments = 0;
    
    for (const [userId, documents] of Object.entries(documentsByUser)) {
      try {
        // Get or create collection for the user
        const collectionName = `user_docs_${userId}`;
        let collection;
        
        try {
          collection = await chromaClient.getCollection({ name: collectionName });
          console.log(`Found existing collection for user ${userId}`);
        } catch (error) {
          collection = await chromaClient.createCollection({
            name: collectionName,
            metadata: { userId, description: "User document embeddings" }
          });
          console.log(`Created new collection for user ${userId}`);
        }
        
        // Batch documents for efficiency
        const batchSize = 50;
        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);
          
          // Add documents to collection
          await collection.add({
            ids: batch.map(doc => doc.id),
            embeddings: batch.map(doc => doc.embedding),
            metadatas: batch.map(doc => ({
              title: doc.title,
              url: doc.url || '',
              userId: doc.userId,
              metadata: JSON.stringify(doc.metadata || {}),
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt
            })),
            documents: batch.map(doc => doc.content)
          });
          
          totalMigratedDocuments += batch.length;
          console.log(`Migrated ${batch.length} documents for user ${userId}`);
        }
      } catch (error) {
        console.error(`Error migrating documents for user ${userId}:`, error);
      }
    }
    
    console.log(`Successfully migrated ${totalMigratedDocuments} of ${documentKeys.length} documents`);
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connections
    await redisClient.quit();
    console.log('Closed Redis connection');
  }
}

/**
 * Connect to Redis
 */
async function connectToRedis() {
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;
  const redisPassword = process.env.REDIS_PASSWORD;
  const redisUsername = process.env.REDIS_USERNAME || 'default';
  
  if (!redisHost || !redisPort || !redisPassword) {
    throw new Error('Redis configuration missing. Please set REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD in .env.local file.');
  }
  
  const redisClient = createClient({
    url: `redis://${redisUsername}:${redisPassword}@${redisHost}:${redisPort}`
  });
  
  await redisClient.connect();
  console.log('Connected to Redis');
  
  return redisClient;
}

/**
 * Connect to Supabase
 */
function connectToSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local file.');
  }
  
  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    }
  });
  
  console.log('Connected to Supabase');
  return supabase;
}

/**
 * Get user ID mapping
 * This function can be customized to load mappings from a file or database
 */
async function getUserIdMapping(): Promise<UserIdMapping> {
  // This is a placeholder for loading user ID mappings
  // In a real implementation, you would load this from a file or database
  
  // Example mapping (replace with actual mapping logic)
  const mapping: UserIdMapping = {
    // redisUserId: clerkUserId
  };
  
  return mapping;
}

// Run the migration
migrateData()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
