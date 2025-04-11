import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getSessionMessages, addMessage, deleteMessage } from '@/lib/supabase/messages';

/**
 * GET: Retrieve all messages for a specific session
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get session ID from query params
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Get messages for the session
    const messages = await getSessionMessages(userId, sessionId);
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

/**
 * POST: Add a new message to a session
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const { sessionId, role, content, metadata } = await req.json();
    
    if (!sessionId || !role || !content) {
      return NextResponse.json({ 
        error: 'Session ID, role, and content are required' 
      }, { status: 400 });
    }
    
    // Validate role
    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json({ 
        error: 'Role must be one of: user, assistant, system' 
      }, { status: 400 });
    }
    
    // Add message
    const messageId = await addMessage(
      userId, 
      sessionId, 
      role as 'user' | 'assistant' | 'system', 
      content, 
      metadata
    );
    
    return NextResponse.json({ 
      success: true, 
      messageId, 
      message: 'Message added successfully' 
    });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}

/**
 * DELETE: Delete a message
 */
export async function DELETE(req: NextRequest) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get message ID from query params
    const url = new URL(req.url);
    const messageId = url.searchParams.get('id');
    
    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }
    
    // Delete the message
    await deleteMessage(userId, messageId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Message deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
