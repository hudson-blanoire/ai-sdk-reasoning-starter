import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { addDocument, getUserDocuments, deleteDocument, searchDocuments } from '@/lib/chroma/documents';

/**
 * GET: Search or retrieve documents
 * Query params:
 * - query: Search term (optional)
 * - limit: Maximum number of results (optional)
 * If no query is provided, returns all documents for the user
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query params
    const url = new URL(req.url);
    const query = url.searchParams.get('query');
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    
    let documents;
    
    // If query is provided, search documents
    if (query) {
      documents = await searchDocuments(userId, query, limit);
    } else {
      // Otherwise, get all documents for the user
      documents = await getUserDocuments(userId);
    }
    
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error retrieving documents:', error);
    return NextResponse.json({ error: 'Failed to retrieve documents' }, { status: 500 });
  }
}

/**
 * POST: Add a new document
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const { title, content, url, metadata } = await req.json();
    
    if (!title || !content) {
      return NextResponse.json({ 
        error: 'Title and content are required' 
      }, { status: 400 });
    }
    
    // Add document
    const documentId = await addDocument(userId, {
      title,
      content,
      url,
      userId,
      metadata
    });
    
    return NextResponse.json({ 
      success: true, 
      documentId, 
      message: 'Document added successfully' 
    });
  } catch (error) {
    console.error('Error adding document:', error);
    return NextResponse.json({ error: 'Failed to add document' }, { status: 500 });
  }
}

/**
 * DELETE: Delete a document
 */
export async function DELETE(req: NextRequest) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get document ID from query params
    const url = new URL(req.url);
    const documentId = url.searchParams.get('id');
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    
    // Delete the document
    await deleteDocument(userId, documentId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Document deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
