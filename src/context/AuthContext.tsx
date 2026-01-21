"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

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
          console.warn("Session expired, logging out.");
          localStorage.removeItem("payload-token");
          localStorage.removeItem("payload-user");
          setUser(null);
          setIsEditing(false);
          // Optional: router.push("/login") if you want to force them there
        }
      } catch (e) {
        console.error("Auth validation error", e);
        // On network error we might not want to logout immediately,
        // but for safety/simplicity let's keep the user logged in locally
        // until a definite 401.
        // However, if we can't validate, we accept the local storage state.
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
    router.push("/");
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
      value={{ user, login, logout, isLoading, isEditing, toggleEditMode }}
    >
      {children}
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
