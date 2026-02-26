"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { layoutMode, user } = useAuth();

  // If no user, we might be on login page, or just showing public content.
  // The RootLayout in RootLayout.tsx has ProtectedRoute, so user is likely present or being checked.

  if (layoutMode === "web") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 w-full min-w-0 animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
}
