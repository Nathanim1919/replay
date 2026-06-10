"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  logout: () => void;
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

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        await me();
        router.push("/dashboard");
      } else {
        alert("Login failed!");
      }
    } catch {
      alert("Login failed!");
    } finally {
      setIsLoading(false);
    }
  };

  const me = async (): Promise<User | null> => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8080/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const currentUser = {
          id: data.id,
          email: data.email,
          name: data.name,
          password: "",
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

  const logout = () => {};

  useEffect(() => {
    const fetchUser = async () => {
      await me();
    };
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        me,
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
