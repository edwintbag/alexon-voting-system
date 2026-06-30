// components/admin/SecurityPanel.tsx — with sorting + category filter
"use client";

import { useEffect, useState } from "react";

interface EmpSecurity {
  id: string;
  name: string;
  staffNumber: string;
  department: string;
  hasNationalId: boolean;
  nationalId: string | null;
  hasPinSet: boolean;
  pinSetAt: string | null;
  isLocked: boolean;
  failedAttempts: number;
}

interface CategoryInfo {
  id: string;
  name: string;
  members: { employee: { id: string } }[];
}

type SortKey = "name" | "staffNumber" | "department" | "id-status" | "pin-status";
type SortDir = "asc" | "desc";

function maskId(id: string | null) {
  if (!id) return "";
  if (id.length <= 4) return "••••";
  return "••••" + id.slice(-4);
}

export default function SecurityPanel() {
  const [employees, setEmployees] = useState<EmpSecurity[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "no-id" | "no-pin" | "locked">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [idInput, setIdInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchAll = async () => {
    setLoading(true);
    const [empRes, catRes] = await Promise.all([
      fetch("/api/admin/employees/national-id"),
      fetch("/api/admin/categories"),
    ]);
    const empData = await empRes.json();
    const catData = await catRes.json();
    setEmployees(empData.employees ?? []);
    setCategories(catData.categories ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const saveNationalId = async (employeeId: string) => {
    const cleaned = idInput.trim().replace(/\s+/g, "");
    if (!/^\d{6,10}$/.test(cleaned)) { setMessage("❌ National ID must be 6-10 digits"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/employees/national-id", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, nationalId: cleaned }),
    });
    if (res.ok) {
      setMessage("✅ National ID saved");
      setEditingId(null);
      setIdInput("");
      fetchAll();
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
      fetchAll();
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // Build a map of employeeId -> [category names]
  const empCategoryMap = new Map<string, string[]>();
  for (const cat of categories) {
    for (const member of cat.members) {
      const list = empCategoryMap.get(member.employee.id) ?? [];
      list.push(cat.name);
      empCategoryMap.set(member.employee.id, list);
    }
  }

  const filtered = employees.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.staffNumber.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "no-id") return !e.hasNationalId;
    if (filter === "no-pin") return !e.hasPinSet;
    if (filter === "locked") return e.isLocked;
    if (categoryFilter !== "ALL") {
      const cats = empCategoryMap.get(e.id) ?? [];
      if (categoryFilter === "UNASSIGNED") return cats.length === 0;
      return cats.includes(categoryFilter);
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "name": cmp = a.name.localeCompare(b.name); break;
      case "staffNumber": cmp = a.staffNumber.localeCompare(b.staffNumber, undefined, { numeric: true }); break;
      case "department": cmp = a.department.localeCompare(b.department); break;
      case "id-status": cmp = Number(a.hasNationalId) - Number(b.hasNationalId); break;
      case "pin-status": {
        const rank = (e: EmpSecurity) => e.isLocked ? 0 : !e.hasPinSet ? 1 : 2;
        cmp = rank(a) - rank(b);
        break;
      }
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const stats = {
    total: employees.length,
    withId: employees.filter(e => e.hasNationalId).length,
    withPin: employees.filter(e => e.hasPinSet).length,
    locked: employees.filter(e => e.isLocked).length,
  };

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "staffNumber", label: "Staff No." },
    { key: "department", label: "Department" },
    { key: "id-status", label: "ID Status" },
    { key: "pin-status", label: "PIN Status" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-dark-50">Voter Security</h2>
        <p className="text-dark-400 text-sm mt-1">
          Manage National ID records and PIN status. Employees use their Name + full National ID number to set up their own PIN.
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

      {/* Search + status filter + category filter */}
      <div className="flex flex-wrap gap-3 items-center">
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

        {/* Category dropdown */}
        <select className="input-field !py-2 !text-sm w-56"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="ALL">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name} ({cat.members.length})</option>
          ))}
          <option value="UNASSIGNED">⚠️ Not in Any Category</option>
        </select>
      </div>

      {/* Sort controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-dark-500 font-semibold uppercase tracking-wider mr-1">Sort by:</span>
        {SORT_OPTIONS.map(opt => (
          <button key={opt.key} onClick={() => toggleSort(opt.key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              sortKey === opt.key
                ? "border-gold-500/40 bg-gold-500/10 text-gold-400"
                : "border-surface-border text-dark-400 hover:text-dark-200 hover:border-dark-400"
            }`}>
            {opt.label}
            {sortKey === opt.key && <span className="text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
          </button>
        ))}
        <span className="text-xs text-dark-600 ml-2">Showing {sorted.length} of {employees.length}</span>
      </div>

      {/* Employee list */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-lg" />)}</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-surface-border max-h-[600px] overflow-y-auto">
            {sorted.map(emp => {
              const empCats = empCategoryMap.get(emp.id) ?? [];
              return (
                <div key={emp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 flex-wrap">
                  <div className="w-8 h-8 rounded-full bg-surface-border flex items-center justify-center text-xs font-bold text-dark-300 flex-shrink-0">
                    {emp.name.split(" ").slice(0,2).map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-medium text-dark-100">{emp.name}</p>
                    <p className="text-xs text-dark-500 font-mono">{emp.staffNumber} · {emp.department}</p>
                    {empCats.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {empCats.map(c => (
                          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-border text-dark-400">{c}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-orange-400/70 mt-1 inline-block">⚠️ No category assigned</span>
                    )}
                  </div>

                  {/* National ID status/edit */}
                  {editingId === emp.id ? (
                    <div className="flex items-center gap-2">
                      <input type="text" inputMode="numeric"
                        className="input-field !py-1.5 !text-sm w-32 text-center font-mono"
                        placeholder="12345678"
                        value={idInput}
                        onChange={(e) => setIdInput(e.target.value.replace(/[^\d]/g, ""))}
                        autoFocus />
                      <button onClick={() => saveNationalId(emp.id)} disabled={saving}
                        className="text-xs px-2 py-1.5 rounded-lg bg-gold-500 text-dark-950 font-medium">Save</button>
                      <button onClick={() => { setEditingId(null); setIdInput(""); }}
                        className="text-xs px-2 py-1.5 rounded-lg border border-surface-border text-dark-400">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingId(emp.id); setIdInput(emp.nationalId ?? ""); }}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-mono ${emp.hasNationalId ? "border-blue-500/30 text-blue-400 hover:bg-blue-500/10" : "border-dark-500/30 text-dark-500 hover:border-gold-500/30 hover:text-gold-400"}`}>
                      {emp.hasNationalId ? `ID: ${maskId(emp.nationalId)}` : "+ Set ID"}
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
              );
            })}
            {sorted.length === 0 && (
              <p className="text-center text-dark-500 text-sm py-8">No employees match this filter.</p>
            )}
          </div>
        </div>
      )}

      <div className="glass-card p-4 border border-gold-500/20">
        <p className="text-xs text-gold-400 font-semibold mb-2">💡 How Employees Use This</p>
        <ol className="text-xs text-dark-400 space-y-1 list-decimal list-inside">
          <li>Search their name when voting</li>
          <li>First time: enter their full National ID number → create their own 6-digit PIN</li>
          <li>Every time after: just enter their PIN</li>
          <li>If locked out (5 wrong attempts), wait 30 min or admin resets here</li>
        </ol>
      </div>
    </div>
  );
}
