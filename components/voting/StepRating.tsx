// components/voting/StepRating.tsx
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
import { computeAvgRating } from "@/lib/scoring";
import CardWrapper from "@/components/ui/CardWrapper";

interface Props {
  category: VoteCategory;
  candidate: EmployeeRecord;
  ratings: RatingMap;
  comment: string;
  onRatingsChange: (ratings: RatingMap) => void;
  onCommentChange: (comment: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const STAR_LABELS = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

function StarRating({
  criterion,
  value,
  onChange,
}: {
  criterion: CriterionDef;
  value: number;
  onChange: (score: number) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="sm:w-64 flex-shrink-0">
        <p className="text-sm font-medium text-dark-100">{criterion.label}</p>
        <p className="text-xs text-dark-500 mt-0.5">{criterion.description}</p>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(star)}
            title={STAR_LABELS[star - 1]}
            className={`rating-btn ${
              star <= value
                ? "bg-gold-500/20 border-gold-500 text-gold-400"
                : "bg-surface-card border-surface-border text-dark-500 hover:border-gold-500/40"
            }`}
          >
            {star <= value ? "★" : "☆"}
          </motion.button>
        ))}
        {value > 0 && (
          <span className="text-xs text-gold-400 ml-1 font-medium">
            {STAR_LABELS[value - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function StepRating({
  category,
  candidate,
  ratings,
  comment,
  onRatingsChange,
  onCommentChange,
  onNext,
  onBack,
}: Props) {
  const criteria =
    category === "TEAM_LEADER" ? LEADER_CRITERIA : PRODUCTION_CRITERIA;

  const allRated = criteria.every(
    (c) => ratings[c.key] && ratings[c.key] >= 1
  );
  const avgRating = computeAvgRating(ratings);

  const handleRatingChange = (key: string, score: number) => {
    onRatingsChange({ ...ratings, [key]: score });
  };

  return (
    <CardWrapper>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-dark-50">
          Rate Performance
        </h2>
        <p className="text-dark-400 mt-1 text-sm">
          Rate{" "}
          <span className="text-gold-400 font-medium">{candidate.name}</span>{" "}
          across each criterion on a scale of 1–5.
        </p>
      </div>

      {/* Average score preview */}
      {avgRating > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 bg-gold-500/10 border border-gold-500/30 rounded-xl flex items-center gap-4"
        >
          <div className="text-3xl font-display font-bold text-gold-400">
            {avgRating.toFixed(1)}
          </div>
          <div>
            <p className="text-sm text-dark-200 font-medium">Current Average</p>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={
                    s <= Math.round(avgRating)
                      ? "text-gold-400 text-sm"
                      : "text-dark-600 text-sm"
                  }
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <p className="ml-auto text-xs text-dark-400">
            {criteria.filter((c) => ratings[c.key]).length}/{criteria.length}{" "}
            criteria rated
          </p>
        </motion.div>
      )}

      {/* Criteria */}
      <div className="space-y-5">
        {criteria.map((criterion, i) => (
          <motion.div
            key={criterion.key}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="p-4 bg-surface-card rounded-xl border border-surface-border"
          >
            <StarRating
              criterion={criterion}
              value={ratings[criterion.key] ?? 0}
              onChange={(score) => handleRatingChange(criterion.key, score)}
            />
          </motion.div>
        ))}
      </div>

      {/* Optional comment */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-dark-200 mb-2">
          Why are you voting for this employee?{" "}
          <span className="text-dark-500 font-normal">(optional)</span>
        </label>
        <textarea
          className="input-field resize-none"
          rows={3}
          placeholder="Share what makes this employee stand out..."
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          maxLength={500}
        />
        <p className="text-xs text-dark-500 mt-1 text-right">
          {comment.length}/500
        </p>
      </div>

      {!allRated && (
        <p className="mt-3 text-xs text-dark-400">
          ⚠️ Please rate all {criteria.length} criteria to continue.
        </p>
      )}

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          className="btn-outline"
        >
          ← Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          disabled={!allRated}
          className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Review Vote →
        </motion.button>
      </div>
    </CardWrapper>
  );
}
