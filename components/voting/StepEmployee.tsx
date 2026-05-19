// components/voting/StepEmployee.tsx — v9 handles both individual and team selection
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CategoryRecord, EmployeeRecord } from "@/types";
import CardWrapper from "@/components/ui/CardWrapper";
import { DRIVERS_CATEGORY_ID } from "@/components/voting/StepCategory";

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

interface Props {
  category: CategoryRecord;
  voterEmployeeId: string;
  selectedCandidate: EmployeeRecord | null;
  selectedTeam?: Team | null;
  onChange: (candidate: EmployeeRecord) => void;
  onTeamChange?: (team: Team) => void;
  onNext: () => void;
  onBack: () => void;
}

const VEHICLE_ICONS: Record<string, string> = {
  "Water Bowser": "🚒", "MGUU 10": "🚛", "MGUU 6": "🚛",
  "Pickup (New)": "🚙", "Pickup (Old)": "🚙",
  "Backhoe 1": "🚜", "Backhoe 2": "🚜", "Excavator": "⛏️",
};

export default function StepEmployee({ category, voterEmployeeId, selectedCandidate, selectedTeam, onChange, onTeamChange, onNext, onBack }: Props) {
  const isTeamCategory = category.id === DRIVERS_CATEGORY_ID;
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true); setError(null);
    if (isTeamCategory) {
      fetch("/api/teams")
        .then(r => r.json())
        .then(d => { setTeams(d.teams ?? []); })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    } else {
      fetch(`/api/employees?categoryId=${category.id}`)
        .then(r => r.json())
        .then(d => { if (d.error) throw new Error(d.error); setEmployees(d.employees ?? []); })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [category.id, isTeamCategory]);

  // Filter out voter's own team
  const eligibleTeams = teams.filter(t => !t.members.some(m => m.employee.id === voterEmployeeId));
  const eligibleEmployees = employees.filter(e => e.id !== voterEmployeeId);

  const canContinue = isTeamCategory ? !!selectedTeam : !!selectedCandidate;

  return (
    <CardWrapper>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-dark-50">
          {isTeamCategory ? "Select Team" : "Select Candidate"}
        </h2>
        <p className="text-dark-400 mt-1 text-sm">
          {isTeamCategory
            ? `Choose the best performing team from ${category.name}`
            : `Choose one candidate from ${category.name}`}
        </p>
      </div>

      {loading && <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>}
      {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">Failed to load: {error}</div>}

      {!loading && !error && (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">

          {/* ── Team selection (Drivers & Operators) ── */}
          {isTeamCategory && eligibleTeams.map((team, i) => {
            const isSelected = selectedTeam?.id === team.id;
            const icon = VEHICLE_ICONS[team.vehicleType] ?? "🚗";
            return (
              <motion.button key={team.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => onTeamChange && onTeamChange(team)}
                className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-200 ${isSelected ? "border-gold-500 bg-gold-500/10 shadow-gold" : "border-surface-border bg-surface-card hover:border-gold-500/40"}`}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isSelected ? "text-gold-300" : "text-dark-100"}`}>
                      {team.regNumber} — {team.vehicleType}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {team.members.map(m => (
                        <span key={m.employee.id} className="text-xs text-dark-400">
                          <span className="text-dark-500">{m.role}:</span> {m.employee.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-gold-500" : "border-dark-500"}`}>
                    {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                  </div>
                </div>
              </motion.button>
            );
          })}

          {/* ── Individual selection (other categories) ── */}
          {!isTeamCategory && eligibleEmployees.map((emp, i) => {
            const isSelected = selectedCandidate?.id === emp.id;
            return (
              <motion.button key={emp.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => onChange(emp)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 flex items-center gap-4 ${isSelected ? "border-gold-500 bg-gold-500/10 shadow-gold" : "border-surface-border bg-surface-card hover:border-gold-500/40"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isSelected ? "bg-gold-500 text-dark-950" : "bg-surface-border text-dark-300"}`}>
                  {emp.name.split(" ").slice(0,2).map((n:string) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${isSelected ? "text-gold-300" : "text-dark-100"}`}>{emp.name}</p>
                  <p className="text-xs text-dark-400">{emp.role ?? ""} {(emp as any).isLeader ? "· 🏆 Team Leader" : ""}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-gold-500" : "border-dark-500"}`}>
                  {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                </div>
              </motion.button>
            );
          })}

          {!loading && !error && (isTeamCategory ? eligibleTeams.length === 0 : eligibleEmployees.length === 0) && (
            <p className="text-dark-400 text-sm text-center py-8">No candidates available.</p>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onBack} className="btn-outline">← Back</motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onNext}
          disabled={!canContinue} className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
          Continue →
        </motion.button>
      </div>
    </CardWrapper>
  );
}
