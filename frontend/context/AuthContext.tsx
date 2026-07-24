"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "../../shared/types";
import {
  checkAuthStatus,
  loginUser,
  registerUser,
  logoutUser,
} from "../../shared/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    username: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check for an active session cookie / mobile token once on mount.
  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const activeUser = await checkAuthStatus();
        if (!cancelled) setUser(activeUser);
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const loggedInUser = await loginUser(email, password, rememberMe);
    setUser(loggedInUser);
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    username: string,
  ) => {
    const registeredUser = await registerUser(email, password, name, username);
    setUser(registeredUser);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}