"use client";

import { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export type User = { id: number; email: string };

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api<User>("/auth/me"),
    retry: false,
  });

  const login = async (email: string, password: string) => {
    const user = await api<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    queryClient.setQueryData(["me"], user);
  };

  const logout = async () => {
    await api("/auth/logout", { method: "POST" });
    queryClient.setQueryData(["me"], null);
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "me" });
  };

  return (
    <AuthContext.Provider
      value={{ user: data ?? null, loading: isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
