// components/admin/ResetDataPanel.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResetDataPanel() {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    setLoading(true); setError(""); setSuccess("");
    const res = await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmText }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setSuccess("✅ " + data.message);
      setConfirmText("");
      setShowConfirm(false);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-dark-50">Reset Test Data</h2>
        <p className="text-dark-400 text-sm mt-1">
          Clear all votes and test data before going live. Employees and categories are preserved.
        </p>
      </div>

      {/* What gets cleared */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-dark-200 mb-4">What gets cleared:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: "🗳️", label: "All Votes", desc: "Every vote cast", clear: true },
            { icon: "⭐", label: "All Ratings", desc: "All star ratings given", clear: true },
            { icon: "🏆", label: "Published Winners", desc: "All winner announcements", clear: true },
            { icon: "📊", label: "Monthly Results", desc: "All computed results", clear: true },
            { icon: "📋", label: "Audit Logs", desc: "All admin activity logs", clear: true },
            { icon: "💬", label: "Comment Flags", desc: "All moderation records", clear: true },
          ].map(item => (
            <div key={item.label} className={`flex items-center gap-3 p-3 rounded-lg border ${item.clear ? "border-red-500/20 bg-red-500/5" : "border-green-500/20 bg-green-500/5"}`}>
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className={`text-sm font-medium ${item.clear ? "text-red-400" : "text-green-400"}`}>
                  {item.clear ? "🗑️" : "✅"} {item.label}
                </p>
                <p className="text-xs text-dark-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
          <p className="text-xs text-green-400 font-semibold mb-1">✅ What is KEPT:</p>
          <p className="text-xs text-dark-400">
            All 80 employees · All categories & members · Admin accounts · Voting schedule · Backup files
          </p>
        </div>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset button */}
      {!showConfirm ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
        >
          🗑️ Clear All Test Data
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 border-2 border-red-500/40"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-red-400 font-bold">This action cannot be undone!</p>
              <p className="text-dark-400 text-xs">All votes and test data will be permanently deleted.</p>
            </div>
          </div>

          <p className="text-sm text-dark-300 mb-3">
            Type <span className="font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">CLEAR TEST DATA</span> to confirm:
          </p>

          <input
            type="text"
            className="input-field mb-3 font-mono"
            placeholder="CLEAR TEST DATA"
            value={confirmText}
            onChange={(e) => { setConfirmText(e.target.value); setError(""); }}
          />

          {error && (
            <p className="text-red-400 text-xs mb-3">❌ {error}</p>
          )}

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              disabled={loading || confirmText !== "CLEAR TEST DATA"}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-colors font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Clearing..." : "🗑️ Yes, Clear Everything"}
            </motion.button>
            <button
              onClick={() => { setShowConfirm(false); setConfirmText(""); setError(""); }}
              className="px-5 py-2.5 rounded-lg border border-surface-border text-dark-400 hover:text-dark-200 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Tip */}
      <div className="p-4 bg-gold-500/5 border border-gold-500/20 rounded-xl">
        <p className="text-xs text-gold-400 font-semibold mb-1">💡 Recommended Workflow</p>
        <ol className="text-xs text-dark-400 space-y-1 list-decimal list-inside">
          <li>Create a backup first (Backup tab)</li>
          <li>Run your tests with real employees</li>
          <li>Come back here and clear test data</li>
          <li>You're ready for the real voting period!</li>
        </ol>
      </div>
    </div>
  );
}
