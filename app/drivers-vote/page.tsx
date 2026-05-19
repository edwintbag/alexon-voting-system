// app/drivers-vote/page.tsx — Drivers & Operators team voting
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AlexonHeader from "@/components/ui/AlexonHeader";
import CardWrapper from "@/components/ui/CardWrapper";
import { DRIVER_CRITERIA, VoterInfo, RatingMap } from "@/types";
import { computeTotalScore } from "@/lib/scoring";
import Link from "next/link";

interface TeamMember {
  role: string;
  employee: { id: string; name: string; staffNumber: string; };
}

interface Team {
  id: string;
  name: string;
  regNumber: string;
  vehicleType: string;
  description: string | null;
  members: TeamMember[];
}

const SCORE_LABELS: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: "Poor",      color: "text-red-400",    bg: "bg-red-500/20",    border: "border-red-500" },
  2: { label: "Fair",      color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500" },
  3: { label: "Good",      color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500" },
  4: { label: "Very Good", color: "text-blue-400",   bg: "bg-blue-500/20",   border: "border-blue-500" },
  5: { label: "Excellent", color: "text-green-400",  bg: "bg-green-500/20",  border: "border-green-500" },
};

type Step = "verify" | "select" | "rate" | "review" | "success";

export default function DriversVotePage() {
  const [step, setStep] = useState<Step>("verify");
  const [voterInfo, setVoterInfo] = useState<any>(null);
  const [nameInput, setNameInput] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [ratings, setRatings] = useState<RatingMap>({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hasVoted, setHasVoted] = useState(false);

  // Load teams
  useEffect(() => {
    fetch("/api/teams").then(r => r.json()).then(d => setTeams(d.teams ?? []));
  }, []);

  // Check if already voted
  useEffect(() => {
    if (voterInfo?.employeeId) {
      fetch(`/api/team-votes?voterEmployeeId=${voterInfo.employeeId}`)
        .then(r => r.json()).then(d => setHasVoted(d.hasVoted));
    }
  }, [voterInfo]);

  const handleSearch = async () => {
    const parts = nameInput.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) { setError("Please enter at least your first and last name"); return; }
    setSearching(true); setError(""); setSearched(false);
    const res = await fetch(`/api/employees?search=${encodeURIComponent(nameInput.trim())}`);
    const data = await res.json();
    setMatches(data.employees ?? []);
    setSearched(true);
    setSearching(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true); setError("");
    const res = await fetch("/api/team-votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voterEmployeeId: voterInfo.employeeId,
        teamId: selectedTeam!.id,
        ratings,
        comment: comment || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSubmitting(false); return; }
    setStep("success");
    setSubmitting(false);
  };

  const allRated = DRIVER_CRITERIA.every(c => ratings[c.key] >= 1);
  const totalScore = computeTotalScore(ratings);
  const maxScore = DRIVER_CRITERIA.length * 5;

  const VEHICLE_ICONS: Record<string, string> = {
    "Water Bowser": "🚒",
    "MGUU 10": "🚛",
    "MGUU 6": "🚛",
    "Pickup (New)": "🚙",
    "Pickup (Old)": "🚙",
    "Backhoe 1": "🚜",
    "Backhoe 2": "🚜",
    "Excavator": "⛏️",
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="h-[2px] bg-gold-gradient" />
      <AlexonHeader />

      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-gold-gradient rounded-full items-center justify-center shadow-gold mb-4">
            <span className="text-2xl">🚗</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-dark-50">Drivers & Operators</h1>
          <p className="text-dark-400 text-sm mt-1">Vote for the best performing vehicle or plant team</p>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Verify ─────────────────────── */}
          {step === "verify" && (
            <motion.div key="verify" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <CardWrapper>
                <h2 className="font-display text-xl font-bold text-dark-50 mb-4">Verify Your Identity</h2>
                <div className="flex gap-3 mb-4">
                  <input type="text" className="input-field flex-1"
                    placeholder="Enter your full name..."
                    value={nameInput}
                    onChange={(e) => { setNameInput(e.target.value); setSearched(false); setMatches([]); setVoterInfo(null); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                  <button onClick={handleSearch} disabled={searching} className="btn-gold whitespace-nowrap">
                    {searching ? "Searching..." : "Find Me"}
                  </button>
                </div>

                {error && <p className="text-red-400 text-sm mb-3">❌ {error}</p>}

                {/* Matches */}
                {matches.length > 0 && !voterInfo && (
                  <div className="space-y-2 mb-4">
                    {matches.map(emp => (
                      <motion.button key={emp.id} whileHover={{ scale: 1.01 }}
                        onClick={() => { setVoterInfo({ employeeId: emp.id, employeeName: emp.name, staffNumber: emp.staffNumber }); setMatches([]); }}
                        className="w-full text-left px-4 py-3 rounded-xl border border-surface-border bg-surface-card hover:border-gold-500/50 transition-all flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gold-500/20 flex items-center justify-center text-xs font-bold text-gold-400">
                          {emp.name.split(" ").slice(0,2).map((n: string) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-dark-100">{emp.name}</p>
                          <p className="text-xs text-dark-400 font-mono">{emp.staffNumber}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {searched && matches.length === 0 && (
                  <p className="text-dark-400 text-sm mb-4">No employee found matching "{nameInput}"</p>
                )}

                {/* Verified */}
                {voterInfo && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 mb-4">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="text-sm font-semibold text-green-400">Identity Verified</p>
                      <p className="text-dark-200 text-sm">{voterInfo.employeeName}</p>
                    </div>
                  </motion.div>
                )}

                {hasVoted && voterInfo && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm mb-4">
                    ⚠️ You have already voted in the Drivers & Operators category this month.
                  </div>
                )}

                <div className="flex justify-end">
                  <button onClick={() => setStep("select")}
                    disabled={!voterInfo || hasVoted}
                    className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed">
                    Continue →
                  </button>
                </div>
              </CardWrapper>
            </motion.div>
          )}

          {/* ── Step 2: Select Team ─────────────────── */}
          {step === "select" && (
            <motion.div key="select" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <CardWrapper>
                <h2 className="font-display text-xl font-bold text-dark-50 mb-2">Select Team</h2>
                <p className="text-dark-400 text-sm mb-6">Choose the best performing vehicle or plant team.</p>

                <div className="space-y-3">
                  {teams.map((team, i) => {
                    const isSelected = selectedTeam?.id === team.id;
                    const isMember = team.members.some(m => m.employee.id === voterInfo?.employeeId);
                    const icon = VEHICLE_ICONS[team.vehicleType] ?? "🚗";

                    return (
                      <motion.button key={team.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        onClick={() => !isMember && setSelectedTeam(team)}
                        disabled={isMember}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                          isMember ? "border-surface-border bg-surface-card/50 opacity-50 cursor-not-allowed" :
                          isSelected ? "border-gold-500 bg-gold-500/10 shadow-gold" :
                          "border-surface-border bg-surface-card hover:border-gold-500/40"
                        }`}>
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`font-semibold ${isSelected ? "text-gold-300" : "text-dark-100"}`}>
                                  {team.regNumber} — {team.vehicleType}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {team.members.map(m => (
                                    <span key={m.employee.id} className="text-xs text-dark-400">
                                      {m.role}: <span className="text-dark-200">{m.employee.name.split(" ")[0]}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {!isMember && (
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-gold-500" : "border-dark-500"}`}>
                                  {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                                </div>
                              )}
                            </div>
                            {isMember && <p className="text-xs text-dark-500 mt-1">You are a member of this team</p>}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep("verify")} className="btn-outline">← Back</button>
                  <button onClick={() => setStep("rate")} disabled={!selectedTeam} className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed">Continue →</button>
                </div>
              </CardWrapper>
            </motion.div>
          )}

          {/* ── Step 3: Rate ────────────────────────── */}
          {step === "rate" && (
            <motion.div key="rate" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <CardWrapper>
                <h2 className="font-display text-xl font-bold text-dark-50 mb-1">Rate Performance</h2>
                <p className="text-dark-400 text-sm mb-6">
                  Rating team: <span className="text-gold-400 font-semibold">{selectedTeam?.regNumber} — {selectedTeam?.vehicleType}</span>
                </p>

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <p className="text-xs text-dark-400">{Object.keys(ratings).length} of {DRIVER_CRITERIA.length} rated</p>
                    {totalScore > 0 && <span className="text-sm font-mono font-bold text-gold-400">{totalScore}/{maxScore}</span>}
                  </div>
                  <div className="h-2 bg-surface-border rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${(Object.keys(ratings).length / DRIVER_CRITERIA.length) * 100}%` }}
                      className="h-full bg-gold-gradient rounded-full" />
                  </div>
                </div>

                {/* Score legend */}
                <div className="flex gap-2 flex-wrap mb-6 p-3 bg-surface-card rounded-xl border border-surface-border">
                  {Object.entries(SCORE_LABELS).map(([score, style]) => (
                    <div key={score} className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold border ${style.border} ${style.bg} ${style.color}`}>{score}</span>
                      <span className="text-xs text-dark-400">{style.label}</span>
                    </div>
                  ))}
                </div>

                {/* Criteria cards */}
                <div className="space-y-4">
                  {DRIVER_CRITERIA.map((criterion, i) => {
                    const value = ratings[criterion.key] ?? 0;
                    const selected = SCORE_LABELS[value];
                    const isRated = value > 0;
                    return (
                      <motion.div key={criterion.key}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`rounded-xl border-2 p-5 transition-all duration-200 ${isRated ? `${selected.border} ${selected.bg}` : "border-surface-border bg-surface-card"}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border ${isRated ? `${selected.border} ${selected.color}` : "border-dark-500 text-dark-500"}`}>{i + 1}</span>
                              <h3 className={`font-semibold text-sm ${isRated ? selected.color : "text-dark-100"}`}>{criterion.label}</h3>
                            </div>
                            <p className="text-xs text-dark-400 ml-7">{criterion.description}</p>
                          </div>
                          {isRated && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className={`ml-3 flex-shrink-0 px-2.5 py-1 rounded-lg border ${selected.border} ${selected.bg}`}>
                              <p className={`text-xs font-bold ${selected.color}`}>{value}/5</p>
                              <p className={`text-xs ${selected.color}`}>{selected.label}</p>
                            </motion.div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map(score => {
                            const s = SCORE_LABELS[score];
                            const isSel = value === score;
                            return (
                              <motion.button key={score} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                                onClick={() => setRatings({ ...ratings, [criterion.key]: score })}
                                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${isSel ? `${s.border} ${s.bg} shadow-md` : "border-surface-border bg-dark-900 hover:border-dark-400"}`}>
                                <span className={`text-lg font-bold ${isSel ? s.color : "text-dark-300"}`}>{score}</span>
                                <span className={`text-xs font-medium text-center ${isSel ? s.color : "text-dark-500"}`}>{s.label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Comment */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-dark-200 mb-2">Comment <span className="text-dark-500 text-xs">(optional)</span></label>
                  <textarea className="input-field resize-none" rows={3}
                    placeholder="Why is this team outstanding?" value={comment}
                    onChange={(e) => setComment(e.target.value)} maxLength={500} />
                </div>

                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep("select")} className="btn-outline">← Back</button>
                  <button onClick={() => setStep("review")} disabled={!allRated} className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed">Review →</button>
                </div>
              </CardWrapper>
            </motion.div>
          )}

          {/* ── Step 4: Review ──────────────────────── */}
          {step === "review" && (
            <motion.div key="review" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <CardWrapper>
                <h2 className="font-display text-xl font-bold text-dark-50 mb-6">Review & Submit</h2>

                <div className="space-y-4">
                  <div className="p-4 bg-surface-card rounded-xl border border-surface-border">
                    <p className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-3">Your Vote</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🏆</span>
                      <div>
                        <p className="font-semibold text-dark-100">{selectedTeam?.regNumber} — {selectedTeam?.vehicleType}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedTeam?.members.map(m => (
                            <span key={m.employee.id} className="text-xs text-dark-400">
                              {m.role}: <span className="text-gold-400">{m.employee.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-card rounded-xl border border-surface-border">
                    <p className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-3">Ratings</p>
                    {DRIVER_CRITERIA.map(c => (
                      <div key={c.key} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-dark-300">{c.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${SCORE_LABELS[ratings[c.key]]?.bg} ${SCORE_LABELS[ratings[c.key]]?.color}`}>
                            {SCORE_LABELS[ratings[c.key]]?.label}
                          </span>
                          <span className="text-gold-400 text-xs font-mono font-bold">{ratings[c.key]}/5</span>
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-surface-border flex justify-between">
                      <span className="font-semibold text-dark-200">Total Score</span>
                      <span className="text-gold-400 font-bold font-mono text-lg">{totalScore}/{maxScore}</span>
                    </div>
                  </div>

                  {comment && (
                    <div className="p-4 bg-surface-card rounded-xl border border-surface-border">
                      <p className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-2">Comment</p>
                      <p className="text-sm text-dark-300 italic">"{comment}"</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">❌ {error}</div>
                )}

                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep("rate")} disabled={submitting} className="btn-outline">← Back</button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="btn-gold min-w-[140px] flex items-center justify-center gap-2">
                    {submitting ? "Submitting..." : "Submit Vote ✓"}
                  </button>
                </div>
              </CardWrapper>
            </motion.div>
          )}

          {/* ── Step 5: Success ─────────────────────── */}
          {step === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-10 text-center shadow-gold-lg">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                className="w-16 h-16 mx-auto mb-6 bg-gold-gradient rounded-full flex items-center justify-center shadow-gold">
                <span className="text-3xl">🏆</span>
              </motion.div>
              <h1 className="font-display text-2xl font-bold text-dark-50 mb-2">Vote Submitted!</h1>
              <p className="text-dark-400 mb-1">You voted for</p>
              <p className="text-gold-400 font-semibold text-lg mb-1">
                {selectedTeam?.regNumber} — {selectedTeam?.vehicleType}
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {selectedTeam?.members.map(m => (
                  <span key={m.employee.id} className="text-xs px-2 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400">
                    {m.employee.name}
                  </span>
                ))}
              </div>
              <div className="gold-line mb-6" />
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/vote"><button className="btn-gold">Back to Main Voting</button></Link>
                <Link href="/"><button className="btn-outline">Home</button></Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
