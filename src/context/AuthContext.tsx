"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginModal } from "@/components/LoginModal";

interface User {
  id: string;
  email: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
  isEditing: boolean;
  toggleEditMode: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (isOpen: boolean) => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  layoutMode: "dashboard" | "web";
  setLayoutMode: (mode: "dashboard" | "web") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [layoutMode, setLayoutModeState] = useState<"dashboard" | "web">("web");
  const router = useRouter();

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // Listen for unauthorized events from apiFetch
  // Only react if the user had an active session (real expiry), not for anonymous 401s
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser((currentUser) => {
        if (!currentUser) return currentUser; // No active session, ignore
        console.warn("Unauthorized event received. Clearing session.");
        setIsEditing(false);
        setIsLoginModalOpen(true);
        fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        return null;
      });
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    // Validate session via BFF (reads HttpOnly cookie server-side)
    const validateSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            setIsEditing(true);
          }
        }
        // 404 = static export (no server), silently skip
      } catch {
        // network error, silently skip
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();

    // Layout mode stored in localStorage (not sensitive)
    const storedLayout = localStorage.getItem("layout-mode") as "dashboard" | "web";
    if (storedLayout === "dashboard" || storedLayout === "web") {
      setLayoutModeState(storedLayout);
    }
  }, []);

  const setLayoutMode = (mode: "dashboard" | "web") => {
    localStorage.setItem("layout-mode", mode);
    setLayoutModeState(mode);
  };

  const login = (userData: User) => {
    setUser(userData);
    setIsEditing(true);
    router.refresh();
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    setIsEditing(false);
    router.push("/");
    router.refresh();
  };

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isEditing,
        toggleEditMode,
        isLoginModalOpen,
        setIsLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        layoutMode,
        setLayoutMode,
      }}
    >
      {children}
      <LoginModal />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
