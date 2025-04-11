'use client';

import { useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Upload, File, X, Loader2 } from 'lucide-react';

/**
 * File upload component that handles document uploads for RAG processing
 */
export function FileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const data = await response.json();
      setUploadedFiles(prev => [...prev, ...data.filenames]);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (filename: string) => {
    setUploadedFiles(prev => prev.filter(file => file !== filename));
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Only allow authenticated users to upload files
  if (!user) {
    return (
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Sign in to upload documents for RAG processing.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
        onClick={handleUploadClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept=".pdf,.txt,.md,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.svg"
        />
        
        <div className="flex flex-col items-center justify-center">
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {isUploading ? (
              <span className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading files...
              </span>
            ) : (
              'Click to upload or drag and drop'
            )}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            PDF, TXT, MD, DOC, DOCX, JPG, PNG, GIF, WEBP, SVG (Max 10MB per file)
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-500 dark:text-red-400">
          {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Uploaded Documents
          </h3>
          <ul className="space-y-2">
            {uploadedFiles.map((filename, index) => (
              <li 
                key={index} 
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-2 rounded-md text-sm"
              >
                <div className="flex items-center">
                  <File className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-xs">
                    {filename}
                  </span>
                </div>
                <button 
                  onClick={() => removeFile(filename)}
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
