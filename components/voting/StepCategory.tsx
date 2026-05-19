// components/voting/StepCategory.tsx — v9 includes Drivers & Operators
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CategoryRecord } from "@/types";
import CardWrapper from "@/components/ui/CardWrapper";

interface Props {
  selectedCategory: CategoryRecord | null;
  voterEmployeeId: string;
  onChange: (cat: CategoryRecord) => void;
  onNext: () => void;
  onBack: () => void;
}

const CATEGORY_ICONS = ["🧱", "⚙️", "🏗️", "🔧", "🏆", "🚛", "⛏️", "🌱"];

// Special drivers category marker
export const DRIVERS_CATEGORY_ID = "drivers-and-operators";

export const DRIVERS_CATEGORY: CategoryRecord = {
  id: DRIVERS_CATEGORY_ID,
  name: "Drivers & Operators",
  description: "Vote for the best performing vehicle or plant team",
  order: 99,
  isActive: true,
  isTeamCategory: true,
};

export default function StepCategory({ selectedCategory, voterEmployeeId, onChange, onNext, onBack }: Props) {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [hasVotedDrivers, setHasVotedDrivers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamCount, setTeamCount] = useState(0);
  const [progress, setProgress] = useState<{ votedCount: number; totalCategories: number } | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [catRes, teamsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/teams"),
      ]);
      const catData = await catRes.json();
      const teamsData = await teamsRes.json();
      setCategories(catData.categories ?? []);
      setTeamCount(teamsData.teams?.length ?? 0);

      if (voterEmployeeId) {
        const [progRes, driverRes] = await Promise.all([
          fetch(`/api/votes/progress?voterEmployeeId=${voterEmployeeId}`),
          fetch(`/api/team-votes?voterEmployeeId=${voterEmployeeId}`),
        ]);
        const progData = await progRes.json();
        const driverData = await driverRes.json();
        setVotedIds(new Set((progData.progress ?? []).filter((p: any) => p.hasVoted).map((p: any) => p.id)));
        setHasVotedDrivers(driverData.hasVoted ?? false);
        setProgress({ votedCount: progData.votedCount + (driverData.hasVoted ? 1 : 0), totalCategories: progData.totalCategories + 1 });
      }
      setLoading(false);
    };
    fetchAll();
  }, [voterEmployeeId]);

  // All categories including drivers
  const allCategories = [...categories, DRIVERS_CATEGORY];
  const totalCategories = allCategories.length;
  const votedCount = (progress?.votedCount ?? 0);

  return (
    <CardWrapper>
      <div className="mb-4">
        <h2 className="font-display text-2xl font-bold text-dark-50">Select Category</h2>
        <p className="text-dark-400 mt-1 text-sm">Vote once per category. Complete all categories to finish.</p>
      </div>

      {/* Progress bar */}
      {progress && (
        <div className="mb-5 p-3 bg-surface-card rounded-xl border border-surface-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-dark-400">Your overall progress</p>
            <span className={`text-xs font-semibold ${votedCount === totalCategories ? "text-green-400" : "text-gold-400"}`}>
              {votedCount}/{totalCategories} voted
            </span>
          </div>
          <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }}
              animate={{ width: `${(votedCount / totalCategories) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gold-gradient rounded-full" />
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {allCategories.map((cat, i) => {
            const isSelected = selectedCategory?.id === cat.id;
            const hasVoted = cat.id === DRIVERS_CATEGORY_ID ? hasVotedDrivers : votedIds.has(cat.id);
            const isTeam = (cat as any).isTeamCategory;
            const icon = isTeam ? "🚗" : CATEGORY_ICONS[i % CATEGORY_ICONS.length];

            return (
              <motion.button key={cat.id}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: hasVoted ? 1 : 1.01 }}
                whileTap={{ scale: hasVoted ? 1 : 0.99 }}
                onClick={() => !hasVoted && onChange(cat)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  hasVoted ? "border-green-500/40 bg-green-500/5 cursor-not-allowed" :
                  isSelected ? "border-gold-500 bg-gold-500/10 shadow-gold" :
                  "border-surface-border bg-surface-card hover:border-gold-500/40"
                }`}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{hasVoted ? "✅" : icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold text-base ${hasVoted ? "text-green-400" : isSelected ? "text-gold-300" : "text-dark-100"}`}>
                        {cat.name}
                      </h3>
                      {hasVoted ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Voted ✓</span>
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-gold-500" : "border-dark-500"}`}>
                          {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                        </div>
                      )}
                    </div>
                    {cat.description && <p className="text-dark-400 text-sm mt-0.5">{cat.description}</p>}
                    <p className="text-dark-500 text-xs mt-1">
                      {isTeam ? (
                        <span className="text-gold-500/70">🚗 {teamCount} teams competing</span>
                      ) : (
                        `${cat._count?.members ?? 0} candidates`
                      )}
                      {hasVoted && <span className="ml-2 text-green-500">· Already voted this month</span>}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onBack} className="btn-outline">← Back</motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onNext}
          disabled={!selectedCategory || (selectedCategory.id !== DRIVERS_CATEGORY_ID && votedIds.has(selectedCategory?.id ?? "")) || (selectedCategory.id === DRIVERS_CATEGORY_ID && hasVotedDrivers)}
          className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
          Continue →
        </motion.button>
      </div>
    </CardWrapper>
  );
}
