"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type User = {
  id: string;
  email: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isPlayground: boolean;
  sessionToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  setPlaygroundMode: (enabled: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayground, setIsPlayground] = useState(true); // Start in playground mode
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem("sessionToken");
    if (token) {
      checkSession(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkSession = async (token: string) => {
    try {
      const response = await fetch("/api/auth/session", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setSessionToken(token);
        setIsPlayground(false); // Exit playground when authenticated
      } else {
        localStorage.removeItem("sessionToken");
        setSessionToken(null);
      }
    } catch (error) {
      console.error("Failed to check session:", error);
      localStorage.removeItem("sessionToken");
      setSessionToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    localStorage.setItem("sessionToken", data.session.token);
    setSessionToken(data.session.token);
    setUser(data.user);
    setIsPlayground(false);
  };

  const signup = async (email: string, password: string, name?: string) => {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Signup failed");
    }

    const data = await response.json();
    localStorage.setItem("sessionToken", data.session.token);
    setSessionToken(data.session.token);
    setUser(data.user);
    setIsPlayground(false);
  };

  const logout = async () => {
    if (sessionToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    localStorage.removeItem("sessionToken");
    setSessionToken(null);
    setUser(null);
    setIsPlayground(true); // Return to playground mode
  };

  const setPlaygroundMode = useCallback((enabled: boolean) => {
    setIsPlayground(enabled);
    if (enabled && user) {
      // Clear session but keep user in memory until they explicitly logout
      // This allows switching back to authenticated mode
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isPlayground,
        sessionToken,
        login,
        signup,
        logout,
        setPlaygroundMode,
      }}
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

