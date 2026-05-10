// app/winners/page.tsx — Public Winners Page
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import AlexonHeader from "@/components/ui/AlexonHeader";
import WinnerCard from "@/components/winners/WinnerCard";
import TrophyBanner from "@/components/winners/TrophyBanner";

interface Winner {
  id: string;
  employeeName: string;
  categoryName: string;
  department: string;
  role: string | null;
  month: number;
  year: number;
  finalScore: number;
  averageRating: number;
  totalVotes: number;
  message: string | null;
  publishedAt: string;
}

interface Period {
  month: number;
  year: number;
  publishedAt: string;
  winners: Winner[];
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const CATEGORY_ICONS: Record<string, string> = {
  "Block Machine A": "🧱",
  "Block Machine B": "⚙️",
  "Fencing Posts & Culverts": "🏗️",
  "Non-Machine Production": "🔧",
  "Team Leaders - Production": "🏆",
};

export default function WinnersPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

  useEffect(() => {
    fetch("/api/admin/publish")
      .then(r => r.json())
      .then(d => {
        const p = d.periods ?? [];
        setPeriods(p);
        if (p.length > 0) setSelectedPeriod(p[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="h-[2px] bg-gold-gradient" />
      <AlexonHeader />

      {/* Hero Banner */}
      <TrophyBanner />

      <main className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="skeleton h-64 rounded-2xl" />)}
          </div>
        ) : periods.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card p-16 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="font-display text-2xl font-bold text-dark-50 mb-2">
              No Winners Published Yet
            </h2>
            <p className="text-dark-400">
              Winners will be announced here at the end of each voting period.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Period selector */}
            {periods.length > 1 && (
              <div className="mb-10">
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">
                  Select Month
                </p>
                <div className="flex gap-2 flex-wrap">
                  {periods.map((period) => {
                    const isSelected = selectedPeriod?.month === period.month && selectedPeriod?.year === period.year;
                    return (
                      <motion.button key={`${period.year}-${period.month}`}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedPeriod(period)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isSelected ? "bg-gold-500 text-dark-950" : "bg-surface-card border border-surface-border text-dark-300 hover:border-gold-500/40"}`}>
                        {MONTHS[period.month - 1]} {period.year}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Winners display */}
            <AnimatePresence mode="wait">
              {selectedPeriod && (
                <motion.div key={`${selectedPeriod.year}-${selectedPeriod.month}`}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>

                  {/* Period title */}
                  <div className="text-center mb-10">
                    <p className="text-gold-400 text-sm font-medium uppercase tracking-widest mb-1">
                      Employee of the Month
                    </p>
                    <h2 className="font-display text-4xl font-bold text-dark-50">
                      {MONTHS[selectedPeriod.month - 1]} {selectedPeriod.year}
                    </h2>
                    <div className="gold-line w-32 mx-auto mt-4" />
                    <p className="text-dark-500 text-xs mt-3">
                      Published {new Date(selectedPeriod.publishedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Custom message */}
                  {selectedPeriod.winners[0]?.message && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="glass-card p-5 mb-8 text-center border border-gold-500/20">
                      <p className="text-dark-200 italic text-sm leading-relaxed">
                        "{selectedPeriod.winners[0].message}"
                      </p>
                      <p className="text-dark-500 text-xs mt-2">— Alexon Group Management</p>
                    </motion.div>
                  )}

                  {/* Winner cards grid */}
                  <div className={`grid gap-6 ${selectedPeriod.winners.length === 1 ? "grid-cols-1 max-w-md mx-auto" : selectedPeriod.winners.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                    {selectedPeriod.winners.map((winner, i) => (
                      <WinnerCard
                        key={winner.id}
                        winner={winner}
                        icon={CATEGORY_ICONS[winner.categoryName] ?? "⭐"}
                        delay={i * 0.1}
                        isFirst={i === 0 && selectedPeriod.winners.length === 1}
                      />
                    ))}
                  </div>

                  {/* Congratulations footer */}
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-12 p-6 glass-card border border-gold-500/10">
                    <p className="text-2xl mb-2">🎉</p>
                    <p className="text-dark-300 text-sm">
                      Congratulations to all winners! Your dedication and hard work make Alexon Group proud.
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}
