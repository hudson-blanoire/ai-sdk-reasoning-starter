"use client";

import { cn } from "@/lib/utils";
import { FileUp, Loader2, UploadCloud } from "lucide-react";
import { useState, useRef, ChangeEvent } from "react";
import { FilePreviews } from "./file-preview";

export interface FileUploadProps {
  onFilesSelected?: (files: File[]) => void;
  onFilesUploaded?: (data: any) => void;
  onUploadError?: (error: Error) => void;
  uploadUrl?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedFileTypes?: string;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFilesSelected,
  onFilesUploaded,
  onUploadError,
  uploadUrl = "/api/upload",
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedFileTypes = ".pdf,.txt,.md,.doc,.docx",
  buttonText = "Upload Documents",
  className,
  disabled = false,
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const fileList = Array.from(e.target.files);
    const validFiles = fileList.filter(file => file.size <= maxSizeBytes);
    
    if (validFiles.length < fileList.length) {
      const oversizedFiles = fileList.filter(file => file.size > maxSizeBytes);
      console.error(`Files exceeding ${maxSizeMB}MB size limit:`, oversizedFiles.map(f => f.name).join(", "));
      // You could add a toast notification here
    }
    
    // Limit to max number of files
    const filesToAdd = validFiles.slice(0, maxFiles - selectedFiles.length);
    
    setSelectedFiles(prev => [...prev, ...filesToAdd]);
    
    if (onFilesSelected) {
      onFilesSelected([...selectedFiles, ...filesToAdd]);
    }
    
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setSelectedFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    const formData = new FormData();
    
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      
      if (onFilesUploaded) {
        onFilesUploaded(data);
      }
      
      // Clear files after successful upload
      setSelectedFiles([]);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            multiple
            accept={acceptedFileTypes}
            disabled={disabled || isUploading || selectedFiles.length >= maxFiles}
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading || selectedFiles.length >= maxFiles}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md",
              "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100",
              "hover:bg-zinc-200 dark:hover:bg-zinc-700",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <FileUp className="w-4 h-4" />
            {buttonText}
          </button>
        </div>
        
        {selectedFiles.length > 0 && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || disabled}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md",
              "bg-blue-500 text-white",
              "hover:bg-blue-600",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        )}
      </div>

      <FilePreviews files={selectedFiles} onRemove={handleRemoveFile} />
      
      {selectedFiles.length >= maxFiles && (
        <p className="text-xs text-amber-500 dark:text-amber-400">
          Maximum file limit reached ({maxFiles} files)
        </p>
      )}
    </div>
  );
}
