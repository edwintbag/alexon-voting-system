// components/admin/AdminAuth.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  onAuth: (secret: string) => void;
}

export default function AdminAuth({ onAuth }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/admin/results?secret=${encodeURIComponent(value)}&month=1&year=2025`
      );
      if (res.status === 401) {
        setError("Incorrect admin password. Please try again.");
      } else {
        onAuth(value);
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="h-[2px] bg-gold-gradient fixed top-0 left-0 right-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-md"
      >
        {/* Lock icon */}
        <div className="w-14 h-14 bg-gold-500/10 border border-gold-500/30 rounded-xl flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">🔐</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-center text-dark-50 mb-1">
          Admin Access
        </h1>
        <p className="text-dark-400 text-sm text-center mb-8">
          Enter the admin password to access the dashboard
        </p>

        <div className="space-y-4">
          <input
            type="password"
            className="input-field text-center text-lg tracking-widest"
            placeholder="••••••••"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading || !value.trim()}
            className="btn-gold w-full flex items-center justify-center gap-2"
          >
            {loading ? "Verifying..." : "Access Dashboard →"}
          </motion.button>
        </div>

        <p className="mt-6 text-xs text-dark-600 text-center">
          Alexon Group Internal System · Authorized Personnel Only
        </p>
      </motion.div>
    </div>
  );
}
