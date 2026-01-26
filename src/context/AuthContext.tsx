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
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  isEditing: boolean;
  toggleEditMode: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (isOpen: boolean) => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const router = useRouter();

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // Listen for unauthorized events from apiFetch
  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn("Unauthorized event received. Clearing session.");
      localStorage.removeItem("payload-token");
      localStorage.removeItem("payload-user");
      setUser(null);
      setIsEditing(false);
      setIsLoginModalOpen(true);
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem("payload-token");
    const storedUser = localStorage.getItem("payload-user");

    const validateSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const API_URL =
          process.env.NEXT_PUBLIC_PAYLOAD_API_URL || "http://localhost:3000";
        const res = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            Authorization: `JWT ${token}`,
          },
        });

        if (res.ok) {
          // Token is valid
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsEditing(true);
          } else {
            // Fallback: fetch user data if missing but token valid
            const data = await res.json();
            if (data.user) {
              setUser(data.user);
              localStorage.setItem("payload-user", JSON.stringify(data.user));
              setIsEditing(true);
            }
          }
        } else {
          // Token invalid/expired
          console.warn(
            "Session expired (validation check), logging out locally.",
          );
          localStorage.removeItem("payload-token");
          localStorage.removeItem("payload-user");
          setUser(null);
          setIsEditing(false);
          // Optional: router.push("/login") if you want to force them there
        }
      } catch (e) {
        console.error("Auth validation error", e);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsEditing(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("payload-token", token);
    localStorage.setItem("payload-user", JSON.stringify(userData));
    setUser(userData);
    setIsEditing(true);
    // Remove redirect so modal login stays on page
    // router.push("/");
    router.refresh();
  };

  const logout = () => {
    localStorage.removeItem("payload-token");
    localStorage.removeItem("payload-user");
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
