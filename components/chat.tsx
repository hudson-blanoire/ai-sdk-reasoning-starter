"use client";

import cn from "classnames";
import { toast } from "sonner";
import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useRef } from "react";
import { Messages } from "./messages";
import { modelID, models } from "@/lib/models";
import { Footnote } from "./footnote";
import {
  ArrowUpIcon,
  CheckedSquare,
  ChevronDownIcon,
  ChevronUpIcon,
  StopIcon,
  UncheckedSquare,
} from "./icons";
import { Input } from "./input";
import { CHAT_ID } from "@/lib/constants";
import { SearchResults } from "./search-results";
import { SearchSection } from "./search-section";
import { SearchResultItem } from "@/lib/types";

export function Chat() {
  const [input, setInput] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<modelID>("sonnet-3.7");
  const [isReasoningEnabled, setIsReasoningEnabled] = useState<boolean>(false);
  const [isAgenticEnabled, setIsAgenticEnabled] = useState<boolean>(false);
  const [isPendingResponse, setIsPendingResponse] = useState<boolean>(false); // Track immediate submission state

  // Load model preference from localStorage if available
  useEffect(() => {
    const savedModel = localStorage.getItem("selectedModel");
    if (savedModel && models[savedModel as modelID]) {
      setSelectedModelId(savedModel as modelID);
    }
    
    const savedReasoning = localStorage.getItem("isReasoningEnabled");
    if (savedReasoning) {
      setIsReasoningEnabled(savedReasoning === "true");
    }
    
    const savedAgentic = localStorage.getItem("isAgenticEnabled");
    if (savedAgentic) {
      setIsAgenticEnabled(savedAgentic === "true");
    }
  }, []);

  // Save preferences to localStorage when changed
  useEffect(() => {
    localStorage.setItem("selectedModel", selectedModelId);
    localStorage.setItem("isReasoningEnabled", String(isReasoningEnabled));
    localStorage.setItem("isAgenticEnabled", String(isAgenticEnabled));
  }, [selectedModelId, isReasoningEnabled, isAgenticEnabled]);

  // Track related questions state
  const [showRelated, setShowRelated] = useState(false);
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([
    "What are the limitations of current AI models in simulating complex molecular interactions?",
    "How does AI-enhanced molecular computing improve personalized medicine for cancer treatment?",
    "What are the ethical considerations of using AI in molecular design and drug discovery?"
  ]);

  // Track open tool invocation state
  const [openToolId, setOpenToolId] = useState<string | null>(null);
  
  const { messages, append, status, stop, addToolResult } = useChat({
    id: CHAT_ID,
    body: {
      selectedModelId,
      isReasoningEnabled,
      isAgenticEnabled: true // Always enable agentic mode for search functionality
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error("An error occurred, please try again!");
    },
    onFinish: () => {
      console.log("Chat finished, checking for tool calls in messages");
      // Log the last message to check for tool calls
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.toolInvocations) {
        console.log("Tool invocations in last message:", lastMessage.toolInvocations);
        // Show related questions after a successful response
        setShowRelated(true);
      }
    },
    maxSteps: 5 // Increase max steps for handling tool calls
  });

  const isGeneratingResponse = ["streaming", "submitted"].includes(status) || isPendingResponse;

  // Handle mutual exclusivity between reasoning and agentic modes
  const handleReasoningToggle = () => {
    if (isReasoningEnabled) {
      setIsReasoningEnabled(false);
    } else {
      setIsReasoningEnabled(true);
      setIsAgenticEnabled(false);
    }
  };

  const handleAgenticToggle = () => {
    if (isAgenticEnabled) {
      setIsAgenticEnabled(false);
    } else {
      setIsAgenticEnabled(true);
      setIsReasoningEnabled(false);
    }
  };

  // Function to handle clicking a related question
  const handleRelatedQuestionClick = (question: string) => {
    append({
      role: "user",
      content: question,
      createdAt: new Date(),
    });
    setShowRelated(false); // Hide related questions after selection
  };

  return (
    <div
      className={cn(
        "px-4 md:px-0 pb-4 flex flex-col h-dvh items-center w-full max-w-3xl",
        {
          "justify-between pt-16 md:pt-24": messages.length > 0, /* Increased top padding when messages exist */
          "justify-center gap-4 pt-8": messages.length === 0,
        },
      )}
    >
      {messages.length > 0 ? (
        <>
          <Messages 
            messages={messages} 
            status={status} 
            openToolId={openToolId}
            setOpenToolId={setOpenToolId}
            isPendingResponse={isPendingResponse}
          />
          
          {/* Related Questions Component - similar to first screenshot */}
          {showRelated && messages.length > 0 && (
            <div className="w-full mb-4 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <span className="text-sm">↺</span>
                  </div>
                  <span className="font-medium">Related</span>
                </div>
                <button 
                  onClick={() => setShowRelated(!showRelated)}
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  <ChevronUpIcon />
                </button>
              </div>
              <div className="p-2">
                {relatedQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="flex items-center gap-2 w-full text-left p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    onClick={() => handleRelatedQuestionClick(question)}
                  >
                    <span className="text-blue-500">→</span>
                    <span>{question}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-0.5 sm:text-2xl text-xl w-full">
          <div className="flex flex-row gap-2 items-center">
            <div>Welcome to Atoma</div>
          </div>
          <div className="dark:text-zinc-500 text-zinc-400">
            How can I assist you today?
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 w-full">
        <div className="w-full relative p-3 dark:bg-zinc-800 rounded-2xl flex flex-col gap-1 bg-zinc-100">
          <Input
            input={input}
            setInput={setInput}
            selectedModelId={selectedModelId}
            isGeneratingResponse={isGeneratingResponse}
            isReasoningEnabled={isReasoningEnabled}
          />

          <div className="absolute bottom-2.5 left-2.5 flex gap-2">
            <button
              disabled={selectedModelId !== "sonnet-3.7"}
              className={cn(
                "relative w-fit text-sm p-1.5 rounded-lg flex flex-row items-center gap-2 dark:hover:bg-zinc-600 hover:bg-zinc-200 cursor-pointer disabled:opacity-50",
                {
                  "dark:bg-zinc-600 bg-zinc-200": isReasoningEnabled,
                },
              )}
              onClick={handleReasoningToggle}
            >
              {isReasoningEnabled ? <CheckedSquare /> : <UncheckedSquare />}
              <div>Reasoning</div>
            </button>
            
            <button
              className={cn(
                "relative w-fit text-sm p-1.5 rounded-lg flex flex-row items-center gap-2 dark:hover:bg-zinc-600 hover:bg-zinc-200 cursor-pointer",
                {
                  "dark:bg-zinc-600 bg-zinc-200": isAgenticEnabled,
                },
              )}
              onClick={handleAgenticToggle}
            >
              {isAgenticEnabled ? <CheckedSquare /> : <UncheckedSquare />}
              <div>Agentic</div>
            </button>
          </div>

          <div className="absolute bottom-2.5 right-2.5 flex flex-row gap-2">
            <div className="relative w-fit text-sm p-1.5 rounded-lg flex flex-row items-center gap-0.5 dark:hover:bg-zinc-700 hover:bg-zinc-200 cursor-pointer">
              <div className="flex justify-center items-center text-zinc-500 dark:text-zinc-400 px-1">
                <span className="pr-1">{models[selectedModelId]}</span>
                <ChevronDownIcon />
              </div>

              <select
                className="absolute opacity-0 w-full p-1 left-0 cursor-pointer"
                value={selectedModelId}
                onChange={(event) => {
                  const newModelId = event.target.value as modelID;
                  if (newModelId !== "sonnet-3.7") {
                    setIsReasoningEnabled(false);
                  }
                  setSelectedModelId(newModelId);
                }}
              >
                {Object.entries(models).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className={cn(
                "size-8 flex flex-row justify-center items-center dark:bg-zinc-100 bg-zinc-900 dark:text-zinc-900 text-zinc-100 p-1.5 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-300 hover:scale-105 active:scale-95 transition-all",
                {
                  "dark:bg-zinc-200 dark:text-zinc-500":
                    isGeneratingResponse || input === "",
                },
              )}
              onClick={() => {
                if (input === "") {
                  return;
                }

                if (isGeneratingResponse) {
                  stop();
                } else {
                  setIsPendingResponse(true); // Set pending state immediately
                  append({
                    role: "user",
                    content: input,
                    createdAt: new Date(),
                  }).then(() => {
                    setIsPendingResponse(false); // Clear pending state after response starts
                  });
                }

                setInput("");
              }}
            >
              {isGeneratingResponse ? <StopIcon /> : <ArrowUpIcon />}
            </button>
          </div>
        </div>

        <Footnote />
      </div>
    </div>
  );
}
