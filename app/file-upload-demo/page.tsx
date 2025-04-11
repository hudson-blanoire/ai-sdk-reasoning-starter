"use client";

import { useState } from "react";
import { ChatFileUpload } from "@/components/ui/chat-file-upload";
import { FileUpload } from "@/components/ui/file-upload";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  attachmentIds?: string[];
  timestamp: Date;
}

export default function FileUploadDemo() {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleFilesUploaded = (data: any) => {
    toast.success(`${data.filenames?.length || 0} file(s) uploaded successfully`);
  };

  const handleMessageSent = (messageContent: string, attachmentIds?: string[]) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      content: messageContent,
      attachmentIds,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    toast.success("Message sent with attachments");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">File Upload Components</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-4">Standard File Upload</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            This component allows users to upload multiple files with a dedicated button.
          </p>
          
          <FileUpload 
            onFilesUploaded={handleFilesUploaded}
            onUploadError={(error) => toast.error(error.message)}
          />
        </section>

        <section className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-4">Chat with File Attachment</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            This component integrates file uploads directly into the chat interface.
          </p>
          
          <div className="space-y-4">
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 max-h-60 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">
                  No messages yet. Try sending one below.
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p>{message.content}</p>
                      {message.attachmentIds && message.attachmentIds.length > 0 && (
                        <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                          Attachments: {message.attachmentIds.length}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <ChatFileUpload 
              onFilesUploaded={handleFilesUploaded}
              onMessageSent={handleMessageSent}
            />
          </div>
        </section>
      </div>
      
      <section className="mt-8 bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-semibold mb-4">Implementation Notes</h2>
        
        <div className="prose dark:prose-invert max-w-none">
          <h3>Features</h3>
          <ul>
            <li><strong>File previews</strong> - Shows file name and size before uploading</li>
            <li><strong>Multiple file support</strong> - Upload multiple files at once</li>
            <li><strong>Size validation</strong> - Enforces maximum file size (10MB by default)</li>
            <li><strong>Type filtering</strong> - Restricts to document file types</li>
            <li><strong>Error handling</strong> - Displays toast notifications for errors</li>
            <li><strong>Loading indicators</strong> - Shows upload progress state</li>
          </ul>
          
          <h3>Integration with Chat</h3>
          <p>
            The chat file upload component is designed to be dropped into existing chat interfaces.
            It handles both standalone messages and messages with file attachments. When files are
            uploaded, document IDs are returned and can be associated with the message for retrieval.
          </p>
          
          <h3>Usage</h3>
          <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded overflow-x-auto">
            {`<ChatFileUpload
  onFilesUploaded={(data) => {
    // Handle uploaded files data
    console.log(data.documentIds);
  }}
  onMessageSent={(message, attachmentIds) => {
    // Handle the sent message with any attachments
    sendMessageToBackend(message, attachmentIds);
  }}
/>`}
          </pre>
        </div>
      </section>
    </div>
  );
}
