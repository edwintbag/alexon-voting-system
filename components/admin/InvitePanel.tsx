// components/admin/InvitePanel.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InviteCode {
  id: string;
  code: string;
  email: string | null;
  role: string;
  isUsed: boolean;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export default function InvitePanel() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchCodes = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/invite");
    const data = await res.json();
    setCodes(data.codes ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, []);

  const generateCode = async () => {
    setGenerating(true);
    setError("");
    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email || undefined, role: "ADMIN" }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setGenerating(false); return; }
    setEmail("");
    fetchCodes();
    setGenerating(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/auth/register?code=${code}`;
    navigator.clipboard.writeText(link);
    setCopied(`link-${code}`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-dark-50">Invite Codes</h2>
        <p className="text-dark-400 text-sm mt-1">Generate invite codes for new admins. Codes expire in 48 hours.</p>
      </div>

      {/* Generate new code */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-gold-400 mb-4">Generate New Invite</h3>
        <div className="flex gap-3 flex-wrap">
          <input
            type="email"
            className="input-field flex-1 !py-2"
            placeholder="Pre-assign email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateCode}
            disabled={generating}
            className="btn-gold !py-2 !px-6 whitespace-nowrap"
          >
            {generating ? "Generating..." : "Generate Code"}
          </motion.button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">❌ {error}</p>}
        <p className="text-dark-500 text-xs mt-3">
          💡 Share the code or registration link with the new admin. They must use it within 48 hours.
        </p>
      </div>

      {/* Codes list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : codes.length === 0 ? (
        <div className="glass-card p-8 text-center text-dark-400 text-sm">No invite codes generated yet.</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-surface-border">
            {codes.map((inv, i) => {
              const expired = new Date(inv.expiresAt) < new Date();
              const status = inv.isUsed ? "used" : expired ? "expired" : "active";
              return (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-4 flex-wrap"
                >
                  {/* Code */}
                  <div className="font-mono text-lg font-bold text-gold-400 tracking-widest w-28">{inv.code}</div>

                  {/* Status */}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${status === "active" ? "border-green-500/40 text-green-400 bg-green-500/10" : status === "used" ? "border-dark-500/40 text-dark-500 bg-dark-500/10" : "border-red-500/40 text-red-400 bg-red-500/10"}`}>
                    {status}
                  </span>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    {inv.email && <p className="text-xs text-dark-300">{inv.email}</p>}
                    <p className="text-xs text-dark-500">
                      {inv.isUsed ? `Used ${new Date(inv.usedAt!).toLocaleDateString()}` : `Expires ${new Date(inv.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>

                  {/* Actions */}
                  {status === "active" && (
                    <div className="flex gap-2">
                      <button onClick={() => copyCode(inv.code)} className="text-xs px-3 py-1.5 rounded-lg border border-surface-border text-dark-300 hover:border-gold-500/40 hover:text-gold-400 transition-colors">
                        {copied === inv.code ? "✓ Copied!" : "Copy Code"}
                      </button>
                      <button onClick={() => copyLink(inv.code)} className="text-xs px-3 py-1.5 rounded-lg border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 transition-colors">
                        {copied === `link-${inv.code}` ? "✓ Copied!" : "Copy Link"}
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
