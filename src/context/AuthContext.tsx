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

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
        localStorage.removeItem("payload-token");
        localStorage.removeItem("payload-user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("payload-token", token);
    localStorage.setItem("payload-user", JSON.stringify(userData));
    setUser(userData);
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
