"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { fetchMyAvatar } from "../../shared/api";

interface AvatarContextValue {
  avatarColor: string;
  avatarEmoji: string | null;
  setAvatarLocal: (color: string, emoji: string | null) => void;
  refreshAvatar: () => Promise<void>;
}

const AvatarContext = createContext<AvatarContextValue | null>(null);

export function AvatarProvider({ children }: { children: ReactNode }) {
  const [avatarColor, setAvatarColor] = useState("#0f172a");
  const [avatarEmoji, setAvatarEmoji] = useState<string | null>(null);

  const refreshAvatar = useCallback(async () => {
    try {
      const res = await fetchMyAvatar();
      setAvatarColor(res.avatarColor);
      setAvatarEmoji(res.avatarEmoji);
    } catch {
    
    }
  }, []);

  const setAvatarLocal = useCallback((color: string, emoji: string | null) => {
    setAvatarColor(color);
    setAvatarEmoji(emoji);
  }, []);

  return (
    <AvatarContext.Provider value={{ avatarColor, avatarEmoji, setAvatarLocal, refreshAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error("useAvatar must be used within AvatarProvider");
  return ctx;
}