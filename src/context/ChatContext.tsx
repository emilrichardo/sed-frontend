"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface ChatContextType {
  isOpen: boolean;
  isEnabled: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  // Chatbot solo se muestra si NEXT_PUBLIC_CHATBOT=true
  const isEnabled = process.env.NEXT_PUBLIC_CHATBOT === "true";

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <ChatContext.Provider value={{ isOpen, isEnabled, openChat, closeChat, toggleChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
