"use client";

import { Chat } from "@/components/chat";
import { markdownComponents } from "@/components/markdown-components";
import { SearchResults } from "@/components/search-results";
import { SearchSection } from "@/components/search-section";
// Sidebar will be implemented in Phase 5
// import { ChatSidebar } from "@/components/chat-sidebar";
import { useState } from "react";

export default function Home() {
  return (
    <div className="w-full h-[calc(100vh-64px)] overflow-hidden flex justify-center mt-16">
      <div className="w-full max-w-3xl px-4 overflow-auto">
        <Chat />
      </div>
    </div>
  );
}
