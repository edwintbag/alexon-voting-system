// components/admin/BackupPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Backup {
  id: string;
  filename: string;
  sizeBytes: number;
  trigger: string;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TRIGGER_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  AUTO_BEFORE_PUBLISH: "Auto (before publish)",
  AUTO_BEFORE_DELETE: "Auto (before delete)",
};

const TRIGGER_COLORS: Record<string, string> = {
  MANUAL: "text-gold-400 bg-gold-500/10 border-gold-500/30",
  AUTO_BEFORE_PUBLISH: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  AUTO_BEFORE_DELETE: "text-purple-400 bg-purple-500/10 border-purple-500/30",
};

export default function BackupPanel() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fetchBackups = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/backup");
    const data = await res.json();
    setBackups(data.backups ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchBackups(); }, []);

  const createBackup = async () => {
    setCreating(true); setError(""); setSuccess("");
    const res = await fetch("/api/admin/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger: "MANUAL" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error + (data.details ? `: ${data.details}` : ""));
    } else {
      setSuccess(`✅ Backup created: ${data.backup.filename}`);
      fetchBackups();
    }
    setCreating(false);
  };

  const downloadBackup = (id: string) => {
    window.open(`/api/admin/backup?download=${id}`, "_blank");
  };

  const deleteBackup = async (id: string, filename: string) => {
    if (!confirm(`Delete backup "${filename}"?`)) return;
    await fetch("/api/admin/backup", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchBackups();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-dark-50">Backup & Restore</h2>
        <p className="text-dark-400 text-sm mt-1">
          Create and manage database backups. Last 5 backups are kept automatically.
        </p>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            ❌ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create backup */}
      <div className="glass-card p-6 border border-gold-500/20">
        <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-2">
          Create New Backup
        </h3>
        <p className="text-dark-400 text-xs mb-4">
          Creates a full database backup stored on the server. You can also download it to your computer.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {[
            { icon: "🗄️", label: "Full Database", desc: "All tables and data" },
            { icon: "📦", label: "Stored on Server", desc: "Last 5 kept automatically" },
            { icon: "⬇️", label: "Downloadable", desc: "Save to your computer" },
          ].map(item => (
            <div key={item.label} className="p-3 bg-surface-card rounded-lg border border-surface-border text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <p className="text-xs font-semibold text-dark-200">{item.label}</p>
              <p className="text-xs text-dark-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={createBackup} disabled={creating}
          className="btn-gold flex items-center gap-2 disabled:opacity-50">
          {creating ? (
            <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Creating Backup...</>
          ) : "🗄️ Create Backup Now"}
        </motion.button>
      </div>

      {/* Backup list */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dark-200">Stored Backups</h3>
          <span className="text-xs text-dark-500">{backups.length}/5 slots used</span>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-lg" />)}</div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-dark-400 text-sm">No backups yet. Create your first backup above.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {backups.map((backup, i) => (
              <motion.div key={backup.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors flex-wrap">

                <div className="text-2xl">💾</div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-dark-100 truncate">{backup.filename}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded border ${TRIGGER_COLORS[backup.trigger] ?? "text-dark-400 bg-dark-500/10 border-dark-500/30"}`}>
                      {TRIGGER_LABELS[backup.trigger] ?? backup.trigger}
                    </span>
                    <span className="text-xs text-dark-500">{formatBytes(backup.sizeBytes)}</span>
                    <span className="text-xs text-dark-500">
                      {new Date(backup.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => downloadBackup(backup.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 transition-colors">
                    ⬇ Download
                  </button>
                  <button onClick={() => deleteBackup(backup.id, backup.filename)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Restore note */}
      <div className="glass-card p-4 border border-yellow-500/20">
        <p className="text-xs text-yellow-400 font-semibold mb-1">⚠️ How to Restore</p>
        <p className="text-xs text-dark-400 leading-relaxed">
          To restore, download the backup file then run this command in PowerShell:
        </p>
        <code className="block mt-2 p-2 bg-dark-950 rounded text-xs text-green-400 font-mono">
          psql -U postgres -d alexon_voting -f "path\to\backup.sql"
        </code>
        <p className="text-xs text-dark-500 mt-2">
          Replace the path with where you saved the downloaded .sql file.
        </p>
      </div>
    </div>
  );
}
