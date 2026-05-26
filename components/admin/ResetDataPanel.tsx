// components/admin/ResetDataPanel.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResetDataPanel() {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [deleted, setDeleted] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    setLoading(true); setError(""); setSuccess(""); setDeleted(null);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Reset failed"); }
      else { setSuccess(data.message); setDeleted(data.deleted); setConfirmText(""); setShowConfirm(false); }
    } catch (e: any) { setError("Connection error: " + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-dark-50">Reset Pilot Data</h2>
        <p className="text-dark-400 text-sm mt-1">Clear all votes and pilot data before going live. Employees and categories are preserved.</p>
      </div>

      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-dark-200 mb-4">What gets cleared:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: "🗳️", label: "All Votes", desc: "Every vote cast during piloting" },
            { icon: "⭐", label: "All Ratings", desc: "All star ratings given" },
            { icon: "🏆", label: "Published Winners", desc: "All winner announcements" },
            { icon: "📊", label: "Monthly Results", desc: "All computed results" },
            { icon: "📋", label: "Audit Logs", desc: "All admin activity logs" },
            { icon: "💬", label: "Comment Flags", desc: "All moderation records" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-sm font-medium text-red-400">🗑️ {item.label}</p>
                <p className="text-xs text-dark-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
          <p className="text-xs text-green-400 font-semibold mb-1">✅ What is KEPT:</p>
          <p className="text-xs text-dark-400">All 80 employees · All categories & members · Admin accounts · Voting schedule · Backup files</p>
        </div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <p className="text-green-400 text-sm font-semibold mb-3">✅ {success}</p>
            {deleted && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(deleted).map(([key, count]) => (
                  <div key={key} className="p-2 bg-surface-card rounded-lg border border-surface-border text-center">
                    <p className="text-lg font-bold font-mono text-gold-400">{count}</p>
                    <p className="text-xs text-dark-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">❌ {error}</motion.div>
        )}
      </AnimatePresence>

      {!showConfirm ? (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20 transition-colors font-medium">
          🗑️ Clear All Pilot Data
        </motion.button>
      ) : (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 border-2 border-red-500/40">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-red-400 font-bold">This action cannot be undone!</p>
              <p className="text-dark-400 text-xs">All votes and pilot data will be permanently deleted.</p>
            </div>
          </div>
          <p className="text-sm text-dark-300 mb-3">
            Type <span className="font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">CLEAR TEST DATA</span> to confirm:
          </p>
          <input type="text" className="input-field mb-3 font-mono" placeholder="CLEAR TEST DATA"
            value={confirmText} onChange={(e) => { setConfirmText(e.target.value); setError(""); }} />
          {error && <p className="text-red-400 text-xs mb-3">❌ {error}</p>}
          <div className="flex gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              disabled={loading || confirmText !== "CLEAR TEST DATA"}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-colors font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? "Clearing..." : "🗑️ Yes, Clear Everything"}
            </motion.button>
            <button onClick={() => { setShowConfirm(false); setConfirmText(""); setError(""); }}
              className="px-5 py-2.5 rounded-lg border border-surface-border text-dark-400 hover:text-dark-200 transition-colors text-sm">
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div className="glass-card p-4 border border-gold-500/20">
        <p className="text-xs text-gold-400 font-semibold mb-1">💡 Recommended Workflow</p>
        <ol className="text-xs text-dark-400 space-y-1 list-decimal list-inside">
          <li>Create a backup first (Backup tab)</li>
          <li>Run your pilot tests with real employees</li>
          <li>Come back here and clear pilot data</li>
          <li>You are ready for the real voting period!</li>
        </ol>
      </div>
    </div>
  );
}
