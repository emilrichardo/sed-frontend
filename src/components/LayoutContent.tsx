"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 pb-20 md:pb-6 animate-in fade-in duration-500">
        {children}
      </main>
      <Footer />
    </div>
  );
}
