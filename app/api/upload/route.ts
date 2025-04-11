import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@clerk/nextjs/server';
import { addDocument } from '@/lib/chroma/documents';

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  // Document types
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Image types
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

// Allowed file extensions (based on filename)
const ALLOWED_EXTENSIONS = [
  // Document extensions
  '.pdf', '.txt', '.md', '.doc', '.docx',
  // Image extensions
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'
];

/**
 * Process text-based and image files for vector storage
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    const userId = session?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Create directory for uploads if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', userId);
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const savedFilenames: string[] = [];
    const documentIds: string[] = [];

    // Process each file
    for (const file of files) {
      if (!(file instanceof File)) {
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` },
          { status: 400 }
        );
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        // If MIME type validation fails, check extension as fallback
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
          return NextResponse.json(
            { error: 'Invalid file type. Only PDF, TXT, MD, DOC, and DOCX files are allowed.' },
            { status: 400 }
          );
        }
      }

      // Generate a unique filename to prevent collisions
      const uniqueId = uuidv4();
      const fileName = `${uniqueId}-${file.name}`;
      const filePath = join(uploadDir, fileName);

      // Convert file to text content based on type
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      
      // Save the file
      await writeFile(filePath, fileBuffer);
      savedFilenames.push(fileName);

      // Process the file for RAG
      try {
        // Extract content from the file (simplified implementation)
        // For production, use proper document parsers based on file type
        let fileContent = '';
        
        // Determine file type category
        const isImageFile = file.type.startsWith('image/');
        
        if (isImageFile) {
          // For image files, we can't extract text directly
          // In production, you would use image recognition/OCR services
          // For now, just store metadata about the image
          fileContent = `[Image file] ${file.name}\n` +
                        `Type: ${file.type}\n` +
                        `Size: ${Math.round(file.size / 1024)} KB\n` +
                        `Uploaded: ${new Date().toISOString()}\n` +
                        `This is an image file that requires visual processing.`;
        } else if (file.type === 'application/pdf') {
          // Basic extraction for demo purposes
          // In production, use a PDF parsing library
          fileContent = `Content extracted from PDF: ${file.name}`;
        } else {
          // For text-based files, decode the buffer to string
          fileContent = fileBuffer.toString('utf-8');
        }

        // Store document with vector embedding in ChromaDB
        const docId = await addDocument(userId, {
          title: file.name,
          content: fileContent,
          userId: userId,
          metadata: {
            filename: fileName,
            fileType: file.type,
            uploadDate: new Date().toISOString(),
            fileSize: file.size
          }
        });
        
        documentIds.push(docId);
      } catch (error) {
        console.error(`Error processing file ${fileName} for RAG:`, error);
        // Continue with next file even if processing fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      filenames: savedFilenames,
      documentIds
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    );
  }
}
