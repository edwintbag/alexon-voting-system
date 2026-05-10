// app/auth/login/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Login failed");
      setLoading(false);
      return;
    }

    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="h-[2px] bg-gold-gradient fixed top-0 left-0 right-0 z-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,151,44,0.07)_0%,transparent_65%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gold-gradient flex items-center justify-center">
            <span className="text-dark-950 font-display font-bold text-lg">A</span>
          </div>
          <div>
            <p className="font-display text-gold-400 font-semibold">Alexon Group</p>
            <p className="text-dark-500 text-xs">Admin Portal</p>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-dark-50 mb-1">Welcome back</h1>
        <p className="text-dark-400 text-sm mb-8">Sign in to access the admin dashboard</p>

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@alexongroup.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="input-field pr-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-gold-400 transition-colors text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
            >
              ❌ {error}
            </motion.div>
          )}

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={loading}
            className="btn-gold w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <><SpinnerIcon /> Signing in...</>
            ) : (
              "Sign In →"
            )}
          </motion.button>
        </div>

        {/* Register link */}
        <div className="mt-6 pt-6 border-t border-surface-border text-center">
          <p className="text-dark-400 text-sm">
            Have an invite code?{" "}
            <Link href="/auth/register" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
              Create your account
            </Link>
          </p>
        </div>

        <p className="mt-4 text-xs text-dark-600 text-center">
          Alexon Group Internal System · Authorized Personnel Only
        </p>
      </motion.div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
