// components/voting/StepSubmit.tsx — v8 shows total score
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { VoteFormState, PRODUCTION_CRITERIA, LEADER_CRITERIA, DRIVER_CRITERIA } from "@/types";
import { computeTotalScore } from "@/lib/scoring";
import CardWrapper from "@/components/ui/CardWrapper";

const SCORE_LABELS: Record<number, string> = {
  1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent",
};

interface Team {
  id: string; name: string; regNumber: string; vehicleType: string;
  members: { role: string; employee: { id: string; name: string; staffNumber: string; } }[];
}
interface Props { formState: any; selectedTeam?: Team | null; onBack: () => void; onSuccess: (name: string) => void; }

export default function StepSubmit({ formState, onBack, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { voterInfo, selectedCategory, selectedCandidate, ratings, comment } = formState;
  const isDriversCategory = selectedCategory?.id === "drivers-and-operators";
  const isLeader = selectedCategory?.name?.toLowerCase().includes("leader") ?? false;
  const isDriver = selectedCategory?.id === "drivers-and-operators";
  const criteria = isDriver ? DRIVER_CRITERIA : isLeader ? LEADER_CRITERIA : PRODUCTION_CRITERIA;
  const totalScore = computeTotalScore(ratings);
  const maxScore = criteria.length * 5;

  const handleSubmit = async () => {
    if (!selectedCandidate || !selectedCategory || !voterInfo?.employeeId) return;
    setIsSubmitting(true); setError(null);
    try {
      // Team vote or individual vote
      const isTeamVote = selectedCategory?.id === "drivers-and-operators";
      const endpoint = isTeamVote ? "/api/team-votes" : "/api/votes";
      const payload = isTeamVote
        ? { voterEmployeeId: voterInfo.employeeId, teamId: selectedTeam?.id, ratings, comment: comment || undefined }
        : { voterEmployeeId: voterInfo.employeeId, candidateId: selectedCandidate?.id, categoryId: selectedCategory?.id, ratings, comment: comment || undefined };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit vote");
      const winnerName = isTeamVote
        ? (selectedTeam ? `${selectedTeam.regNumber} — ${selectedTeam.vehicleType}` : "Team")
        : (selectedCandidate?.name ?? "");
      onSuccess(winnerName);
    } catch (e: any) { setError(e.message); }
    finally { setIsSubmitting(false); }
  };

  return (
    <CardWrapper>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-dark-50">Review & Submit</h2>
        <p className="text-dark-400 mt-1 text-sm">Please review your vote carefully before submitting.</p>
      </div>

      <div className="space-y-4">
        <Section title="Your Identity">
          <Row label="Name" value={voterInfo?.employeeName ?? ""} />
          <Row label="Staff No." value={voterInfo?.staffNumber ?? ""} />
        </Section>

        <Section title="Your Vote">
          <Row label="Category" value={selectedCategory?.name ?? ""} highlight />
          {isDriversCategory && selectedTeam ? (
            <>
              <Row label="Team" value={`${selectedTeam.regNumber} — ${selectedTeam.vehicleType}`} highlight />
              {selectedTeam.members.map(m => (
                <Row key={m.employee.id} label={m.role} value={m.employee.name} />
              ))}
            </>
          ) : (
            <Row label="Voting For" value={selectedCandidate?.name ?? ""} highlight />
          )}
        </Section>

        <Section title="Ratings Given">
          {criteria.map(c => (
            <div key={c.key} className="flex items-center justify-between py-1">
              <span className="text-sm text-dark-300">{c.label}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  ratings[c.key] === 5 ? "bg-green-500/20 text-green-400" :
                  ratings[c.key] === 4 ? "bg-blue-500/20 text-blue-400" :
                  ratings[c.key] === 3 ? "bg-yellow-500/20 text-yellow-400" :
                  ratings[c.key] === 2 ? "bg-orange-500/20 text-orange-400" :
                  "bg-red-500/20 text-red-400"
                }`}>
                  {SCORE_LABELS[ratings[c.key]] ?? "—"}
                </span>
                <span className="text-gold-400 text-xs font-mono font-bold">{ratings[c.key]}/5</span>
              </div>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between">
            <span className="text-sm font-semibold text-dark-200">Total Score</span>
            <span className="text-gold-400 font-bold font-mono text-lg">
              {totalScore} / {maxScore}
            </span>
          </div>
        </Section>

        {comment && (
          <Section title="Your Comment">
            <p className="text-sm text-dark-300 italic">"{comment}"</p>
          </Section>
        )}
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          ❌ {error}
        </motion.div>
      )}

      <div className="mt-8 flex justify-between">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onBack} disabled={isSubmitting} className="btn-outline">← Back</motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={isSubmitting}
          className="btn-gold min-w-[140px] flex items-center justify-center gap-2">
          {isSubmitting ? (
            <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Submitting...</>
          ) : "Submit Vote ✓"}
        </motion.button>
      </div>
    </CardWrapper>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 bg-surface-card rounded-xl border border-surface-border">
      <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-dark-400">{label}</span>
      <span className={`text-sm font-medium ${highlight ? "text-gold-300" : "text-dark-100"}`}>{value}</span>
    </div>
  );
}
