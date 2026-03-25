"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  FormEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import {
  Send,
  StopCircle,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  X,
} from "lucide-react";
import { Isotipo } from "@/components/brand/Isotipo";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "¿Qué publicaciones hay disponibles?",
  "¿Cuáles son las categorías temáticas?",
  "¿Cómo accedo al Boletín Oficial?",
  "¿Dónde encuentro datos de coparticipación?",
];

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-primary border border-border"
        }`}
      >
        {isUser ? (
          <User className="w-3 h-3" />
        ) : (
          <Bot className="w-3 h-3" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm border border-border"
        }`}
      >
        {message.loading ? (
          <TypingDots />
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-xs dark:prose-invert max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-li:my-0 prose-headings:my-1">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                    target={href?.startsWith("http") ? "_blank" : undefined}
                    rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function WelcomeScreen({
  onSuggest,
}: {
  onSuggest: (q: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-3 py-6 text-center">
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      <h2 className="text-base font-heading font-bold tracking-tight mb-1">
        Chat SED
      </h2>
      <p className="text-muted-foreground text-[11px] max-w-[200px] mb-4 leading-relaxed">
        Soy el asistente de <strong>Santiago en Datos</strong>. Te ayudo a encontrar publicaciones, boletines y más.
      </p>

      <div className="grid grid-cols-1 gap-1.5 w-full">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSuggest(q)}
            className="text-left px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted hover:border-primary/30 transition-all text-[11px] text-muted-foreground hover:text-foreground"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
      setHasNewMessages(false);
    }
  }, [messages, isOpen, scrollToBottom]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        chatContainerRef.current &&
        !chatContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };

      const loadingMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        loading: true,
      };

      setMessages((prev) => [...prev, userMsg, loadingMsg]);
      setInput("");
      setIsStreaming(true);

      // Build history for API (exclude loading placeholder)
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Error ${res.status}`);
        }

        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        // Replace loading placeholder with empty streaming message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsg.id ? { ...m, loading: false, content: "" } : m,
          ),
        );

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              const delta: string =
                parsed?.choices?.[0]?.delta?.content ?? "";
              if (delta) {
                accumulated += delta;
                const snap = accumulated;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === loadingMsg.id ? { ...m, content: snap } : m,
                  ),
                );
              }
            } catch {
              // ignore malformed SSE chunks
            }
          }
        }

        // Show notification if chat is closed
        if (!isOpen) {
          setHasNewMessages(true);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const msg =
          err instanceof Error ? err.message : "Error al conectar con el servidor";
        setError(msg);
        setMessages((prev) => prev.filter((m) => m.id !== loadingMsg.id));
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        inputRef.current?.focus();
      }
    },
    [isStreaming, messages, isOpen],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleReset = () => {
    if (isStreaming) abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setError(null);
    setIsStreaming(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          className="mb-3 w-[320px] sm:w-[380px] h-[480px] bg-background/95 backdrop-blur-md rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0 bg-background">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <h1 className="text-xs font-semibold leading-none">Chat SED</h1>
                <p className="text-[9px] text-muted-foreground leading-none mt-0.5">
                  Asistente virtual
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
                  title="Nueva conversación"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {messages.length === 0 ? (
              <WelcomeScreen onSuggest={(q) => sendMessage(q)} />
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {error && (
                  <div className="text-[11px] text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 px-3 pb-3 pt-2 border-t border-border bg-background">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Escribí tu pregunta..."
                rows={1}
                disabled={isStreaming}
                className="w-full resize-none rounded-xl border border-border bg-muted/50 px-3 py-2.5 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 placeholder:text-muted-foreground leading-relaxed"
                style={{ maxHeight: "100px", overflowY: "auto" }}
              />
              <div className="absolute right-1.5 bottom-1.5">
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                    title="Detener"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Enviar"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>
            <p className="text-[9px] text-muted-foreground text-center mt-1.5">
              Solo respondo sobre contenido de Santiago en Datos
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setHasNewMessages(false);
        }}
        className="group relative w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="text-white">
            <Isotipo size={28} className="text-white" />
          </div>
        )}
        
        {/* Notification dot */}
        {hasNewMessages && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 border-background flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
          </span>
        )}
        
        {/* Tooltip */}
        {!isOpen && (
          <span className="absolute right-full mr-3 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Chat SED
          </span>
        )}
      </button>
    </div>
  );
}
