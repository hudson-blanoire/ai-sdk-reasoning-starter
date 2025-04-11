import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { deleteDocument } from '@/lib/chroma/documents';

/**
 * DELETE: Delete a specific document by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const documentId = params.id;
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    
    // Delete the document
    await deleteDocument(userId, documentId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Document deleted successfully',
      documentId
    });
  } catch (error) {
    console.error(`Error deleting document ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
