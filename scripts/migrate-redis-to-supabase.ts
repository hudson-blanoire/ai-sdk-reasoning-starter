import { createClient } from 'redis';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  username: process.env.REDIS_USERNAME || '',
  password: process.env.REDIS_PASSWORD || '',
};

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env.local file.');
  process.exit(1);
}

// Create Supabase client with service role for migration
const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

async function migrateRedisToSupabase() {
  try {
    console.log('Starting Redis to Supabase migration...');
    
    // Connect to Redis
    const redisClient = createClient({
      url: `redis://${redisConfig.username}:${redisConfig.password}@${redisConfig.host}:${redisConfig.port}`,
    });
    
    await redisClient.connect();
    console.log('Connected to Redis');
    
    // Get all session keys
    const sessionKeys = await redisClient.keys('sessions:*');
    console.log(`Found ${sessionKeys.length} sessions to migrate`);
    
    let migratedSessions = 0;
    let migratedMessages = 0;
    
    for (const sessionKey of sessionKeys) {
      try {
        // Get session data from Redis
        const sessionData = await redisClient.get(sessionKey);
        if (!sessionData) continue;
        
        const session = JSON.parse(sessionData);
        const userId = session.userId;
        
        if (!userId) {
          console.warn(`Session ${sessionKey} has no userId, skipping`);
          continue;
        }
        
        // Insert session into Supabase
        const { data: newSession, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            id: session.id, // Use existing ID if available
            user_id: userId,
            title: session.title || 'Untitled',
            created_at: session.createdAt || new Date().toISOString(),
            updated_at: session.updatedAt || new Date().toISOString(),
            metadata: session.metadata || {}
          })
          .select('id')
          .single();
        
        if (sessionError) {
          console.error(`Error inserting session ${sessionKey}:`, sessionError);
          continue;
        }
        
        console.log(`Migrated session: ${sessionKey} -> ${newSession.id}`);
        migratedSessions++;
        
        // Get messages for this session
        const messageKeys = await redisClient.keys(`messages:${session.id}:*`);
        
        for (const messageKey of messageKeys) {
          try {
            const messageData = await redisClient.get(messageKey);
            if (!messageData) continue;
            
            const message = JSON.parse(messageData);
            
            // Insert message into Supabase
            const { data: newMessage, error: messageError } = await supabase
              .from('messages')
              .insert({
                id: message.id, // Use existing ID if available
                session_id: newSession.id,
                role: message.role,
                content: message.content,
                created_at: message.createdAt || new Date().toISOString(),
                metadata: message.metadata || {}
              })
              .select('id')
              .single();
            
            if (messageError) {
              console.error(`Error inserting message ${messageKey}:`, messageError);
              continue;
            }
            
            migratedMessages++;
          } catch (messageError) {
            console.error(`Error processing message ${messageKey}:`, messageError);
          }
        }
        
        console.log(`Migrated ${messageKeys.length} messages for session ${session.id}`);
      } catch (sessionError) {
        console.error(`Error processing session ${sessionKey}:`, sessionError);
      }
    }
    
    console.log(`Migration completed successfully.`);
    console.log(`Migrated ${migratedSessions} sessions and ${migratedMessages} messages.`);
    
    // Disconnect from Redis
    await redisClient.disconnect();
    console.log('Disconnected from Redis');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateRedisToSupabase()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
