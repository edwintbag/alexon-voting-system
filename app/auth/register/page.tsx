// app/auth/register/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({ code: "", name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleRegister = async () => {
    if (!form.code || !form.name || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: form.code, name: form.name, email: form.email, password: form.password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registration failed");
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
        className="glass-card p-8 w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gold-gradient flex items-center justify-center">
            <span className="text-dark-950 font-display font-bold text-lg">A</span>
          </div>
          <div>
            <p className="font-display text-gold-400 font-semibold">Alexon Group</p>
            <p className="text-dark-500 text-xs">Admin Registration</p>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-dark-50 mb-1">Create Admin Account</h1>
        <p className="text-dark-400 text-sm mb-8">Enter your invite code to get started</p>

        <div className="space-y-4">
          {/* Invite Code */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Invite Code <span className="text-gold-400">*</span>
            </label>
            <input
              type="text"
              className="input-field font-mono uppercase tracking-widest"
              placeholder="e.g. ABCD1234"
              value={form.code}
              onChange={(e) => update("code", e.target.value.toUpperCase())}
              maxLength={8}
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Full Name <span className="text-gold-400">*</span></label>
            <input type="text" className="input-field" placeholder="e.g. John Kamau" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Email Address <span className="text-gold-400">*</span></label>
            <input type="email" className="input-field" placeholder="you@alexongroup.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Password <span className="text-gold-400">*</span></label>
            <input type="password" className="input-field" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={(e) => update("password", e.target.value)} />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Confirm Password <span className="text-gold-400">*</span></label>
            <input type="password" className="input-field" placeholder="Re-enter password" value={form.confirm} onChange={(e) => update("confirm", e.target.value)} />
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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRegister}
            disabled={loading}
            className="btn-gold w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? "Creating Account..." : "Create Account →"}
          </motion.button>
        </div>

        <div className="mt-6 pt-6 border-t border-surface-border text-center">
          <p className="text-dark-400 text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
