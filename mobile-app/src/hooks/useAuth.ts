import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { User } from "@shared/types";
import { loginUser, registerUser, logoutUser, setMobileToken } from "@shared/api"; 

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        if (token) {
          setMobileToken(token); // Inject the token into the API file here
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.6:5001"}/auth/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
          } else {
            await SecureStore.deleteItemAsync("userToken");
            setMobileToken(null); // Clear if session is invalid
          }
        }
      } catch (err) {
        console.error("Token verification error:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const data = await loginUser(email, password, false);
      if (data.token) {
        await SecureStore.setItemAsync("userToken", data.token);
        setMobileToken(data.token); //Inject on login
      }
      setCurrentUser(data);
    } catch (err: any) {
      setAuthError(err.message || "Failed to authenticate.");
    }
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    setAuthError(null);
    try {
      const data = await registerUser(email, password, name);
      if (data.token) {
        await SecureStore.setItemAsync("userToken", data.token);
        setMobileToken(data.token); // Inject on register
      }
      setCurrentUser(data);
    } catch (err: any) {
      setAuthError(err.message || "Failed to create account.");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      await SecureStore.deleteItemAsync("userToken");
      setMobileToken(null); // Clear on logout
      setCurrentUser(null);
    }
  };

  return {
    currentUser,
    authLoading,
    authError,
    handleLogin,
    handleRegister,
    handleLogout,
  };
}