"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatBubble } from "@/components/ChatBubble";
import { usePathname } from "next/navigation";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // On publication/category detail pages the inner nav sits at top-0 on mobile,
  // so we remove the top padding to avoid a gap above it.
  const isDetailPage =
    (pathname.startsWith("/publicaciones/") &&
      pathname !== "/publicaciones/") ||
    pathname.startsWith("/categorias/");

  // Proximamente page renders without layout wrapper (full screen)
  if (pathname === "/proximamente") {
    return <>{children}</>;
  }

  // Don't show chat bubble on login page
  const isLoginPage = pathname === "/login";

  return (
    <div className="min-h-screen flex flex-col bg-background md:pt-16">
      <Navbar />
      <main
        className={`flex-1 w-full max-w-[1640px] mx-auto px-4 md:px-8 pb-4 md:pb-6 animate-in fade-in duration-500 ${
          isDetailPage ? "pt-0 md:py-2" : "py-2"
        }`}
      >
        {children}
      </main>
      {/* Mobile spacer: bottom nav height (4rem) + iOS safe area inset */}
      <div
        className="md:hidden shrink-0"
        style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }}
        aria-hidden="true"
      />
      <Footer />
      {!isLoginPage && <ChatBubble hideFloatingButton />}
    </div>
  );
}
