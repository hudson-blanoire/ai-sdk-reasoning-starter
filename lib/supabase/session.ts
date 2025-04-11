import { createSupabaseClientWithUser } from './client';

/**
 * Interface for Session structure
 */
export interface Session {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageIds?: string[];
  metadata?: Record<string, any>;
}

/**
 * Create a new chat session
 */
export async function createSession(
  userId: string, 
  title: string, 
  metadata?: Record<string, any>
): Promise<string> {
  const supabase = createSupabaseClientWithUser(userId);
  
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      title,
      metadata
    })
    .select('id')
    .single();
    
  if (error) throw error;
  return data.id;
}

/**
 * Get a session by ID
 */
export async function getSession(
  userId: string,
  sessionId: string
): Promise<Session | null> {
  const supabase = createSupabaseClientWithUser(userId);
  
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }
  
  if (!data) return null;
  
  // Convert to application model format
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
    metadata: data.metadata
  };
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId: string): Promise<Session[]> {
  const supabase = createSupabaseClientWithUser(userId);
  
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching user sessions:', error);
    return [];
  }
  
  // Convert to application model format
  return data.map(session => ({
    id: session.id,
    userId: session.user_id,
    title: session.title,
    createdAt: new Date(session.created_at).getTime(),
    updatedAt: new Date(session.updated_at).getTime(),
    metadata: session.metadata
  }));
}

/**
 * Update session title or metadata
 */
export async function updateSession(
  userId: string,
  sessionId: string, 
  updates: { title?: string; metadata?: Record<string, any> }
): Promise<void> {
  const supabase = createSupabaseClientWithUser(userId);
  
  const { error } = await supabase
    .from('sessions')
    .update({
      ...(updates.title && { title: updates.title }),
      ...(updates.metadata && { metadata: updates.metadata }),
      updated_at: new Date()
    })
    .eq('id', sessionId)
    .eq('user_id', userId);
    
  if (error) throw error;
}

/**
 * Delete a session and all its messages
 */
export async function deleteSession(
  userId: string,
  sessionId: string
): Promise<void> {
  const supabase = createSupabaseClientWithUser(userId);
  
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);
    
  if (error) throw error;
}
