// components/admin/PublishWinnersPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PublishedWinner {
  id: string;
  employeeName: string;
  categoryName: string;
  department: string;
  finalScore: number;
  totalVotes: number;
  month: number;
  year: number;
  publishedAt: string;
}

interface Period {
  month: number;
  year: number;
  publishedAt: string;
  winners: PublishedWinner[];
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function PublishWinnersPanel() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fetchPublished = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/publish");
    const data = await res.json();
    setPeriods(data.periods ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchPublished(); }, []);

  // Load preview from results
  const loadPreview = async () => {
    setLoadingPreview(true);
    const res = await fetch(`/api/admin/results?month=${month}&year=${year}`);
    const data = await res.json();
    if (data.results) {
      const winners = Object.entries(data.results).map(([cat, results]: any) => ({
        category: cat,
        winner: results[0] ?? null,
      })).filter(r => r.winner);
      setPreview(winners);
    }
    setLoadingPreview(false);
  };

  useEffect(() => { loadPreview(); }, [month, year]);

  const handlePublish = async () => {
    setPublishing(true); setError(""); setSuccess("");
    const res = await fetch("/api/admin/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, year, message }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setPublishing(false); return; }
    setSuccess(`✅ Successfully published ${data.published} winner${data.published !== 1 ? "s" : ""} for ${MONTHS[month - 1]} ${year}!`);
    setMessage("");
    fetchPublished();
    setPublishing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-dark-50">Publish Winners</h2>
        <p className="text-dark-400 text-sm mt-1">
          Select a month and publish winners to the public Winners page.
        </p>
      </div>

      {/* Success / Error */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
            {success}
            <a href="/winners" target="_blank" className="ml-2 underline hover:text-green-300">
              View Winners Page →
            </a>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            ❌ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publish form */}
      <div className="glass-card p-6 border border-gold-500/20">
        <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-4">
          Publish New Winners
        </h3>

        {/* Month/Year picker */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <select className="input-field !py-2 !text-sm w-40" value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="input-field !py-2 !text-sm w-28" value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Preview winners */}
        {loadingPreview ? (
          <div className="space-y-2 mb-4">
            {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
          </div>
        ) : preview.length > 0 ? (
          <div className="mb-4">
            <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
              Winners Preview for {MONTHS[month - 1]} {year}
            </p>
            <div className="space-y-2">
              {preview.map(({ category, winner }) => (
                <div key={category}
                  className="flex items-center gap-3 px-4 py-3 bg-surface-card rounded-lg border border-surface-border">
                  <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-xs font-bold text-gold-400 flex-shrink-0">
                    {winner.employeeName.split(" ").slice(0,2).map((n: string) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark-100">{winner.employeeName}</p>
                    <p className="text-xs text-dark-400">{category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-gold-400">{winner.finalScore.toFixed(2)}</p>
                    <p className="text-xs text-dark-500">{winner.totalVotes} votes</p>
                  </div>
                  <span className="text-lg">🏆</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4 p-4 bg-surface-card rounded-lg border border-surface-border text-center">
            <p className="text-dark-400 text-sm">No votes recorded for {MONTHS[month - 1]} {year}</p>
          </div>
        )}

        {/* Optional announcement message */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Announcement Message{" "}
            <span className="text-dark-500 font-normal">(optional)</span>
          </label>
          <textarea
            className="input-field resize-none"
            rows={2}
            placeholder="e.g. Congratulations to this month's outstanding performers who exemplify Alexon Group's values..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={300}
          />
          <p className="text-xs text-dark-500 mt-1 text-right">{message.length}/300</p>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handlePublish}
          disabled={publishing || preview.length === 0}
          className="btn-gold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          {publishing ? "Publishing..." : `🏆 Publish Winners for ${MONTHS[month - 1]} ${year}`}
        </motion.button>

        <p className="text-xs text-dark-500 mt-3">
          💡 Publishing will make winners visible on the public{" "}
          <a href="/winners" target="_blank" className="text-gold-400 hover:underline">/winners</a> page.
          You can republish to update.
        </p>
      </div>

      {/* Previously published */}
      {!loading && periods.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-4">
            Previously Published
          </h3>
          <div className="space-y-3">
            {periods.map((period) => (
              <div key={`${period.year}-${period.month}`}
                className="flex items-center justify-between px-4 py-3 bg-surface-card rounded-lg border border-surface-border">
                <div>
                  <p className="text-sm font-semibold text-dark-100">
                    {MONTHS[period.month - 1]} {period.year}
                  </p>
                  <p className="text-xs text-dark-500">
                    {period.winners.length} winner{period.winners.length !== 1 ? "s" : ""} ·
                    Published {new Date(period.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {period.winners.slice(0, 3).map((w, i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-xs font-bold text-gold-400">
                        {w.employeeName.split(" ")[0][0]}
                      </div>
                    ))}
                  </div>
                  <a href="/winners" target="_blank"
                    className="text-xs px-3 py-1.5 rounded-lg border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 transition-colors">
                    View →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
