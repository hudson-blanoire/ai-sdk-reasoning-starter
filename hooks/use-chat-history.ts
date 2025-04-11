import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  createSession,
  getSession,
  getUserSessions,
  updateSession,
  deleteSession,
} from '@/lib/supabase/session';
import {
  addMessage,
  getSessionMessages,
  deleteMessage,
} from '@/lib/supabase/messages';
import { Session } from '@/lib/supabase/session';
import { Message as SupabaseMessage } from '@/lib/supabase/messages';
import { Message as AiMessage } from 'ai';

interface UseChatHistoryOptions {
  initialSessionId?: string;
  autoCreateSession?: boolean;
}

export function useChatHistory({
  initialSessionId,
  autoCreateSession = true,
}: UseChatHistoryOptions = {}) {
  const { user, isSignedIn } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialSessionId || null);
  const [messages, setMessages] = useState<SupabaseMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's sessions
  const loadSessions = useCallback(async () => {
    if (!isSignedIn || !user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const userSessions = await getUserSessions(user.id);
      setSessions(userSessions);

      // If there are no sessions but autoCreateSession is true, create one
      if (userSessions.length === 0 && autoCreateSession) {
        const defaultTitle = 'New Conversation';
        const newSessionId = await createSession(user.id, defaultTitle);
        
        // Load sessions again to include the new one
        const updatedSessions = await getUserSessions(user.id);
        setSessions(updatedSessions);
        
        // Set the new session as current
        setCurrentSessionId(newSessionId);
      } else if (userSessions.length > 0 && !currentSessionId) {
        // Default to the most recent session if none is selected
        setCurrentSessionId(userSessions[0].id);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load chat sessions');
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user?.id, autoCreateSession, currentSessionId]);

  // Load messages for the current session
  const loadMessages = useCallback(async () => {
    if (!isSignedIn || !user?.id || !currentSessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const sessionMessages = await getSessionMessages(user.id, currentSessionId);
      setMessages(sessionMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load chat messages');
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user?.id, currentSessionId]);

  // Create a new session
  const createNewSession = useCallback(async (title: string = 'New Conversation') => {
    if (!isSignedIn || !user?.id) {
      setError('You must be signed in to create a chat session');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newSessionId = await createSession(user.id, title);
      
      // Load sessions again to include the new one
      await loadSessions();
      
      // Set the new session as current
      setCurrentSessionId(newSessionId);
      
      // Clear messages since this is a new session
      setMessages([]);
      
      return newSessionId;
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Failed to create new chat session');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user?.id, loadSessions]);

  // Switch to a different session
  const switchSession = useCallback(async (sessionId: string) => {
    if (!isSignedIn || !user?.id) {
      setError('You must be signed in to switch chat sessions');
      return false;
    }

    if (sessionId === currentSessionId) return true;

    setCurrentSessionId(sessionId);
    return true;
  }, [isSignedIn, user?.id, currentSessionId]);

  // Update session title
  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    if (!isSignedIn || !user?.id) {
      setError('You must be signed in to update a chat session');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await updateSession(user.id, sessionId, { title });
      
      // Update sessions in state
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, title } 
            : session
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error updating session:', err);
      setError('Failed to update chat session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user?.id]);

  // Delete a session
  const removeSession = useCallback(async (sessionId: string) => {
    if (!isSignedIn || !user?.id) {
      setError('You must be signed in to delete a chat session');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await deleteSession(user.id, sessionId);
      
      // Remove from sessions list
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // If the deleted session was the current one, switch to another
      if (sessionId === currentSessionId) {
        const remainingSessions = sessions.filter(session => session.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete chat session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user?.id, currentSessionId, sessions]);

  // Add a message to the current session
  const addMessageToCurrentSession = useCallback(async (
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ) => {
    if (!isSignedIn || !user?.id || !currentSessionId) {
      setError('You must be signed in and have an active chat session');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const messageId = await addMessage(user.id, currentSessionId, role, content, metadata);
      
      // Add message to state
      const newMessage: SupabaseMessage = {
        id: messageId,
        sessionId: currentSessionId,
        role,
        content,
        createdAt: Date.now(),
        metadata
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      return messageId;
    } catch (err) {
      console.error('Error adding message:', err);
      setError('Failed to add message to chat');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user?.id, currentSessionId]);

  // Convert AI SDK messages to Supabase and save them
  const saveMessages = useCallback(async (aiMessages: AiMessage[]) => {
    if (!isSignedIn || !user?.id || !currentSessionId || aiMessages.length === 0) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Filter out messages that need to be saved (e.g., not already in the database)
      const messagesToSave = aiMessages.filter(msg => {
        // Skip messages without content
        if (!msg.content) return false;
        
        // Check if this message is already saved by comparing content
        return !messages.some(existingMsg => 
          existingMsg.role === msg.role && 
          existingMsg.content === msg.content
        );
      });

      // Save each message
      const savedMessageIds = [];
      for (const msg of messagesToSave) {
        const messageId = await addMessage(
          user.id, 
          currentSessionId, 
          msg.role as 'user' | 'assistant' | 'system', 
          msg.content || '',
          { aiSdkId: msg.id }
        );
        savedMessageIds.push(messageId);
      }

      // Reload messages to ensure sync
      await loadMessages();
      
      return true;
    } catch (err) {
      console.error('Error saving messages:', err);
      setError('Failed to save chat messages');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, user?.id, currentSessionId, messages, loadMessages]);

  // Convert Supabase messages to AI SDK format
  const getMessagesForAiSdk = useCallback((): AiMessage[] => {
    return messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: new Date(msg.createdAt)
    }));
  }, [messages]);

  // Load sessions on init and when user changes
  useEffect(() => {
    if (isSignedIn) {
      loadSessions();
    }
  }, [isSignedIn, loadSessions]);

  // Load messages when current session changes
  useEffect(() => {
    if (currentSessionId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [currentSessionId, loadMessages]);

  return {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    error,
    loadSessions,
    loadMessages,
    createNewSession,
    switchSession,
    updateSessionTitle,
    removeSession,
    addMessageToCurrentSession,
    saveMessages,
    getMessagesForAiSdk
  };
}
