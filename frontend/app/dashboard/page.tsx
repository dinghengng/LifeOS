"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "../../../shared/types";
import { checkAuthStatus, logoutUser } from "../../../shared/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]               = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const currentUser = await checkAuthStatus();
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);
      setAuthLoading(false);
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    try { await logoutUser(); } catch (err) { console.error(err); }
    router.push("/");
  };

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f5f2]">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }

  const today = new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f2", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{today}</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500 }}>
            {user?.name ? `${user.name}'s dashboard` : "Your dashboard"}
          </h1>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
}