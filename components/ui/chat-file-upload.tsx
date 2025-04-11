"use client";

import { cn } from "@/lib/utils";
import { File, FileUp, Loader2, Paperclip, X } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { FilePreviews } from "./file-preview";
import { toast } from "sonner";

export interface ChatFileUploadProps {
  onFilesUploaded?: (data: any) => void;
  onMessageSent?: (message: string, attachmentIds?: string[]) => void;
  className?: string;
  disabled?: boolean;
}

export function ChatFileUpload({
  onFilesUploaded,
  onMessageSent,
  className,
  disabled = false,
}: ChatFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxFiles = 5;
  const maxSizeMB = 10;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const acceptedFileTypes = ".pdf,.txt,.md,.doc,.docx";

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const fileList = Array.from(e.target.files);
    const validFiles = fileList.filter(file => file.size <= maxSizeBytes);
    
    if (validFiles.length < fileList.length) {
      const oversizedFiles = fileList.filter(file => file.size > maxSizeBytes);
      toast.error(`Files exceeding ${maxSizeMB}MB limit: ${oversizedFiles.map(f => f.name).join(", ")}`);
    }
    
    // Limit to max number of files
    const filesToAdd = validFiles.slice(0, maxFiles - selectedFiles.length);
    
    setSelectedFiles(prev => [...prev, ...filesToAdd]);
    
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedFiles, maxSizeBytes, maxSizeMB, maxFiles]);

  const handleRemoveFile = useCallback((fileToRemove: File) => {
    setSelectedFiles(prev => prev.filter(file => file !== fileToRemove));
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (selectedFiles.length === 0 && message.trim() === "") return;
    
    // Upload files first if there are any
    if (selectedFiles.length > 0) {
      setIsUploading(true);
      const formData = new FormData();
      
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      try {
        const response = await fetch('/api/upload', {
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
        
        // Generate appropriate message based on file type and count
        let defaultMessage = "";
        if (selectedFiles.length === 1) {
          const file = selectedFiles[0];
          const fileType = file.name.split('.').pop()?.toLowerCase() || 'file';
          const fileTypeMap: Record<string, string> = {
            pdf: 'PDF document',
            doc: 'Word document',
            docx: 'Word document',
            txt: 'text file',
            md: 'Markdown file',
            jpg: 'image',
            jpeg: 'image',
            png: 'image',
            gif: 'image',
            webp: 'image',
            svg: 'image'
          };
          const fileDescription = fileTypeMap[fileType] || 'file';
          defaultMessage = `I've uploaded ${file.name}. What would you like to know about this ${fileDescription}?`;
        } else {
          defaultMessage = `I've uploaded ${selectedFiles.length} files. What would you like to know about these files?`;
        }
        
        // Send message with attachments
        if (onMessageSent) {
          onMessageSent(
            message.trim() || defaultMessage,
            data.documentIds
          );
        }
        
        // Clear files and message after successful upload
        setSelectedFiles([]);
        setMessage("");
        
      } catch (error) {
        console.error('Error uploading files:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to upload files');
      } finally {
        setIsUploading(false);
      }
    } else if (message.trim() !== "") {
      // Just send the message without attachments
      if (onMessageSent) {
        onMessageSent(message, []);
      }
      setMessage("");
    }
  }, [selectedFiles, message, onFilesUploaded, onMessageSent]);

  return (
    <div className={cn("flex flex-col w-full", className)}>
      {/* File previews area */}
      {selectedFiles.length > 0 && (
        <div className="mb-2">
          <FilePreviews files={selectedFiles} onRemove={handleRemoveFile} />
        </div>
      )}
      
      {/* Input area */}
      <div className="flex items-center w-full rounded-xl border bg-background p-2">
        {/* File attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading || selectedFiles.length >= maxFiles}
          className={cn(
            "flex items-center justify-center p-2 rounded-md",
            "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
            "hover:bg-zinc-100 dark:hover:bg-zinc-800",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          title="Attach files"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          multiple
          accept={acceptedFileTypes}
          disabled={disabled || isUploading || selectedFiles.length >= maxFiles}
        />
        
        {/* Message input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={selectedFiles.length > 0 ? "Add a message (optional)" : "Type a message..."}
          disabled={disabled || isUploading}
          className="flex-1 px-3 py-2 bg-transparent border-none focus:outline-none"
        />
        
        {/* Send button */}
        <button
          type="button"
          onClick={handleSendMessage}
          disabled={disabled || isUploading || (selectedFiles.length === 0 && message.trim() === "")}
          className={cn(
            "flex items-center justify-center p-2 rounded-md",
            "bg-blue-500 text-white",
            "hover:bg-blue-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-5 h-5"
            >
              <path d="M22 2L11 13"></path>
              <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
