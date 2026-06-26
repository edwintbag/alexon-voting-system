// components/admin/SecurityPanel.tsx — manage National IDs + PIN status
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface EmpSecurity {
  id: string;
  name: string;
  staffNumber: string;
  department: string;
  hasNationalId: boolean;
  nationalIdLast4: string | null;
  hasPinSet: boolean;
  pinSetAt: string | null;
  isLocked: boolean;
  failedAttempts: number;
}

export default function SecurityPanel() {
  const [employees, setEmployees] = useState<EmpSecurity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "no-id" | "no-pin" | "locked">("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [idInput, setIdInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchEmployees = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/employees/national-id");
    const data = await res.json();
    setEmployees(data.employees ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const saveNationalId = async (employeeId: string) => {
    if (!/^\d{4}$/.test(idInput)) { setMessage("❌ Must be exactly 4 digits"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/employees/national-id", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, nationalIdLast4: idInput }),
    });
    if (res.ok) {
      setMessage("✅ National ID saved");
      setEditingId(null);
      setIdInput("");
      fetchEmployees();
    } else {
      const data = await res.json();
      setMessage("❌ " + data.error);
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const resetPin = async (employeeId: string, name: string) => {
    if (!confirm(`Reset PIN for ${name}? They will need to set up a new PIN using their National ID.`)) return;
    setSaving(true);
    const res = await fetch("/api/admin/employees/national-id", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, resetPin: true }),
    });
    if (res.ok) {
      setMessage("✅ PIN reset successfully");
      fetchEmployees();
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const filtered = employees.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.staffNumber.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "no-id") return !e.hasNationalId;
    if (filter === "no-pin") return !e.hasPinSet;
    if (filter === "locked") return e.isLocked;
    return true;
  });

  const stats = {
    total: employees.length,
    withId: employees.filter(e => e.hasNationalId).length,
    withPin: employees.filter(e => e.hasPinSet).length,
    locked: employees.filter(e => e.isLocked).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-dark-50">Voter Security</h2>
        <p className="text-dark-400 text-sm mt-1">
          Manage National ID records and PIN status. Employees use their Name + National ID (last 4 digits) to set up their own PIN.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-dark-100">{stats.total}</p>
          <p className="text-xs text-dark-400">Total Staff</p>
        </div>
        <div className="glass-card p-4 text-center border border-blue-500/20">
          <p className="text-2xl font-bold text-blue-400">{stats.withId}</p>
          <p className="text-xs text-dark-400">ID Recorded</p>
        </div>
        <div className="glass-card p-4 text-center border border-green-500/20">
          <p className="text-2xl font-bold text-green-400">{stats.withPin}</p>
          <p className="text-xs text-dark-400">PIN Set Up</p>
        </div>
        <div className="glass-card p-4 text-center border border-red-500/20">
          <p className="text-2xl font-bold text-red-400">{stats.locked}</p>
          <p className="text-xs text-dark-400">Locked</p>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-surface-card rounded-lg border border-surface-border text-sm">{message}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="text" className="input-field !py-2 !text-sm w-56"
          placeholder="Search name or staff no..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-1 bg-surface-card border border-surface-border rounded-lg p-1">
          {([
            { id: "all", label: "All" },
            { id: "no-id", label: "No ID" },
            { id: "no-pin", label: "No PIN" },
            { id: "locked", label: "Locked" },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filter === tab.id ? "bg-gold-500 text-dark-950" : "text-dark-300 hover:text-dark-100"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Employee list */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-lg" />)}</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-surface-border max-h-[600px] overflow-y-auto">
            {filtered.map(emp => (
              <div key={emp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 flex-wrap">
                <div className="w-8 h-8 rounded-full bg-surface-border flex items-center justify-center text-xs font-bold text-dark-300 flex-shrink-0">
                  {emp.name.split(" ").slice(0,2).map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-medium text-dark-100">{emp.name}</p>
                  <p className="text-xs text-dark-500 font-mono">{emp.staffNumber}</p>
                </div>

                {/* National ID status/edit */}
                {editingId === emp.id ? (
                  <div className="flex items-center gap-2">
                    <input type="text" inputMode="numeric" maxLength={4}
                      className="input-field !py-1.5 !text-sm w-20 text-center font-mono"
                      placeholder="1234"
                      value={idInput}
                      onChange={(e) => setIdInput(e.target.value.replace(/\D/g, ""))}
                      autoFocus />
                    <button onClick={() => saveNationalId(emp.id)} disabled={saving}
                      className="text-xs px-2 py-1.5 rounded-lg bg-gold-500 text-dark-950 font-medium">Save</button>
                    <button onClick={() => { setEditingId(null); setIdInput(""); }}
                      className="text-xs px-2 py-1.5 rounded-lg border border-surface-border text-dark-400">✕</button>
                  </div>
                ) : (
                  <button onClick={() => { setEditingId(emp.id); setIdInput(emp.nationalIdLast4 ?? ""); }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${emp.hasNationalId ? "border-blue-500/30 text-blue-400 hover:bg-blue-500/10" : "border-dark-500/30 text-dark-500 hover:border-gold-500/30 hover:text-gold-400"}`}>
                    {emp.hasNationalId ? `ID: ••${emp.nationalIdLast4}` : "+ Set ID"}
                  </button>
                )}

                {/* PIN status */}
                <span className={`text-xs px-2.5 py-1 rounded-full border ${
                  emp.isLocked ? "border-red-500/30 text-red-400 bg-red-500/10" :
                  emp.hasPinSet ? "border-green-500/30 text-green-400 bg-green-500/10" :
                  "border-dark-500/30 text-dark-500"
                }`}>
                  {emp.isLocked ? "🔒 Locked" : emp.hasPinSet ? "✓ PIN Set" : "No PIN"}
                </span>

                {/* Reset button */}
                {emp.hasPinSet && (
                  <button onClick={() => resetPin(emp.id, emp.name)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                    Reset PIN
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-4 border border-gold-500/20">
        <p className="text-xs text-gold-400 font-semibold mb-2">💡 How Employees Use This</p>
        <ol className="text-xs text-dark-400 space-y-1 list-decimal list-inside">
          <li>Search their name when voting</li>
          <li>First time: enter last 4 digits of National ID → create their own 6-digit PIN</li>
          <li>Every time after: just enter their PIN</li>
          <li>If locked out (5 wrong attempts), wait 30 min or admin resets here</li>
        </ol>
      </div>
    </div>
  );
}
