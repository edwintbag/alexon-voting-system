// components/admin/EmployeesPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DEPARTMENT_LABELS, Department } from "@/types";

interface Employee {
  id: string;
  name: string;
  staffNumber: string;
  department: string;
  role: string | null;
  isActive: boolean;
  isExcluded: boolean;
  _count: { categoryMembers: number };
}

const DEPARTMENTS = Object.entries(DEPARTMENT_LABELS) as [Department, string][];

export default function EmployeesPanel({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", department: "", role: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchEmployees = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/employees");
    const data = await res.json();
    setEmployees(data.employees ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.staffNumber.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.name || !form.department) { setError("Name and department are required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setShowAdd(false); setForm({ name: "", department: "", role: "" });
    fetchEmployees(); setSaving(false);
  };

  const handleEdit = async (id: string) => {
    setSaving(true); setError("");
    const res = await fetch("/api/admin/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...form }),
    });
    if (res.ok) { setEditingId(null); fetchEmployees(); }
    setSaving(false);
  };

  const handleToggleActive = async (emp: Employee) => {
    await fetch("/api/admin/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: emp.id, isActive: !emp.isActive }),
    });
    fetchEmployees();
  };

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({ name: emp.name, department: emp.department, role: emp.role ?? "" });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl font-bold text-dark-50">Employee Management</h2>
          <p className="text-dark-400 text-sm mt-1">{employees.filter(e => e.isActive).length} active employees</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            className="input-field !py-2 !text-sm w-48"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={() => setShowAdd(true)} className="btn-gold !py-2 !px-4 !text-sm whitespace-nowrap">
            + Add Employee
          </button>
        </div>
      </div>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5 mb-6 border border-gold-500/30"
          >
            <h3 className="text-sm font-semibold text-gold-400 mb-4">Add New Employee</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="text" className="input-field !py-2 !text-sm" placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select className="input-field !py-2 !text-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="">Select Department *</option>
                {DEPARTMENTS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
              <input type="text" className="input-field !py-2 !text-sm" placeholder="Role/Title (optional)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            {error && <p className="text-red-400 text-xs mt-2">❌ {error}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={handleAdd} disabled={saving} className="btn-gold !py-1.5 !px-4 !text-sm">{saving ? "Saving..." : "Add Employee"}</button>
              <button onClick={() => { setShowAdd(false); setError(""); }} className="btn-outline !py-1.5 !px-4 !text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Employees Table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold text-dark-400 uppercase tracking-wider border-b border-surface-border">
            <div className="col-span-1">No.</div>
            <div className="col-span-4">Name</div>
            <div className="col-span-3">Department</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Actions</div>
          </div>

          <div className="divide-y divide-surface-border max-h-[600px] overflow-y-auto">
            {filtered.map((emp, i) => (
              <div key={emp.id}>
                {editingId === emp.id ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-gold-500/5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                      <input type="text" className="input-field !py-1.5 !text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      <select className="input-field !py-1.5 !text-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                        {DEPARTMENTS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                      </select>
                      <input type="text" className="input-field !py-1.5 !text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(emp.id)} className="btn-gold !py-1 !px-3 !text-xs">Save</button>
                      <button onClick={() => setEditingId(null)} className="btn-outline !py-1 !px-3 !text-xs">Cancel</button>
                    </div>
                  </motion.div>
                ) : (
                  <div className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${!emp.isActive ? "opacity-50" : ""}`}>
                    <div className="col-span-1 text-xs font-mono text-gold-400">{emp.staffNumber}</div>
                    <div className="col-span-4">
                      <p className="text-sm font-medium text-dark-100 truncate">{emp.name}</p>
                      {emp.isExcluded && <span className="text-xs text-dark-500">(excluded from voting)</span>}
                    </div>
                    <div className="col-span-3 text-xs text-dark-400 truncate">
                      {DEPARTMENT_LABELS[emp.department as Department] ?? emp.department}
                    </div>
                    <div className="col-span-2 text-xs text-dark-500 truncate">{emp.role ?? "—"}</div>
                    <div className="col-span-2 flex gap-1.5">
                      <button onClick={() => startEdit(emp)} className="text-xs px-2 py-1 rounded border border-surface-border text-dark-300 hover:border-gold-500/40 hover:text-gold-400 transition-colors">Edit</button>
                      {isSuperAdmin && (
                        <button onClick={() => handleToggleActive(emp)} className={`text-xs px-2 py-1 rounded border transition-colors ${emp.isActive ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-green-500/30 text-green-400 hover:bg-green-500/10"}`}>
                          {emp.isActive ? "Disable" : "Enable"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-surface-border text-xs text-dark-500">
            Showing {filtered.length} of {employees.length} employees
          </div>
        </div>
      )}
    </div>
  );
}
