// app/hall-of-fame/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AlexonHeader from "@/components/ui/AlexonHeader";
import Link from "next/link";

interface Winner {
  employeeName: string;
  categoryName: string;
  department: string;
  month: number;
  year: number;
  finalScore: number;
  averageRating: number;
  totalVotes: number;
}

interface Period {
  month: number;
  year: number;
  winners: Winner[];
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function HallOfFamePage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/publish")
      .then(r => r.json())
      .then(d => setPeriods(d.periods ?? []))
      .finally(() => setLoading(false));
  }, []);

  // All-time winners aggregated
  const allWinners = periods.flatMap(p => p.winners.map(w => ({ ...w, period: `${MONTHS[w.month - 1]} ${w.year}` })));

  // Most wins leaderboard
  const winCounts = allWinners.reduce<Record<string, { name: string; wins: number; categories: string[] }>>(
    (acc, w) => {
      if (!acc[w.employeeName]) acc[w.employeeName] = { name: w.employeeName, wins: 0, categories: [] };
      acc[w.employeeName].wins++;
      if (!acc[w.employeeName].categories.includes(w.categoryName)) {
        acc[w.employeeName].categories.push(w.categoryName);
      }
      return acc;
    }, {}
  );
  const topWinners = Object.values(winCounts).sort((a, b) => b.wins - a.wins).slice(0, 10);

  const filtered = allWinners.filter(w =>
    !filter || w.employeeName.toLowerCase().includes(filter.toLowerCase()) ||
    w.categoryName.toLowerCase().includes(filter.toLowerCase())
  );

  const RANK_STYLES = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="h-[2px] bg-gold-gradient" />
      <AlexonHeader />

      {/* Hero */}
      <div className="relative overflow-hidden bg-surface py-14 border-b border-surface-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,151,44,0.1)_0%,transparent_65%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex w-16 h-16 bg-gold-gradient rounded-full items-center justify-center shadow-gold-lg mb-4">
            <span className="text-3xl">🏛️</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest mb-2">Alexon Group</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-dark-50 mb-3">
              Hall of <span className="text-transparent bg-clip-text bg-gold-gradient">Fame</span>
            </h1>
            <div className="gold-line w-32 mx-auto my-4" />
            <p className="text-dark-400 text-sm max-w-md mx-auto">
              Celebrating the outstanding employees who have been recognised month after month for their exceptional performance.
            </p>
          </motion.div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
          </div>
        ) : periods.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <div className="text-6xl mb-4">🏛️</div>
            <h2 className="font-display text-2xl font-bold text-dark-50 mb-2">Hall of Fame is Empty</h2>
            <p className="text-dark-400 mb-6">Winners will appear here once results are published.</p>
            <Link href="/winners"><button className="btn-gold">View Current Winners →</button></Link>
          </div>
        ) : (
          <>
            {/* Most Wins Leaderboard */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🏆</span>
                <h2 className="font-display text-2xl font-bold text-dark-50">Most Wins</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topWinners.map((winner, i) => (
                  <motion.div key={winner.name}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className={`glass-card p-5 relative overflow-hidden ${i === 0 ? "border-2 border-gold-500 shadow-gold" : "border border-gold-500/20"}`}>
                    {i === 0 && <div className="absolute top-0 left-0 right-0 h-1 bg-gold-gradient" />}

                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{RANK_STYLES[i] ?? `#${i + 1}`}</div>
                      <div className="w-12 h-12 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center font-bold text-gold-400">
                        {winner.name.split(" ").slice(0,2).map((n:string) => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${i === 0 ? "text-gold-300" : "text-dark-100"}`}>{winner.name}</p>
                        <p className="text-xs text-dark-500">{winner.categories.join(", ")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold font-display text-gold-400">{winner.wins}</p>
                        <p className="text-xs text-dark-500">{winner.wins === 1 ? "win" : "wins"}</p>
                      </div>
                    </div>

                    {winner.wins >= 3 && (
                      <div className="mt-3 pt-3 border-t border-surface-border">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30">
                          ⭐ Consistent Performer
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Full History */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📜</span>
                  <h2 className="font-display text-2xl font-bold text-dark-50">Full History</h2>
                </div>
                <input type="text" className="input-field !py-2 !text-sm w-full sm:w-56"
                  placeholder="Search by name or category..."
                  value={filter} onChange={(e) => setFilter(e.target.value)} />
              </div>

              {/* Group by year */}
              {Array.from(new Set(filtered.map(w => w.year))).sort((a, b) => b - a).map(year => (
                <div key={year} className="mb-8">
                  <h3 className="text-lg font-display font-bold text-gold-400 mb-4 flex items-center gap-2">
                    <span className="w-8 h-px bg-gold-500/40 inline-block" />
                    {year}
                    <span className="w-8 h-px bg-gold-500/40 inline-block" />
                  </h3>

                  <div className="glass-card overflow-hidden">
                    <div className="divide-y divide-surface-border">
                      {filtered.filter(w => w.year === year).map((w, i) => (
                        <motion.div key={`${w.month}-${w.categoryName}-${w.employeeName}`}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors">
                          <div className="w-9 h-9 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-xs font-bold text-gold-400 flex-shrink-0">
                            {w.employeeName.split(" ").slice(0,2).map((n:string) => n[0]).join("")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-dark-100">{w.employeeName}</p>
                            <p className="text-xs text-dark-400">{w.categoryName}</p>
                          </div>
                          <div className="text-center hidden sm:block">
                            <p className="text-xs text-dark-300">{MONTHS[w.month - 1]}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono text-gold-400">{w.finalScore.toFixed(2)}</p>
                            <p className="text-xs text-dark-500">{w.totalVotes} votes</p>
                          </div>
                          <span className="text-lg">🏆</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="glass-card p-8 text-center">
                  <p className="text-dark-400 text-sm">No results found for "{filter}"</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
