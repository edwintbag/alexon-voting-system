// components/voting/StepRating.tsx — Option A with Total Score display
"use client";

import { motion } from "framer-motion";
import {
  VoteCategory,
  EmployeeRecord,
  RatingMap,
  CriterionDef,
  PRODUCTION_CRITERIA,
  LEADER_CRITERIA,
} from "@/types";
import { computeTotalScore, MAX_TOTAL_SCORE } from "@/lib/scoring";
import { DRIVER_CRITERIA } from "@/types";
import CardWrapper from "@/components/ui/CardWrapper";

interface Props {
  category: VoteCategory | string;
  candidate: EmployeeRecord;
  ratings: RatingMap;
  comment: string;
  onRatingsChange: (ratings: RatingMap) => void;
  onCommentChange: (comment: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const SCORE_LABELS: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: "Poor",      color: "text-red-400",    bg: "bg-red-500/20",    border: "border-red-500" },
  2: { label: "Fair",      color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500" },
  3: { label: "Good",      color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500" },
  4: { label: "Very Good", color: "text-blue-400",   bg: "bg-blue-500/20",   border: "border-blue-500" },
  5: { label: "Excellent", color: "text-green-400",  bg: "bg-green-500/20",  border: "border-green-500" },
};

function CriterionCard({ criterion, value, index, onChange }: {
  criterion: CriterionDef; value: number; index: number; onChange: (score: number) => void;
}) {
  const selected = SCORE_LABELS[value];
  const isRated = value > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-xl border-2 p-5 transition-all duration-200 ${
        isRated ? `${selected.border} ${selected.bg}` : "border-surface-border bg-surface-card"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border ${isRated ? `${selected.border} ${selected.color}` : "border-dark-500 text-dark-500"}`}>
              {index + 1}
            </span>
            <h3 className={`font-semibold text-sm ${isRated ? selected.color : "text-dark-100"}`}>
              {criterion.label}
            </h3>
          </div>
          <p className="text-xs text-dark-400 ml-7">{criterion.description}</p>
        </div>
        {isRated && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className={`ml-3 flex-shrink-0 px-2.5 py-1 rounded-lg border ${selected.border} ${selected.bg}`}>
            <p className={`text-xs font-bold ${selected.color}`}>{value}/5</p>
            <p className={`text-xs ${selected.color} whitespace-nowrap`}>{selected.label}</p>
          </motion.div>
        )}
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((score) => {
          const isSelected = value === score;
          const scoreStyle = SCORE_LABELS[score];
          return (
            <motion.button key={score} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
              onClick={() => onChange(score)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all duration-200 ${
                isSelected ? `${scoreStyle.border} ${scoreStyle.bg} shadow-md` : "border-surface-border bg-dark-900 hover:border-dark-400"
              }`}>
              <span className={`text-lg font-bold ${isSelected ? scoreStyle.color : "text-dark-300"}`}>{score}</span>
              <span className={`text-xs font-medium leading-tight text-center ${isSelected ? scoreStyle.color : "text-dark-500"}`}>
                {scoreStyle.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function StepRating({ category, candidate, ratings, comment, onRatingsChange, onCommentChange, onNext, onBack }: Props) {
  const isLeader = typeof category === "string" && category === "TEAM_LEADER";
  const isDriver = typeof category === "string" && category === "DRIVER";
  const criteria = isDriver ? DRIVER_CRITERIA : isLeader ? LEADER_CRITERIA : PRODUCTION_CRITERIA;

  const allRated = criteria.every((c) => ratings[c.key] && ratings[c.key] >= 1);
  const ratedCount = criteria.filter((c) => ratings[c.key] && ratings[c.key] >= 1).length;
  const totalScore = computeTotalScore(ratings);
  const maxScore = criteria.length * 5; // e.g. 5 × 5 = 25

  return (
    <CardWrapper>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-dark-50">Rate Performance</h2>
        <p className="text-dark-400 mt-1 text-sm">
          Rate <span className="text-gold-400 font-semibold">{candidate.name}</span> across each criterion below.
        </p>
      </div>

      {/* Progress + Total Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-dark-400">{ratedCount} of {criteria.length} criteria rated</p>
          {totalScore > 0 && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-dark-400">Total Score:</p>
              <span className={`text-sm font-bold font-mono ${
                totalScore >= 22 ? "text-green-400" :
                totalScore >= 17 ? "text-blue-400" :
                totalScore >= 12 ? "text-yellow-400" :
                totalScore >= 7  ? "text-orange-400" : "text-red-400"
              }`}>
                {totalScore} / {maxScore}
              </span>
            </div>
          )}
        </div>
        <div className="h-2 bg-surface-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(ratedCount / criteria.length) * 100}%` }}
            transition={{ duration: 0.4 }}
            className="h-full bg-gold-gradient rounded-full"
          />
        </div>
      </div>

      {/* Score legend */}
      <div className="flex gap-2 flex-wrap mb-6 p-3 bg-surface-card rounded-xl border border-surface-border">
        {Object.entries(SCORE_LABELS).map(([score, style]) => (
          <div key={score} className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold border ${style.border} ${style.bg} ${style.color}`}>
              {score}
            </span>
            <span className="text-xs text-dark-400">{style.label}</span>
          </div>
        ))}
      </div>

      {/* Criterion cards */}
      <div className="space-y-4">
        {criteria.map((criterion, i) => (
          <CriterionCard
            key={criterion.key}
            criterion={criterion}
            value={ratings[criterion.key] ?? 0}
            index={i}
            onChange={(score) => onRatingsChange({ ...ratings, [criterion.key]: score })}
          />
        ))}
      </div>

      {/* Comment */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-dark-200 mb-2">
          Why are you voting for this employee?{" "}
          <span className="text-dark-500 font-normal text-xs">(optional)</span>
        </label>
        <textarea className="input-field resize-none" rows={3}
          placeholder="Share what makes this employee stand out..."
          value={comment} onChange={(e) => onCommentChange(e.target.value)} maxLength={500} />
        <p className="text-xs text-dark-500 mt-1 text-right">{comment.length}/500</p>
      </div>

      {!allRated && ratedCount > 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-gold-400">
          ⚠️ Please rate all {criteria.length} criteria to continue.
        </motion.p>
      )}

      <div className="mt-8 flex justify-between">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onBack} className="btn-outline">← Back</motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onNext}
          disabled={!allRated} className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
          Review Vote →
        </motion.button>
      </div>
    </CardWrapper>
  );
}
