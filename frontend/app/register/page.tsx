"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RegisterForm from "../../components/RegisterForm";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading, register } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  // If already logged in, go straight to the app.
  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  const handleRegister = async (
    email: string,
    password: string,
    name: string,
    username: string,
  ) => {
    setAuthError(null);
    try {
      await register(email, password, name, username);
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
    <RegisterForm
      onRegister={handleRegister}
      onSwitchToLogin={() => router.push("/login")}
      error={authError}
    />
  );
}