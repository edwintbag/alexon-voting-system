// components/voting/StepVoterInfo.tsx — Name verification against employee DB
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoterInfo } from "@/types";
import CardWrapper from "@/components/ui/CardWrapper";

interface Props {
  voterInfo: VoterInfo | null;
  onChange: (info: VoterInfo) => void;
  onNext: () => void;
}

interface EmployeeMatch {
  id: string; name: string; staffNumber: string; department: string; role: string | null;
}

export default function StepVoterInfo({ voterInfo, onChange, onNext }: Props) {
  const [nameInput, setNameInput] = useState(voterInfo?.employeeName ?? "");
  const [matches, setMatches] = useState<EmployeeMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const parts = nameInput.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) { setError("Please enter at least your first and last name"); return; }
    setSearching(true); setError(""); setSearched(false);
    try {
      const res = await fetch(`/api/employees?search=${encodeURIComponent(nameInput.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Search failed"); setMatches([]); }
      else { setMatches(data.employees ?? []); setSearched(true); }
    } catch { setError("Connection error. Please try again."); }
    finally { setSearching(false); }
  };

  const selectEmployee = (emp: EmployeeMatch) => {
    onChange({ employeeId: emp.id, employeeName: emp.name, staffNumber: emp.staffNumber, department: emp.department as any });
    setMatches([]);
  };

  return (
    <CardWrapper>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-dark-50">Verify Your Identity</h2>
        <p className="text-dark-400 mt-1 text-sm">Enter your name to confirm you are an Alexon Group employee.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">Your Full Name <span className="text-gold-400">*</span></label>
          <div className="flex gap-3">
            <input
              type="text" className="input-field flex-1"
              placeholder="e.g. Brian Otieno Oduor"
              value={nameInput}
              onChange={(e) => { setNameInput(e.target.value); onChange({ employeeId: "", employeeName: "", staffNumber: "", department: "" as any }); setSearched(false); setMatches([]); }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSearch} disabled={searching}
              className="btn-gold whitespace-nowrap">{searching ? "Searching..." : "Find Me"}</motion.button>
          </div>
          <p className="text-xs text-dark-500 mt-1">Enter at least 2 names (first + last or first + middle + last)</p>
        </div>

        {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">❌ {error}</motion.div>}

        {/* Search results */}
        <AnimatePresence>
          {matches.length > 0 && !voterInfo?.employeeId && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-xs text-dark-400 mb-2">{matches.length} match{matches.length !== 1 ? "es" : ""} found — select your name:</p>
              <div className="space-y-2">
                {matches.map((emp) => (
                  <motion.button key={emp.id} whileHover={{ scale: 1.01 }} onClick={() => selectEmployee(emp)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-surface-border bg-surface-card hover:border-gold-500/50 transition-all flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-xs font-bold text-gold-400 flex-shrink-0">
                      {emp.name.split(" ").slice(0,2).map((n:string) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dark-100">{emp.name}</p>
                      <p className="text-xs text-dark-400">{emp.role ?? ""} · <span className="font-mono text-gold-500">{emp.staffNumber}</span></p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {searched && matches.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-dark-800 border border-surface-border rounded-xl text-center">
              <p className="text-dark-300 text-sm">No employee found matching <span className="text-gold-400">"{nameInput}"</span></p>
              <p className="text-dark-500 text-xs mt-1">Make sure you spell your name correctly as registered with Alexon Group.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected employee confirmation */}
        {voterInfo?.employeeId && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-semibold text-green-400">Identity Verified</p>
              <p className="text-dark-200 text-sm">{voterInfo.employeeName}</p>
              <p className="text-dark-400 text-xs font-mono">{voterInfo.staffNumber}</p>
            </div>
            <button onClick={() => { onChange({ employeeId: "", employeeName: "", staffNumber: "", department: "" as any }); setSearched(false); }} className="ml-auto text-xs text-dark-400 hover:text-gold-400 transition-colors">Change</button>
          </motion.div>
        )}
      </div>

      <div className="mt-6 p-3 bg-surface-card rounded-lg border border-surface-border">
        <p className="text-xs text-dark-400 flex gap-2"><span className="text-gold-400 text-base leading-none">🔒</span>Only registered Alexon Group employees can vote. Your vote is anonymous.</p>
      </div>

      <div className="mt-8 flex justify-end">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onNext}
          disabled={!voterInfo?.employeeId} className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
          Continue →
        </motion.button>
      </div>
    </CardWrapper>
  );
}
