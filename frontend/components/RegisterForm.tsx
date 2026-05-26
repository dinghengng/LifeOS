"use client";

import { useState } from "react";

interface RegisterFormProps {
  onRegister: (email: string, password: string, name: string) => Promise<void>;
  onSwitchToLogin: () => void;
  error: string | null;
}

export default function RegisterForm({ onRegister, onSwitchToLogin, error }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  //password checking
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setLocalError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    await onRegister(email, password, name);
    setIsSubmitting(false);
  };

  const displayError = localError || error;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-1 text-center">
          Create your account
        </h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          Start building better habits with LifeOS
        </p>

        {/* Error at the top of the form */}
        {displayError && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
            {displayError}
          </p>
        )}

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Optional display name field */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Name <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Email field */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1">
  <label className="text-sm font-medium text-slate-700">Password</label>
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="At least 8 characters"
      required
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-700"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {/* Simple eye icon as inline SVG */}
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

          {/* Confirm password field */}
          <div className="flex flex-col gap-1">
  <label className="text-sm font-medium text-slate-700">
    Confirm password
  </label>
  <div className="relative">
    <input
      type={showConfirm ? "text" : "password"}
      value={confirm}
      onChange={(e) => setConfirm(e.target.value)}
      placeholder="Repeat your password"
      required
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
    <button
      type="button"
      onClick={() => setShowConfirm((prev) => !prev)}
      className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-700"
      aria-label={showConfirm ? "Hide password" : "Show password"}
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

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || !email || !password || !confirm}
            className={`rounded-xl px-4 py-2.5 font-semibold text-white transition-colors ${
              isSubmitting || !email || !password || !confirm
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* Sign in to existing acc */}
        <p className="text-sm text-center text-slate-500 mt-4">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-indigo-600 font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}