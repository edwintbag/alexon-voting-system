// components/admin/LeaderboardTable.tsx — v8 shows total score out of 25
"use client";

import { motion } from "framer-motion";
import { DEPARTMENT_LABELS, Department } from "@/types";

interface Result {
  employeeId: string;
  employeeName: string;
  department: string;
  totalVotes: number;
  totalScore: number;
  maxPossibleScore?: number;
  finalScore: number;
  rank: number;
}

const RANK_BADGES: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const RANK_STYLES: Record<number, string> = {
  1: "text-gold-400 font-bold",
  2: "text-dark-300 font-semibold",
  3: "text-amber-600 font-semibold",
};

export default function LeaderboardTable({ results }: { results: Result[] }) {
  if (results.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-dark-400 text-sm">No votes recorded for this period.</p>
      </div>
    );
  }

  const maxScore = Math.max(...results.map(r => r.finalScore));
  const maxPossible = results[0]?.maxPossibleScore ?? 25;

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold text-dark-400 uppercase tracking-wider border-b border-surface-border">
        <div className="col-span-1">Rank</div>
        <div className="col-span-4">Employee</div>
        <div className="col-span-3 hidden sm:block">Department</div>
        <div className="col-span-2">Votes</div>
        <div className="col-span-2">Score</div>
      </div>

      <div className="divide-y divide-surface-border">
        {results.map((result, i) => {
          const barWidth = maxScore > 0 ? (result.finalScore / maxScore) * 100 : 0;
          return (
            <motion.div key={result.employeeId}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-white/2 transition-colors ${result.rank === 1 ? "bg-gold-500/5" : ""}`}>

              {/* Rank */}
              <div className="col-span-1">
                <span className={`text-sm ${RANK_STYLES[result.rank] ?? "text-dark-400"}`}>
                  {RANK_BADGES[result.rank] ?? `#${result.rank}`}
                </span>
              </div>

              {/* Name */}
              <div className="col-span-4 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${result.rank === 1 ? "bg-gold-500 text-dark-950" : "bg-surface-border text-dark-300"}`}>
                  {result.employeeName.split(" ").slice(0, 2).map((n: string) => n[0]).join("")}
                </div>
                <span className={`text-sm font-medium truncate ${result.rank === 1 ? "text-gold-300" : "text-dark-100"}`}>
                  {result.employeeName}
                </span>
              </div>

              {/* Department */}
              <div className="col-span-3 hidden sm:block">
                <span className="text-xs text-dark-400 truncate">
                  {DEPARTMENT_LABELS[result.department as Department] ?? result.department}
                </span>
              </div>

              {/* Votes + Total Score */}
              <div className="col-span-2">
                <span className="text-sm font-mono text-dark-200">
                  {result.totalVotes} vote{result.totalVotes !== 1 ? "s" : ""}
                </span>
                <div className="text-xs text-dark-500 mt-0.5">
                  {result.totalScore?.toFixed(0) ?? "—"}/{maxPossible} pts
                </div>
              </div>

              {/* Final score + bar */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-mono font-bold ${result.rank === 1 ? "text-gold-400" : "text-dark-200"}`}>
                    {result.finalScore.toFixed(2)}
                  </span>
                </div>
                <div className="h-1 bg-surface-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ delay: 0.2 + i * 0.05, duration: 0.6 }}
                    className={`h-full rounded-full ${result.rank === 1 ? "bg-gold-gradient" : "bg-dark-400"}`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-surface-border">
        <p className="text-xs text-dark-600">
          Final Score = (Total Score × 70%) + (Vote Count × 30% normalized) · Max Score: {maxPossible} pts
        </p>
      </div>
    </div>
  );
}
