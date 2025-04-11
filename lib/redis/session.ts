import { v4 as uuidv4 } from 'uuid';
import { getRedisClient } from './client';
import { Session, Message } from './schema';

/**
 * Creates a new chat session for a user
 */
export async function createSession(userId: string, title: string = 'New Conversation'): Promise<Session> {
  const client = await getRedisClient();
  
  // Generate unique session ID
  const sessionId = `session:${uuidv4()}`;
  const timestamp = Date.now();
  
  // Create session object
  const session: Session = {
    id: sessionId,
    userId,
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    messageIds: []
  };
  
  // Store in Redis
  await client.hSet(sessionId, session as any);
  
  return session;
}

/**
 * Retrieves a session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const client = await getRedisClient();
  
  // Get session data
  const sessionData = await client.hGetAll(sessionId);
  
  if (!sessionData || Object.keys(sessionData).length === 0) {
    return null;
  }
  
  // Parse messageIds from string to array if it exists
  if (sessionData.messageIds && typeof sessionData.messageIds === 'string') {
    try {
      sessionData.messageIds = JSON.parse(sessionData.messageIds);
    } catch (error) {
      sessionData.messageIds = [];
    }
  }
  
  return {
    ...sessionData,
    createdAt: parseInt(sessionData.createdAt),
    updatedAt: parseInt(sessionData.updatedAt),
  } as Session;
}

/**
 * Get all sessions for a specific user
 */
export async function getUserSessions(userId: string): Promise<Session[]> {
  const client = await getRedisClient();
  
  // Query using the index
  const results = await client.ft.search(
    'idx:sessions',
    `@userId:{${userId}}`,
    {
      SORTBY: {
        BY: 'updatedAt',
        DIRECTION: 'DESC'
      }
    }
  );
  
  if (!results.documents || results.documents.length === 0) {
    return [];
  }
  
  // Process results
  return results.documents.map((doc: any) => {
    const sessionData = doc.value;
    
    // Parse messageIds from string to array if it exists
    if (sessionData.messageIds && typeof sessionData.messageIds === 'string') {
      try {
        sessionData.messageIds = JSON.parse(sessionData.messageIds);
      } catch (error) {
        sessionData.messageIds = [];
      }
    }
    
    return {
      ...sessionData,
      id: doc.id,
      createdAt: parseInt(sessionData.createdAt),
      updatedAt: parseInt(sessionData.updatedAt),
    } as Session;
  });
}

/**
 * Update session data
 */
export async function updateSession(sessionId: string, updates: Partial<Session>): Promise<Session | null> {
  const client = await getRedisClient();
  
  // First, get the existing session
  const session = await getSession(sessionId);
  if (!session) {
    return null;
  }
  
  // Prepare updates
  const updatedSession = {
    ...session,
    ...updates,
    updatedAt: Date.now(),
    // Ensure messageIds is stored as a string
    messageIds: updates.messageIds || session.messageIds
  };
  
  // Convert messageIds to string for storage if it's an array
  const sessionToStore = {
    ...updatedSession,
    messageIds: Array.isArray(updatedSession.messageIds) 
      ? JSON.stringify(updatedSession.messageIds) 
      : updatedSession.messageIds
  };
  
  // Update in Redis
  await client.hSet(sessionId, sessionToStore as any);
  
  return updatedSession;
}

/**
 * Delete a session and its associated messages
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const client = await getRedisClient();
  
  // Get the session to find associated messages
  const session = await getSession(sessionId);
  if (!session) {
    return false;
  }
  
  // Delete all messages associated with the session
  if (session.messageIds && session.messageIds.length > 0) {
    const pipeline = client.multi();
    
    for (const messageId of session.messageIds) {
      pipeline.del(messageId);
    }
    
    await pipeline.exec();
  }
  
  // Delete the session
  await client.del(sessionId);
  
  return true;
}

/**
 * Add a message to a session
 */
export async function addMessage(
  sessionId: string, 
  role: 'user' | 'assistant' | 'system', 
  content: string
): Promise<Message> {
  const client = await getRedisClient();
  
  // First, ensure the session exists
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  // Create the message
  const messageId = `message:${uuidv4()}`;
  const timestamp = Date.now();
  
  const message: Message = {
    id: messageId,
    sessionId,
    role,
    content,
    createdAt: timestamp
  };
  
  // Store the message
  await client.hSet(messageId, message as any);
  
  // Update the session with the new message ID
  const messageIds = [...(session.messageIds || []), messageId];
  await updateSession(sessionId, { 
    messageIds,
    updatedAt: timestamp
  });
  
  return message;
}

/**
 * Get all messages for a session
 */
export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  const client = await getRedisClient();
  
  // Get the session
  const session = await getSession(sessionId);
  if (!session || !session.messageIds || session.messageIds.length === 0) {
    return [];
  }
  
  // Retrieve all messages
  const messages: Message[] = [];
  const pipeline = client.multi();
  
  for (const messageId of session.messageIds) {
    pipeline.hGetAll(messageId);
  }
  
  const results = await pipeline.exec();
  
  // Process results
  for (let i = 0; i < results.length; i++) {
    const messageData = results[i];
    if (messageData && Object.keys(messageData).length > 0) {
      messages.push({
        ...messageData,
        createdAt: parseInt(messageData.createdAt),
      } as Message);
    }
  }
  
  // Sort by creation time
  return messages.sort((a, b) => a.createdAt - b.createdAt);
}
