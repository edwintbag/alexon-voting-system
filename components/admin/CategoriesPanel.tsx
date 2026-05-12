// components/admin/CategoriesPanel.tsx — v8 fixed edit bug
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Member { id: string; name: string; staffNumber: string; department: string; role: string | null; }
interface Category {
  id: string; name: string; description: string | null;
  isActive: boolean; order: number;
  members: { isLeader: boolean; employee: Member }[];
  _count: { members: number; votes: number };
}
interface Employee { id: string; name: string; staffNumber: string; department: string; }

// Per-category edit state — avoids shared state bugs
interface EditState { name: string; description: string; }

export default function CategoriesPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Store edit state PER category ID
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStates, setEditStates] = useState<Record<string, EditState>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", description: "" });
  const [addMemberSearch, setAddMemberSearch] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [createError, setCreateError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    const [catRes, empRes] = await Promise.all([
      fetch("/api/admin/categories"),
      fetch("/api/admin/employees"),
    ]);
    const catData = await catRes.json();
    const empData = await empRes.json();
    setCategories(catData.categories ?? []);
    setAllEmployees(empData.employees?.filter((e: any) => e.isActive) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Start editing — store this category's data in its own slot
  const startEdit = (e: React.MouseEvent, cat: Category) => {
    e.stopPropagation();
    setEditingId(cat.id);
    setSaveError("");
    // Store initial values keyed by category ID
    setEditStates(prev => ({
      ...prev,
      [cat.id]: { name: cat.name, description: cat.description ?? "" }
    }));
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setSaveError("");
  };

  const updateEditField = (catId: string, field: keyof EditState, value: string) => {
    setEditStates(prev => ({
      ...prev,
      [catId]: { ...prev[catId], [field]: value }
    }));
  };

  const saveEdit = async (catId: string) => {
    const state = editStates[catId];
    if (!state?.name?.trim()) { setSaveError("Category name is required"); return; }
    setSaving(true); setSaveError("");

    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: catId,
        name: state.name.trim(),
        description: state.description.trim() || null,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSaveError(data.error ?? "Failed to save");
      setSaving(false);
      return;
    }

    setEditingId(null);
    setSaveError("");
    setSaving(false);
    fetchAll();
  };

  const createCategory = async () => {
    if (!newCat.name.trim()) { setCreateError("Category name is required"); return; }
    setSaving(true); setCreateError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat.name.trim(), description: newCat.description.trim() || null }),
    });
    const data = await res.json();
    if (!res.ok) { setCreateError(data.error); setSaving(false); return; }
    setShowAdd(false); setNewCat({ name: "", description: "" });
    fetchAll(); setSaving(false);
  };

  const deleteCategory = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    await fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAll();
  };

  const addMember = async (categoryId: string, employeeId: string) => {
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: categoryId, addMemberId: employeeId }),
    });
    setAddMemberSearch({});
    fetchAll();
  };

  const removeMember = async (categoryId: string, employeeId: string, name: string) => {
    if (!confirm(`Remove ${name} from this category?`)) return;
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: categoryId, removeMemberId: employeeId }),
    });
    fetchAll();
  };

  const toggleActive = async (e: React.MouseEvent, cat: Category) => {
    e.stopPropagation();
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cat.id, isActive: !cat.isActive }),
    });
    fetchAll();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-bold text-dark-50">Category Management</h2>
          <p className="text-dark-400 text-sm mt-1">Create, edit categories and manage members</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-gold !py-2 !px-4 !text-sm">+ New Category</button>
      </div>

      {/* Add Category */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-card p-5 mb-6 border border-gold-500/30">
            <h3 className="text-sm font-semibold text-gold-400 mb-4">Create New Category</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Category Name *</label>
                <input type="text" className="input-field !py-2 !text-sm"
                  placeholder="e.g. Drivers"
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Description (optional)</label>
                <input type="text" className="input-field !py-2 !text-sm"
                  placeholder="e.g. Transport & Fleet drivers"
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })} />
              </div>
            </div>
            {createError && <p className="text-red-400 text-xs mt-2">❌ {createError}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={createCategory} disabled={saving}
                className="btn-gold !py-1.5 !px-4 !text-sm">
                {saving ? "Creating..." : "Create Category"}
              </button>
              <button onClick={() => { setShowAdd(false); setCreateError(""); }}
                className="btn-outline !py-1.5 !px-4 !text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories List */}
      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const isExpanded = expandedId === cat.id;
            const isEditing = editingId === cat.id;
            const currentEdit = editStates[cat.id] ?? { name: cat.name, description: cat.description ?? "" };
            const memberIds = new Set(cat.members.map(m => m.employee.id));
            const available = allEmployees.filter(e => !memberIds.has(e.id));
            const searchTerm = addMemberSearch[cat.id]?.toLowerCase() ?? "";
            const filtered = searchTerm
              ? available.filter(e => e.name.toLowerCase().includes(searchTerm))
              : available;

            return (
              <div key={cat.id} className={`glass-card overflow-hidden ${!cat.isActive ? "opacity-60" : ""}`}>

                {/* ── Edit mode ────────────────────────────── */}
                {isEditing ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="p-5 border-l-4 border-gold-500">
                    <p className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-3">
                      Editing: {cat.name}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-dark-400 mb-1 block">Category Name *</label>
                        <input
                          type="text"
                          className="input-field !py-2 !text-sm"
                          value={currentEdit.name}
                          onChange={(e) => updateEditField(cat.id, "name", e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-xs text-dark-400 mb-1 block">Description</label>
                        <input
                          type="text"
                          className="input-field !py-2 !text-sm"
                          value={currentEdit.description}
                          onChange={(e) => updateEditField(cat.id, "description", e.target.value)}
                        />
                      </div>
                    </div>
                    {saveError && <p className="text-red-400 text-xs mb-3">❌ {saveError}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(cat.id)} disabled={saving}
                        className="btn-gold !py-1.5 !px-4 !text-sm">
                        {saving ? "Saving..." : "✓ Save Changes"}
                      </button>
                      <button onClick={cancelEdit}
                        className="btn-outline !py-1.5 !px-4 !text-sm">Cancel</button>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Normal view ─────────────────────────── */
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/2 transition-colors"
                    onClick={() => !isEditing && setExpandedId(isExpanded ? null : cat.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-dark-100">{cat.name}</h3>
                        {!cat.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-dark-500/40 text-dark-500">
                            Inactive
                          </span>
                        )}
                        <span className="text-xs text-dark-400">
                          {cat._count.members} members · {cat._count.votes} votes
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-dark-500 mt-0.5">{cat.description}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => startEdit(e, cat)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 transition-colors">
                        ✏️ Edit
                      </button>
                      <button onClick={(e) => toggleActive(e, cat)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          cat.isActive
                            ? "border-dark-500/30 text-dark-400 hover:border-red-500/30 hover:text-red-400"
                            : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                        }`}>
                        {cat.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button onClick={(e) => deleteCategory(e, cat.id, cat.name)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                        Delete
                      </button>
                    </div>
                    <span className="text-dark-400 text-sm flex-shrink-0">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                )}

                {/* ── Expanded members panel ────────────────── */}
                <AnimatePresence>
                  {isExpanded && !isEditing && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: "auto" }}
                      exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 border-t border-surface-border pt-4">

                        {/* Members list */}
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">
                            Members ({cat.members.length})
                          </p>
                          {cat.members.length === 0 ? (
                            <p className="text-xs text-dark-500">No members yet. Add some below.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {cat.members.map((m) => (
                                <div key={m.employee.id}
                                  className="flex items-center gap-3 p-2.5 bg-surface-card rounded-lg border border-surface-border">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.isLeader ? "bg-gold-500 text-dark-950" : "bg-surface-border text-dark-300"}`}>
                                    {m.employee.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("")}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-dark-100 truncate">{m.employee.name}</p>
                                    {m.isLeader && <p className="text-xs text-gold-400">Team Leader</p>}
                                  </div>
                                  <button onClick={() => removeMember(cat.id, m.employee.id, m.employee.name)}
                                    className="text-xs text-red-400 hover:text-red-300 flex-shrink-0 px-1">✕</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Add member search */}
                        <div>
                          <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                            Add Member
                          </p>
                          <input type="text" className="input-field !py-2 !text-sm mb-2"
                            placeholder="Type employee name to search..."
                            value={addMemberSearch[cat.id] ?? ""}
                            onChange={(e) => setAddMemberSearch({ ...addMemberSearch, [cat.id]: e.target.value })} />
                          {searchTerm && (
                            <div className="max-h-48 overflow-y-auto space-y-1 border border-surface-border rounded-lg p-1">
                              {filtered.slice(0, 10).map((emp) => (
                                <button key={emp.id} onClick={() => addMember(cat.id, emp.id)}
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gold-500/10 text-sm text-dark-200 hover:text-gold-400 transition-colors flex items-center gap-2">
                                  <span className="text-xs text-dark-500 font-mono w-14 flex-shrink-0">{emp.staffNumber}</span>
                                  {emp.name}
                                </button>
                              ))}
                              {filtered.length === 0 && (
                                <p className="text-xs text-dark-500 px-3 py-2">No matching employees found</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
