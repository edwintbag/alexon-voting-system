// components/voting/SuccessScreen.tsx — v7 guided flow
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Props {
  candidateName: string;
  categoryName: string;
  voterEmployeeId: string;
  onRestart: () => void;
  onNextCategory: (categoryId: string, categoryName: string) => void;
}

interface ProgressItem {
  id: string;
  name: string;
  hasVoted: boolean;
}

interface Progress {
  progress: ProgressItem[];
  totalCategories: number;
  votedCount: number;
  allDone: boolean;
  nextCategory: { id: string; name: string } | null;
}

export default function SuccessScreen({ candidateName, categoryName, voterEmployeeId, onRestart, onNextCategory }: Props) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!voterEmployeeId) { setLoading(false); return; }
    fetch(`/api/votes/progress?voterEmployeeId=${voterEmployeeId}`)
      .then(r => r.json()).then(setProgress).finally(() => setLoading(false));
  }, [voterEmployeeId]);

  const allDone = progress?.allDone ?? false;
  const votedCount = progress?.votedCount ?? 0;
  const totalCategories = progress?.totalCategories ?? 0;
  const nextCategory = progress?.nextCategory ?? null;

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,151,44,0.12)_0%,transparent_60%)]" />

      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: [0, 1, 0], y: [0, 300 + Math.random() * 200] }}
          transition={{ delay: Math.random() * 1.5, duration: 2 + Math.random() * 2 }}
          className="absolute top-0 w-2 h-2 rounded-full"
          style={{ background: i % 3 === 0 ? "#C9972C" : i % 3 === 1 ? "#f0c040" : "#fff", left: `${20 + Math.random() * 60}%` }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card p-8 max-w-lg w-full text-center relative z-10 shadow-gold-lg"
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="w-16 h-16 mx-auto mb-4 bg-gold-gradient rounded-full flex items-center justify-center shadow-gold">
          <span className="text-3xl">🏆</span>
        </motion.div>

        <h1 className="font-display text-2xl font-bold text-dark-50 mb-1">Vote Submitted!</h1>
        <p className="text-dark-400 text-sm">
          You voted for <span className="text-gold-400 font-semibold">{candidateName}</span>
        </p>
        <p className="text-dark-500 text-xs mt-0.5">in {categoryName}</p>

        {/* Progress tracker */}
        {!loading && progress && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-4 bg-surface-card rounded-xl border border-surface-border text-left">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-dark-300 uppercase tracking-wider">Your Voting Progress</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${allDone ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gold-500/20 text-gold-400 border-gold-500/30"}`}>
                {votedCount}/{totalCategories}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-surface-border rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(votedCount / totalCategories) * 100}%` }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="h-full bg-gold-gradient rounded-full"
              />
            </div>

            {/* Category checklist */}
            <div className="space-y-1.5">
              {progress.progress.map((cat) => (
                <div key={cat.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${cat.hasVoted ? "bg-green-500/10 text-green-400" : "text-dark-500"}`}>
                  <span className="text-base">{cat.hasVoted ? "✅" : "⭕"}</span>
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="gold-line my-5" />

        {/* Action buttons */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }} className="flex flex-col gap-3">

          {allDone ? (
            <>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-semibold text-sm">🎉 You've voted in all {totalCategories} categories!</p>
                <p className="text-dark-400 text-xs mt-0.5">Thank you for participating this month.</p>
              </div>
              <Link href="/winners">
                <button className="btn-gold w-full">View Winners Page →</button>
              </Link>
              <Link href="/"><button className="btn-outline w-full">Back to Home</button></Link>
            </>
          ) : nextCategory ? (
            <>
              <p className="text-dark-400 text-xs text-center">
                <span className="text-gold-400 font-semibold">{totalCategories - votedCount}</span> more{" "}
                {totalCategories - votedCount === 1 ? "category" : "categories"} remaining
              </p>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => onNextCategory(nextCategory.id, nextCategory.name)}
                className="btn-gold flex items-center justify-center gap-2">
                Next: {nextCategory.name} →
              </motion.button>
              <button onClick={onRestart} className="btn-outline text-sm">Choose Category Manually</button>
            </>
          ) : (
            <button onClick={onRestart} className="btn-gold">Vote in Another Category</button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
