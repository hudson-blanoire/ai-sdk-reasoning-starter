"use client";

import Markdown from "react-markdown";
import { markdownComponents } from "./markdown-components";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, SpinnerIcon } from "./icons";
import { Message, ToolInvocation, useChat } from '@ai-sdk/react'
import rehypeRaw from 'rehype-raw'
import { SearchSection } from './search-section'
import { CHAT_ID } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { convertExaResultsToSearchResults } from '@/lib/types'
import { MessageLoading } from './ui/message-loading'

interface ReasoningPart {
  type: "reasoning";
  reasoning: string;
  details: Array<{ type: "text"; text: string }>;
}

interface ReasoningMessagePartProps {
  part: ReasoningPart;
  isReasoning: boolean;
}

export function ReasoningMessagePart({
  part,
  isReasoning,
}: ReasoningMessagePartProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: "auto",
      opacity: 1,
      marginTop: "1rem",
      marginBottom: 0,
    },
  };

  useEffect(() => {
    if (!isReasoning) {
      setIsExpanded(false);
    }
  }, [isReasoning]);

  return (
    <div className="flex flex-col">
      {isReasoning ? (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Reasoning</div>
          <div className="animate-spin">
            <SpinnerIcon />
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Reasoned for a few seconds</div>
          <button
            className={cn(
              "cursor-pointer rounded-full dark:hover:bg-zinc-800 hover:bg-zinc-200",
              {
                "dark:bg-zinc-800 bg-zinc-200": isExpanded,
              },
            )}
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="reasoning"
            className="text-sm dark:text-zinc-400 text-zinc-600 flex flex-col gap-4 border-l pl-3 dark:border-zinc-800"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {part.details.map((detail, detailIndex) =>
              detail.type === "text" ? (
                <Markdown key={detailIndex} components={markdownComponents}>
                  {detail.text}
                </Markdown>
              ) : (
                "<redacted>"
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TextMessagePartProps {
  text: string;
}

export function TextMessagePart({ text }: TextMessagePartProps) {
  return (
    <div className="flex flex-col gap-4">
      <Markdown components={markdownComponents}>{text}</Markdown>
    </div>
  );
}

export interface MessagesProps {
  messages: Message[]
  status: ReturnType<typeof useChat>['status']
  openToolId?: string | null
  setOpenToolId?: (id: string | null) => void
  isPendingResponse?: boolean
}

export function Messages({ 
  messages, 
  status, 
  openToolId = null, 
  setOpenToolId = () => {}, 
  isPendingResponse = false 
}: MessagesProps) {
  const messagesRef = useRef<HTMLDivElement>(null)
  const messagesLength = useMemo(() => messages.length, [messages])
  const isGeneratingResponse = ["streaming", "submitted"].includes(status);
  const [localOpenToolId, setLocalOpenToolId] = useState<string | null>(null);

  // Use either the prop or local state for tracking open tool
  const effectiveOpenToolId = openToolId !== null ? openToolId : localOpenToolId;
  const handleOpenToolChange = (id: string | null) => {
    setOpenToolId(id);
    setLocalOpenToolId(id);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messagesLength])

  return (
    <div className="flex flex-col overflow-y-auto w-full mb-4 flex-grow overflow-x-hidden" ref={messagesRef}>
      {messages.map((message, index) => {
        // Handle user messages
        if (message.role === 'user') {
          return (
            <div
              key={`${message.role}-${index}`}
              className="flex flex-col items-end mb-8"
            >
              <div className="rounded-xl dark:bg-zinc-800 bg-zinc-100 py-2 px-4 w-fit max-w-full sm:max-w-[85%] md:max-w-[75%] whitespace-pre-wrap break-words">
                <p>{message.content}</p>
              </div>
            </div>
          )
        }

        // Handle assistant messages
        return (
          <div key={`${message.role}-${index}`} className="mb-8">
            {message.content && (
              <div className="flex flex-col items-start mb-6">
                <div className="rounded-xl py-2 px-4 w-fit max-w-full sm:max-w-[85%] md:max-w-[75%] dark:bg-zinc-800 bg-zinc-100 break-words">
                  <Markdown 
                    components={markdownComponents}
                    rehypePlugins={[rehypeRaw]}
                    className="prose dark:prose-invert prose-zinc prose-sm sm:prose-base max-w-none leading-relaxed"
                  >
                    {typeof message.content === 'string' ? message.content : ''}
                  </Markdown>
                </div>
              </div>
            )}
            
            {/* Handle legacy tool invocations using the toolInvocations property */}
            {message.toolInvocations?.map((tool, toolIndex) => {
              if (tool.toolName === 'exaSearch') {
                return (
                  <SearchSection
                    key={`legacy-tool-${toolIndex}`}
                    tool={tool}
                    isOpen={effectiveOpenToolId === tool.id}
                    onOpenChange={(open) => handleOpenToolChange(open ? tool.id : null)}
                  />
                )
              }
              return null
            })}
          </div>
        )
      })}
      
      {/* Show message loading indicator when the AI is responding */}
      {isGeneratingResponse && (
        <div className="flex flex-col items-start mb-8">
          <div className="rounded-xl py-3 px-4 w-fit max-w-full dark:bg-zinc-800 bg-zinc-100 break-words flex items-center gap-2">
            <MessageLoading />
            <span className="text-sm text-zinc-500">Thinking...</span>
          </div>
        </div>
      )}
    </div>
  )
}
