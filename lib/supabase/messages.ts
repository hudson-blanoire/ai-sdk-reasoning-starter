import { createSupabaseClientWithUser } from './client';

/**
 * Interface for Message structure
 */
export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  embedding?: number[];
  metadata?: Record<string, any>;
}

/**
 * Add a message to a session
 */
export async function addMessage(
  userId: string,
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: Record<string, any>
): Promise<string> {
  const supabase = createSupabaseClientWithUser(userId);
  
  // First verify the session belongs to the user
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();
    
  if (sessionError || !sessionData) {
    throw new Error(`Unauthorized or session not found: ${sessionError?.message}`);
  }
  
  // Insert the message
  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      metadata
    })
    .select('id')
    .single();
    
  if (error) throw error;
  
  // Update session's updated_at timestamp
  await supabase
    .from('sessions')
    .update({ updated_at: new Date() })
    .eq('id', sessionId)
    .eq('user_id', userId);
    
  return data.id;
}

/**
 * Get all messages for a session
 */
export async function getSessionMessages(
  userId: string,
  sessionId: string
): Promise<Message[]> {
  const supabase = createSupabaseClientWithUser(userId);
  
  // First verify the session belongs to the user
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();
    
  if (sessionError || !sessionData) {
    console.error('Unauthorized or session not found:', sessionError?.message);
    return [];
  }
  
  // Get messages for the session
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching session messages:', error);
    return [];
  }
  
  // Convert to application model format
  return data.map(message => ({
    id: message.id,
    sessionId: message.session_id,
    role: message.role as 'user' | 'assistant' | 'system',
    content: message.content,
    createdAt: new Date(message.created_at).getTime(),
    metadata: message.metadata
  }));
}

/**
 * Delete a specific message
 */
export async function deleteMessage(
  userId: string,
  messageId: string
): Promise<void> {
  const supabase = createSupabaseClientWithUser(userId);
  
  // First verify the message belongs to a session owned by the user
  const { data: messageData, error: messageError } = await supabase
    .from('messages')
    .select('session_id')
    .eq('id', messageId)
    .single();
    
  if (messageError || !messageData) {
    throw new Error(`Message not found: ${messageError?.message}`);
  }
  
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', messageData.session_id)
    .eq('user_id', userId)
    .single();
    
  if (sessionError || !sessionData) {
    throw new Error(`Unauthorized: ${sessionError?.message}`);
  }
  
  // Delete the message
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);
    
  if (error) throw error;
}
