"use client";

import { cn } from "@/lib/utils";
import { File, X } from "lucide-react";
import { useState } from "react";

export interface FilePreviewProps {
  file: File;
  onRemove?: (file: File) => void;
  className?: string;
}

export function FilePreview({ file, onRemove, className }: FilePreviewProps) {
  const fileSize = file.size < 1024 * 1024
    ? `${(file.size / 1024).toFixed(1)} KB`
    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div 
      className={cn(
        "flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700",
        className
      )}
    >
      <div className="flex-shrink-0">
        <File className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{fileSize}</p>
      </div>
      {onRemove && (
        <button 
          type="button"
          className="flex-shrink-0 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full"
          onClick={() => onRemove(file)}
          aria-label="Remove file"
        >
          <X className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
        </button>
      )}
    </div>
  );
}

export interface FilePreviews {
  files: File[];
  onRemove?: (file: File) => void;
  className?: string;
}

export function FilePreviews({ files, onRemove, className }: FilePreviews) {
  if (files.length === 0) return null;
  
  return (
    <div className={cn("flex flex-col gap-2 p-2", className)}>
      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {files.length} {files.length === 1 ? 'file' : 'files'} selected
      </div>
      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <FilePreview 
            key={`${file.name}-${index}`} 
            file={file} 
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
