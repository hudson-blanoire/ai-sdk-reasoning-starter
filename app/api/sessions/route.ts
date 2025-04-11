import { NextRequest, NextResponse } from 'next/server';
import { createClerkAuthenticatedSupabaseClient } from '@/lib/supabase/clerk-middleware';
import { getUserSessions, createSession, deleteSession } from '@/lib/supabase/session';
import { getAuth } from '@clerk/nextjs/server';

/**
 * GET: Retrieve all sessions for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get sessions for the user
    const sessions = await getUserSessions(userId);
    
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

/**
 * POST: Create a new session for the authenticated user
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const { title, metadata } = await req.json();
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Create new session
    const sessionId = await createSession(userId, title, metadata);
    
    return NextResponse.json({ 
      success: true, 
      sessionId, 
      message: 'Session created successfully' 
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

/**
 * DELETE: Delete a session
 */
export async function DELETE(req: NextRequest) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get session ID from query params
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('id');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Delete the session
    await deleteSession(userId, sessionId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Session deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
