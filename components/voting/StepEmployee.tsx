// components/voting/StepEmployee.tsx — clean, individual candidates only
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CategoryRecord, EmployeeRecord } from "@/types";
import CardWrapper from "@/components/ui/CardWrapper";

interface Props {
  category: CategoryRecord;
  voterEmployeeId: string;
  selectedCandidate: EmployeeRecord | null;
  onChange: (candidate: EmployeeRecord) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepEmployee({ category, voterEmployeeId, selectedCandidate, onChange, onNext, onBack }: Props) {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`/api/employees?categoryId=${category.id}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setEmployees(d.employees ?? []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [category.id]);

  const eligible = employees.filter(e => e.id !== voterEmployeeId);

  return (
    <CardWrapper>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-dark-50">Select Candidate</h2>
        <p className="text-dark-400 mt-1 text-sm">
          Choose one candidate from <span className="text-gold-400">{category.name}</span>
        </p>
      </div>

      {loading && <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>}
      {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">Failed to load: {error}</div>}

      {!loading && !error && (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {eligible.length === 0 ? (
            <p className="text-dark-400 text-sm text-center py-8">No candidates available in this category.</p>
          ) : (
            eligible.map((emp, i) => {
              const isSelected = selectedCandidate?.id === emp.id;
              return (
                <motion.button key={emp.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={() => onChange(emp)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
                    isSelected ? "border-gold-500 bg-gold-500/10 shadow-gold" : "border-surface-border bg-surface-card hover:border-gold-500/40"
                  }`}>
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
            })
          )}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onBack} className="btn-outline">← Back</motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onNext}
          disabled={!selectedCandidate} className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
          Continue →
        </motion.button>
      </div>
    </CardWrapper>
  );
}
