import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { searchDocuments } from '@/lib/chroma/documents';

/**
 * POST: Perform semantic search on user documents
 * Accepts a request body with:
 * - query: Search query text
 * - limit: Maximum number of results (optional)
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const { query, limit = 5 } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ 
        error: 'A valid search query is required' 
      }, { status: 400 });
    }
    
    // Search documents with semantic similarity
    const results = await searchDocuments(userId, query, limit);
    
    return NextResponse.json({ 
      success: true, 
      results,
      count: results.length
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    return NextResponse.json({ error: 'Failed to search documents' }, { status: 500 });
  }
}
