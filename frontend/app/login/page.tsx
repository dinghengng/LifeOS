"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "../../components/LoginForm";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  // Already logged in then go straight to the app.
  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  const handleLogin = async (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => {
    setAuthError(null);
    try {
      await login(email, password, rememberMe);
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError("Could not connect to server.");
      }
    }
  };

  if (loading || user) {
    return null;
  }

  return (
    <LoginForm
      onLogin={handleLogin}
      onSwitchToRegister={() => router.push("/register")}
      error={authError}
    />
  );
}