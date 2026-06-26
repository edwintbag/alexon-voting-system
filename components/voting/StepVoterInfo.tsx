// components/voting/StepVoterInfo.tsx — v10 with PIN authentication
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoterInfo } from "@/types";
import CardWrapper from "@/components/ui/CardWrapper";

interface Props {
  voterInfo: VoterInfo | null;
  onChange: (v: VoterInfo) => void;
  onNext: () => void;
}

type Stage = "name" | "pin" | "setup-id" | "setup-pin" | "verified";

export default function StepVoterInfo({ voterInfo, onChange, onNext }: Props) {
  const [stage, setStage] = useState<Stage>(voterInfo ? "verified" : "name");
  const [nameInput, setNameInput] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  // PIN entry (existing user)
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);

  // First-time setup
  const [idLast4, setIdLast4] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [settingUp, setSettingUp] = useState(false);

  // ── Search for employee by name ──────────────────────
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

  const selectEmployee = (emp: any) => {
    setSelectedEmployee(emp);
    setMatches([]);
    setStage("pin"); // Default — try PIN entry first
  };

  // ── Verify existing PIN ──────────────────────────────
  const handleVerifyPin = async () => {
    if (pin.length !== 6) { setError("PIN must be 6 digits"); return; }
    setVerifying(true); setError("");

    const res = await fetch("/api/auth/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: selectedEmployee.id, pin }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.needsSetup) {
        setStage("setup-id");
        setError("");
      } else {
        setError(data.error);
      }
      setVerifying(false);
      return;
    }

    // Success!
    onChange({
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      staffNumber: data.staffNumber,
    });
    setStage("verified");
    setVerifying(false);
  };

  // ── First-time: verify National ID ───────────────────
  const handleVerifyId = async () => {
    if (idLast4.length !== 4) { setError("Please enter exactly 4 digits"); return; }
    setSettingUp(true); setError("");

    const res = await fetch("/api/auth/setup-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", employeeId: selectedEmployee.id, nationalIdLast4: idLast4 }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setSettingUp(false);
      return;
    }

    setStage("setup-pin");
    setSettingUp(false);
  };

  // ── First-time: create new PIN ───────────────────────
  const handleCreatePin = async () => {
    if (newPin.length !== 6) { setError("PIN must be exactly 6 digits"); return; }
    if (newPin !== confirmPin) { setError("PINs do not match"); return; }
    setSettingUp(true); setError("");

    const res = await fetch("/api/auth/setup-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setPin", employeeId: selectedEmployee.id, nationalIdLast4: idLast4, pin: newPin }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setSettingUp(false);
      return;
    }

    // PIN created — log them in immediately
    onChange({
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      staffNumber: selectedEmployee.staffNumber,
    });
    setStage("verified");
    setSettingUp(false);
  };

  const reset = () => {
    setStage("name");
    setNameInput(""); setMatches([]); setSelectedEmployee(null);
    setPin(""); setIdLast4(""); setNewPin(""); setConfirmPin("");
    setError(""); setSearched(false);
  };

  return (
    <CardWrapper>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-dark-50">Verify Your Identity</h2>
        <p className="text-dark-400 mt-1 text-sm">Confirm who you are before casting your vote.</p>
      </div>

      <AnimatePresence mode="wait">

        {/* ── STAGE: Name search ─────────────────────── */}
        {stage === "name" && (
          <motion.div key="name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex gap-3 mb-4">
              <input type="text" className="input-field flex-1"
                placeholder="Enter your full name..."
                value={nameInput}
                onChange={(e) => { setNameInput(e.target.value); setSearched(false); setMatches([]); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
              <button onClick={handleSearch} disabled={searching} className="btn-gold whitespace-nowrap">
                {searching ? "Searching..." : "Find Me"}
              </button>
            </div>

            {error && <p className="text-red-400 text-sm mb-3">❌ {error}</p>}

            {matches.length > 0 && (
              <div className="space-y-2">
                {matches.map(emp => (
                  <motion.button key={emp.id} whileHover={{ scale: 1.01 }}
                    onClick={() => selectEmployee(emp)}
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
              <p className="text-dark-400 text-sm">No employee found matching "{nameInput}"</p>
            )}
          </motion.div>
        )}

        {/* ── STAGE: PIN entry (returning user) ──────── */}
        {stage === "pin" && (
          <motion.div key="pin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="p-4 bg-surface-card rounded-xl border border-surface-border mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-sm font-bold text-gold-400">
                {selectedEmployee.name.split(" ").slice(0,2).map((n: string) => n[0]).join("")}
              </div>
              <div>
                <p className="font-semibold text-dark-100">{selectedEmployee.name}</p>
                <p className="text-xs text-dark-400 font-mono">{selectedEmployee.staffNumber}</p>
              </div>
            </div>

            <label className="block text-sm font-medium text-dark-200 mb-2">Enter your 6-digit PIN</label>
            <input type="password" inputMode="numeric" maxLength={6}
              className="input-field text-center text-2xl font-mono tracking-widest mb-3"
              placeholder="••••••"
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyPin()} />

            {error && <p className="text-red-400 text-sm mb-3">❌ {error}</p>}

            <div className="flex gap-3">
              <button onClick={handleVerifyPin} disabled={verifying || pin.length !== 6} className="btn-gold flex-1 disabled:opacity-40">
                {verifying ? "Verifying..." : "Verify PIN"}
              </button>
              <button onClick={reset} className="btn-outline">← Back</button>
            </div>

            <button onClick={() => { setStage("setup-id"); setError(""); }}
              className="text-xs text-dark-500 hover:text-gold-400 mt-4 underline">
              First time voting / Forgot your PIN?
            </button>
          </motion.div>
        )}

        {/* ── STAGE: Verify National ID (first time) ─── */}
        {stage === "setup-id" && (
          <motion.div key="setup-id" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="p-4 bg-gold-500/5 border border-gold-500/20 rounded-xl mb-4">
              <p className="text-sm text-gold-400 font-semibold mb-1">🔐 First-Time PIN Setup</p>
              <p className="text-xs text-dark-400">
                To create your voting PIN, please confirm your identity using your National ID number.
              </p>
            </div>

            <div className="p-4 bg-surface-card rounded-xl border border-surface-border mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-sm font-bold text-gold-400">
                {selectedEmployee.name.split(" ").slice(0,2).map((n: string) => n[0]).join("")}
              </div>
              <p className="font-semibold text-dark-100">{selectedEmployee.name}</p>
            </div>

            <label className="block text-sm font-medium text-dark-200 mb-2">
              Last 4 digits of your National ID Number
            </label>
            <input type="text" inputMode="numeric" maxLength={4}
              className="input-field text-center text-2xl font-mono tracking-widest mb-3"
              placeholder="••••"
              value={idLast4}
              onChange={(e) => { setIdLast4(e.target.value.replace(/\D/g, "")); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyId()} />

            {error && <p className="text-red-400 text-sm mb-3">❌ {error}</p>}

            <div className="flex gap-3">
              <button onClick={handleVerifyId} disabled={settingUp || idLast4.length !== 4} className="btn-gold flex-1 disabled:opacity-40">
                {settingUp ? "Checking..." : "Continue"}
              </button>
              <button onClick={() => setStage("pin")} className="btn-outline">← Back</button>
            </div>

            <p className="text-xs text-dark-500 mt-4">
              ⚠️ If this doesn't work, your ID may not be on record yet. Please contact ICT/HR.
            </p>
          </motion.div>
        )}

        {/* ── STAGE: Create new PIN ───────────────────── */}
        {stage === "setup-pin" && (
          <motion.div key="setup-pin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-4">
              <p className="text-sm text-green-400 font-semibold">✅ Identity confirmed!</p>
              <p className="text-xs text-dark-400 mt-0.5">Now create a private 6-digit PIN. Remember it — you'll use it every time you vote.</p>
            </div>

            <label className="block text-sm font-medium text-dark-200 mb-2">Create your PIN</label>
            <input type="password" inputMode="numeric" maxLength={6}
              className="input-field text-center text-2xl font-mono tracking-widest mb-3"
              placeholder="••••••"
              value={newPin}
              onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, "")); setError(""); }} />

            <label className="block text-sm font-medium text-dark-200 mb-2">Confirm your PIN</label>
            <input type="password" inputMode="numeric" maxLength={6}
              className="input-field text-center text-2xl font-mono tracking-widest mb-3"
              placeholder="••••••"
              value={confirmPin}
              onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, "")); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleCreatePin()} />

            {error && <p className="text-red-400 text-sm mb-3">❌ {error}</p>}

            <div className="flex gap-3">
              <button onClick={handleCreatePin} disabled={settingUp || newPin.length !== 6 || confirmPin.length !== 6}
                className="btn-gold flex-1 disabled:opacity-40">
                {settingUp ? "Creating..." : "Create PIN & Continue"}
              </button>
            </div>

            <p className="text-xs text-dark-500 mt-4">
              💡 Tip: Don't share your PIN with anyone — not even colleagues or friends.
            </p>
          </motion.div>
        )}

        {/* ── STAGE: Verified ──────────────────────────── */}
        {stage === "verified" && voterInfo && (
          <motion.div key="verified" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 mb-6">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-semibold text-green-400">Identity Verified</p>
                <p className="text-dark-200 text-sm">{voterInfo.employeeName} · {voterInfo.staffNumber}</p>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={reset} className="text-xs text-dark-500 hover:text-gold-400 underline">
                Not you? Switch identity
              </button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onNext} className="btn-gold">
                Continue →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CardWrapper>
  );
}
