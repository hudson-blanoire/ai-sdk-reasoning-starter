import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env.local file.');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySupabaseTables() {
  console.log('Verifying Supabase tables...');
  
  try {
    // Check sessions table
    const { count: sessionsCount, error: sessionsError } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });
    
    if (sessionsError) {
      console.error('Error accessing sessions table:', sessionsError);
      // Try to create sessions table if it doesn't exist
      console.log('Attempting to create sessions table...');
      
      const { error: createSessionsError } = await supabase.rpc('create_sessions_table');
      
      if (createSessionsError) {
        console.error('Failed to create sessions table:', createSessionsError);
      } else {
        console.log('Sessions table created successfully.');
      }
    } else {
      console.log(`Sessions table exists. Count: ${sessionsCount}`);
    }
    
    // Check messages table
    const { count: messagesCount, error: messagesError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    
    if (messagesError) {
      console.error('Error accessing messages table:', messagesError);
      // Try to create messages table if it doesn't exist
      console.log('Attempting to create messages table...');
      
      const { error: createMessagesError } = await supabase.rpc('create_messages_table');
      
      if (createMessagesError) {
        console.error('Failed to create messages table:', createMessagesError);
      } else {
        console.log('Messages table created successfully.');
      }
    } else {
      console.log(`Messages table exists. Count: ${messagesCount}`);
    }
    
    // Get SQL definitions for tables
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('get_table_definitions');
    
    if (tablesError) {
      console.error('Could not get table definitions:', tablesError);
    } else if (tablesData) {
      console.log('Table definitions:', tablesData);
    }
    
  } catch (error) {
    console.error('Error verifying Supabase tables:', error);
  }
}

// Run the verification
verifySupabaseTables()
  .then(() => {
    console.log('Verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
