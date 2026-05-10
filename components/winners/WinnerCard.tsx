// components/winners/WinnerCard.tsx
"use client";

import { motion } from "framer-motion";
import { DEPARTMENT_LABELS, Department } from "@/types";

interface Winner {
  employeeName: string;
  categoryName: string;
  department: string;
  role: string | null;
  finalScore: number;
  averageRating: number;
  totalVotes: number;
}

interface Props {
  winner: Winner;
  icon: string;
  delay?: number;
  isFirst?: boolean;
}

export default function WinnerCard({ winner, icon, delay = 0, isFirst = false }: Props) {
  const initials = winner.employeeName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className={`relative glass-card overflow-hidden ${isFirst ? "border-2 border-gold-500 shadow-gold-lg" : "border border-gold-500/30"}`}
    >
      {/* Top gold bar */}
      <div className="h-1.5 bg-gold-gradient w-full" />

      {/* Category badge */}
      <div className="absolute top-4 right-4">
        <span className="text-2xl">{icon}</span>
      </div>

      {/* Winner badge for featured */}
      {isFirst && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.3 }}
          className="absolute top-4 left-4"
        >
          <span className="text-xs px-2 py-1 rounded-full bg-gold-500 text-dark-950 font-bold">
            ⭐ Winner
          </span>
        </motion.div>
      )}

      <div className="p-6 pt-10">
        {/* Photo placeholder / Avatar */}
        <div className="flex flex-col items-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold font-display mb-4 relative ${isFirst ? "bg-gold-gradient text-dark-950 shadow-gold" : "bg-surface-card border-2 border-gold-500/40 text-gold-400"}`}
          >
            {initials}

            {/* Shimmer ring for featured */}
            {isFirst && (
              <div className="absolute inset-0 rounded-full border-2 border-gold-300/50 animate-pulse" />
            )}
          </motion.div>

          {/* Photo placeholder label */}
          <p className="text-xs text-dark-600 mb-1">📷 Photo coming soon</p>
        </div>

        {/* Name & details */}
        <div className="text-center mb-5">
          <h3 className={`font-display font-bold text-xl mb-1 ${isFirst ? "text-gold-300" : "text-dark-50"}`}>
            {winner.employeeName}
          </h3>
          <p className="text-dark-400 text-sm">{winner.role ?? "Production Staff"}</p>
          <p className="text-dark-500 text-xs mt-0.5">
            {DEPARTMENT_LABELS[winner.department as Department] ?? winner.department}
          </p>
        </div>

        {/* Category */}
        <div className="text-center mb-5">
          <span className="text-xs px-3 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 font-medium">
            {winner.categoryName}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-surface-border">
          <div className="text-center">
            <p className="text-gold-400 font-bold font-mono text-lg">
              {winner.finalScore.toFixed(1)}
            </p>
            <p className="text-dark-500 text-xs mt-0.5">Score</p>
          </div>
          <div className="text-center border-x border-surface-border">
            <p className="text-gold-400 font-bold font-mono text-lg">
              {winner.averageRating.toFixed(1)}
            </p>
            <p className="text-dark-500 text-xs mt-0.5">Rating</p>
          </div>
          <div className="text-center">
            <p className="text-gold-400 font-bold font-mono text-lg">
              {winner.totalVotes}
            </p>
            <p className="text-dark-500 text-xs mt-0.5">Votes</p>
          </div>
        </div>

        {/* Star rating display */}
        <div className="flex justify-center gap-0.5 mt-3">
          {[1,2,3,4,5].map(s => (
            <span key={s} className={`text-base ${s <= Math.round(winner.averageRating) ? "text-gold-400" : "text-dark-700"}`}>
              ★
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
