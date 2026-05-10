// components/admin/CommentModerationPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  voteId: string;
  comment: string | null;
  candidateName: string;
  categoryName: string;
  createdAt: string;
  moderation: { isHidden: boolean; isFlagged: boolean; reason: string | null } | null;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function CommentModerationPanel() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [filter, setFilter] = useState<"all" | "visible" | "hidden" | "flagged">("all");
  const [saving, setSaving] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/comments?month=${month}&year=${year}`);
    const data = await res.json();
    setComments(data.comments ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, [month, year]);

  const moderate = async (voteId: string, action: "hide" | "unhide" | "flag" | "unflag", reason?: string) => {
    setSaving(voteId);
    await fetch("/api/admin/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voteId,
        ...(action === "hide" && { isHidden: true, reason }),
        ...(action === "unhide" && { isHidden: false }),
        ...(action === "flag" && { isFlagged: true }),
        ...(action === "unflag" && { isFlagged: false }),
      }),
    });
    setSaving(null);
    fetchComments();
  };

  const filtered = comments.filter(c => {
    if (filter === "hidden") return c.moderation?.isHidden;
    if (filter === "flagged") return c.moderation?.isFlagged;
    if (filter === "visible") return !c.moderation?.isHidden;
    return true;
  });

  const hiddenCount = comments.filter(c => c.moderation?.isHidden).length;
  const flaggedCount = comments.filter(c => c.moderation?.isFlagged).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-dark-50">Comment Moderation</h2>
        <p className="text-dark-400 text-sm mt-1">Review and moderate voter comments. Hidden comments are removed from public view.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <select className="input-field !py-2 !text-sm w-36" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select className="input-field !py-2 !text-sm w-24" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-surface-card border border-surface-border rounded-lg p-1">
          {([
            { id: "all", label: `All (${comments.length})` },
            { id: "visible", label: `Visible (${comments.length - hiddenCount})` },
            { id: "flagged", label: `Flagged (${flaggedCount})`, color: flaggedCount > 0 ? "text-yellow-400" : "" },
            { id: "hidden", label: `Hidden (${hiddenCount})`, color: hiddenCount > 0 ? "text-red-400" : "" },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filter === tab.id ? "bg-gold-500 text-dark-950" : `text-dark-300 hover:text-dark-100 ${tab.color ?? ""}`}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-dark-400 text-sm">No comments found for this period.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const isHidden = c.moderation?.isHidden ?? false;
            const isFlagged = c.moderation?.isFlagged ?? false;

            return (
              <motion.div key={c.voteId}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`glass-card p-5 ${isHidden ? "opacity-60 border-red-500/20" : isFlagged ? "border-yellow-500/20" : "border-surface-border"}`}>

                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-dark-100">
                        For: <span className="text-gold-400">{c.candidateName}</span>
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-card border border-surface-border text-dark-400">
                        {c.categoryName}
                      </span>
                      {isHidden && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400">
                          🚫 Hidden
                        </span>
                      )}
                      {isFlagged && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">
                          🚩 Flagged
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dark-500 mt-0.5">
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Comment text */}
                <div className={`p-3 rounded-lg border mb-4 ${isHidden ? "bg-red-500/5 border-red-500/20" : "bg-surface-card border-surface-border"}`}>
                  <p className="text-sm text-dark-200 italic">"{c.comment}"</p>
                  {isHidden && c.moderation?.reason && (
                    <p className="text-xs text-red-400 mt-1">Hidden reason: {c.moderation.reason}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {!isHidden ? (
                    <HideButton
                      onConfirm={(reason) => moderate(c.voteId, "hide", reason)}
                      saving={saving === c.voteId}
                    />
                  ) : (
                    <button onClick={() => moderate(c.voteId, "unhide")}
                      disabled={saving === c.voteId}
                      className="text-xs px-3 py-1.5 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">
                      ✓ Unhide Comment
                    </button>
                  )}

                  <button onClick={() => moderate(c.voteId, isFlagged ? "unflag" : "flag")}
                    disabled={saving === c.voteId}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${isFlagged ? "border-dark-500/30 text-dark-400 hover:bg-dark-500/10" : "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"}`}>
                    {isFlagged ? "Remove Flag" : "🚩 Flag"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HideButton({ onConfirm, saving }: { onConfirm: (reason: string) => void; saving: boolean }) {
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");

  if (showReason) {
    return (
      <div className="flex gap-2 items-center flex-wrap">
        <input type="text" className="input-field !py-1.5 !text-xs w-48"
          placeholder="Reason (optional)"
          value={reason} onChange={(e) => setReason(e.target.value)} />
        <button onClick={() => { onConfirm(reason); setShowReason(false); setReason(""); }}
          disabled={saving}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
          Confirm Hide
        </button>
        <button onClick={() => setShowReason(false)}
          className="text-xs px-3 py-1.5 rounded-lg border border-surface-border text-dark-400 hover:text-dark-200 transition-colors">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setShowReason(true)} disabled={saving}
      className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
      🚫 Hide Comment
    </button>
  );
}
