"use client";

import { useState } from "react";
import { useTranslation } from "../context/LanguageContext";

interface LoginFormProps {
  onLogin: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  onSwitchToRegister: () => void; //register new acc
  error: string | null;
}

export default function LoginForm({ onLogin, onSwitchToRegister, error }: LoginFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); //prevent double submit
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    await onLogin(email, password, rememberMe);
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-1 text-center">
          {t("login.title")}
        </h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          {t("login.subtitle")}
        </p>

        {/* Error message */}
        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
            {error}
          </p>
        )}
        
        {/* Login form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email field */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">{t("login.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("login.emailPlaceholder")}
              required
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        
          {/* Password field */}
          <div className="flex flex-col gap-1">
  <label className="text-sm font-medium text-slate-700">{t("login.password")}</label>
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder={t("login.passwordPlaceholder")}
      required
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-700"
      aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M1.5 12S4.5 5.5 12 5.5 22.5 12 22.5 12 19.5 18.5 12 18.5 1.5 12 1.5 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  </div>
</div>

          {/* Remember Me */}
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 accent-indigo-600"
            />
            {t("login.rememberMe")}
          </label>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || !email || !password}
            className={`rounded-xl px-4 py-2.5 font-semibold text-white transition-colors ${
              isSubmitting || !email || !password
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isSubmitting ? t("login.submitting") : t("login.submit")}
          </button>
        </form>

        {/* Link to register new acc */}
        <p className="text-sm text-center text-slate-500 mt-4">
          {t("login.noAccount")}{" "}
          <button
            onClick={onSwitchToRegister}
            className="text-indigo-600 font-medium hover:underline"
          >
            {t("login.createOne")}
          </button>
        </p>
      </div>
    </div>
  );
}