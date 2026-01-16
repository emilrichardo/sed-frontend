import React, { useState, useRef, useEffect } from "react";
// Trigger rebuild
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface BulletinEntryChatProps {
  entryContent: string;
  entryTitle: string;
}

export function BulletinEntryChat({
  entryContent,
  entryTitle,
}: BulletinEntryChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [envModel, setEnvModel] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ai/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.model) {
          setEnvModel(data.model);
        }
      })
      .catch((err) => console.error("Failed to fetch AI config:", err));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Construct the conversation history for the API
      // We include a system message with the entry content context
      const apiMessages = [
        {
          role: "system",
          content: `You are a helpful assistant analyzing a specific entry from an official bulletin.

          ENTRY TITLE: ${entryTitle}

          ENTRY CONTENT:
          ${entryContent}

          Answer the user's questions based ONLY on the content provided above. If the answer is not in the text, state that you cannot find the information in this entry. Be concise and professional.`,
        },
        ...messages.filter((m) => m.role !== "system"), // Filter out any previous system messages if we were persisting them, but here we reconstruct
        userMessage,
      ];

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: envModel || "llama3.1:8b",
          messages: apiMessages,
          stream: false,
          generationConfig: {
            response_mime_type: "application/json",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from Ollama");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling Ollama API:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Lo siento, hubo un error al procesar tu solicitud. Por favor intenta de nuevo.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px] border rounded-lg bg-background shadow-sm">
      <div className="p-3 border-b bg-muted/30 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-medium">Asistente IA - {entryTitle}</h3>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>
                Hola, soy tu asistente virtual. ¿Qué te gustaría saber sobre
                esta entrada?
              </p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3 text-sm",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg px-3 py-2 max-w-[80%]",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="bg-muted rounded-lg px-3 py-2 flex items-center">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-muted/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
