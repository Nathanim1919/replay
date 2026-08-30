"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { API_URL, fetchWithAuth } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Optional since we clean it out
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>; // Fixed type
  signup: (name: string, email: string, password: string) => Promise<User>; // Fixed type
  logout: () => Promise<void>; // Fixed type
  me: () => Promise<User | null>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const signup = async (name: string, email: string, password: string): Promise<User> => { 
    setIsLoading(true);
    try {
      const res = await fetchWithAuth("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Signup failed!");
      }

      // Automatically chain login on successful signup
      return await login(email, password);
    } catch (error) {
      // Do NOT swallow the error with an alert. Rethrow it for Sonner.
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Invalid email or password");
      }

      const currentUser = await me();
      if (!currentUser) {
        throw new Error("Failed to fetch user data after login");
      }

      router.push("/");
      return currentUser;
    } catch (error) {
      throw error; // Let the page component catch this
    } finally {
      setIsLoading(false);
    }
  };

  const me = async (): Promise<User | null> => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth("/api/auth/me", {
        method: "GET",
      });

      if (res.ok) {
        const data = await res.json();
        const currentUser = {
          id: data.id,
          email: data.email,
          name: data.name,
        };
        setUser(currentUser);
        return currentUser;
      } else {
        setUser(null);
        return null;
      }
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth("/api/auth/logout", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Logout backend request failed");
      
      setUser(null);
      router.push("/");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    me();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        me,
        signup,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};