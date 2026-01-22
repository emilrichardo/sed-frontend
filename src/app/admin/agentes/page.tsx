"use client";

import { Bot } from "lucide-react";

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-neutral-900 tracking-tight">
            Agentes de IA
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-neutral-500">
          Sección en construcción o deshabilitada.
        </p>
      </main>
    </div>
  );
}
