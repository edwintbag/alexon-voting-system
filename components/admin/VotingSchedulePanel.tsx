// components/admin/VotingSchedulePanel.tsx — fixed datetime init
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Schedule {
  id: string;
  label: string;
  startDateTime: string;
  endDateTime: string;
  isManualOpen: boolean;
  isManualClosed: boolean;
  overrideReason: string | null;
  isActive: boolean;
}

interface Status {
  isOpen: boolean;
  message: string;
  reason: string;
}

function formatDT(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

// Convert ISO to datetime-local string (client only)
function toInputDT(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Get current time + offset hours as datetime-local (client only)
function nowPlusHours(h = 0) {
  const d = new Date(Date.now() + h * 3600000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const REASON_LABELS: Record<string, string> = {
  MANUAL_OPEN:      "🔓 Manually Opened",
  MANUAL_CLOSED:    "🔒 Manually Closed",
  SCHEDULED_OPEN:   "📅 Scheduled (Open)",
  SCHEDULED_CLOSED: "📅 Scheduled (Closed)",
  NO_SCHEDULE:      "⚠️ No Schedule",
};

export default function VotingSchedulePanel() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Use empty strings initially to avoid SSR NaN issue ──
  const [newForm, setNewForm] = useState({ label: "", startDateTime: "", endDateTime: "" });
  const [editForm, setEditForm] = useState({ label: "", startDateTime: "", endDateTime: "" });

  const [showNew, setShowNew] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showOverride, setShowOverride] = useState<"open" | "close" | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  // Set default dates client-side only (avoids SSR NaN)
  useEffect(() => {
    setNewForm({
      label: "",
      startDateTime: nowPlusHours(0),
      endDateTime: nowPlusHours(96), // 4 days later
    });
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/voting-schedule");
    const data = await res.json();
    setSchedule(data.schedule ?? null);
    setStatus(data.status ?? null);
    setLoading(false);
  };

  useEffect(() => { fetchSchedule(); }, []);

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); }
    else { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 5000);
  };

  const createSchedule = async () => {
    if (!newForm.label.trim()) { showMsg("Please enter a label e.g. May 2026 Voting", true); return; }
    if (!newForm.startDateTime) { showMsg("Please select a start date and time", true); return; }
    if (!newForm.endDateTime)   { showMsg("Please select an end date and time", true); return; }

    const start = new Date(newForm.startDateTime);
    const end   = new Date(newForm.endDateTime);

    if (isNaN(start.getTime())) { showMsg("Invalid start date", true); return; }
    if (isNaN(end.getTime()))   { showMsg("Invalid end date", true); return; }
    if (end <= start)           { showMsg("End date must be after start date", true); return; }

    setSaving(true);
    const res = await fetch("/api/admin/voting-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: newForm.label.trim(),
        startDateTime: start.toISOString(),
        endDateTime:   end.toISOString(),
      }),
    });
    const data = await res.json();
    if (!res.ok) showMsg(data.error, true);
    else {
      showMsg("✅ Schedule created successfully!");
      setShowNew(false);
      setNewForm({ label: "", startDateTime: nowPlusHours(0), endDateTime: nowPlusHours(96) });
      fetchSchedule();
    }
    setSaving(false);
  };

  const editSchedule = async () => {
    if (!editForm.startDateTime || !editForm.endDateTime) { showMsg("Please fill in all fields", true); return; }
    const start = new Date(editForm.startDateTime);
    const end   = new Date(editForm.endDateTime);
    if (end <= start) { showMsg("End date must be after start date", true); return; }

    setSaving(true);
    const res = await fetch("/api/admin/voting-schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "EDIT",
        label: editForm.label,
        startDateTime: start.toISOString(),
        endDateTime:   end.toISOString(),
      }),
    });
    const data = await res.json();
    if (!res.ok) showMsg(data.error, true);
    else { showMsg("✅ Schedule updated!"); setShowEdit(false); fetchSchedule(); }
    setSaving(false);
  };

  const manualOverride = async (action: "MANUAL_OPEN" | "MANUAL_CLOSE" | "CLEAR_OVERRIDE") => {
    setSaving(true);
    const res = await fetch("/api/admin/voting-schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: overrideReason || null }),
    });
    const data = await res.json();
    if (!res.ok) showMsg(data.error, true);
    else {
      const msgs: Record<string, string> = {
        MANUAL_OPEN:      "✅ Voting has been manually opened!",
        MANUAL_CLOSE:     "✅ Voting has been manually closed!",
        CLEAR_OVERRIDE:   "✅ Override cleared — back to schedule.",
      };
      showMsg(msgs[action] ?? "Done");
      setShowOverride(null);
      setOverrideReason("");
      fetchSchedule();
    }
    setSaving(false);
  };

  const startEdit = () => {
    if (!schedule) return;
    setEditForm({
      label:         schedule.label,
      startDateTime: toInputDT(schedule.startDateTime),
      endDateTime:   toInputDT(schedule.endDateTime),
    });
    setShowEdit(true);
    setShowNew(false);
  };

  const isOpen   = status?.isOpen ?? false;
  const statusBorder = isOpen ? "border-green-500/40" : "border-red-500/40";
  const statusBg     = isOpen ? "bg-green-500/10"     : "bg-red-500/10";
  const statusDot    = isOpen ? "bg-green-400 animate-pulse" : "bg-red-400";
  const statusTxt    = isOpen ? "text-green-400"            : "text-red-400";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-dark-50">Voting Schedule</h2>
        <p className="text-dark-400 text-sm mt-1">
          Set exact start and end dates. Force open or close anytime — you have full control.
        </p>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            ❌ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live status */}
      {!loading && status && (
        <div className={`glass-card p-5 border-2 ${statusBorder} ${statusBg}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusDot}`} />
              <div>
                <p className={`font-bold text-lg ${statusTxt}`}>
                  {isOpen ? "VOTING IS OPEN" : "VOTING IS CLOSED"}
                </p>
                <p className="text-dark-400 text-sm mt-0.5">{status.message}</p>
              </div>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full border font-medium flex-shrink-0 ${
              isOpen ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"
            }`}>
              {REASON_LABELS[status.reason] ?? status.reason}
            </span>
          </div>
        </div>
      )}

      {/* Quick override controls */}
      {schedule && (
        <div className="glass-card p-5">
          <p className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-4">
            Manual Controls
          </p>
          <div className="flex flex-wrap gap-3">
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={() => { setShowOverride("open"); setShowEdit(false); setShowNew(false); }}
              disabled={schedule.isManualOpen}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-green-500/40 text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">
              🔓 Force Open Now
            </motion.button>

            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={() => { setShowOverride("close"); setShowEdit(false); setShowNew(false); }}
              disabled={schedule.isManualClosed}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">
              🔒 Force Close Now
            </motion.button>

            {(schedule.isManualOpen || schedule.isManualClosed) && (
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={() => manualOverride("CLEAR_OVERRIDE")} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 transition-colors text-sm font-medium">
                📅 Use Schedule
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {showOverride && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
                exit={{ opacity:0, height:0 }} className="mt-4 overflow-hidden">
                <div className={`p-4 rounded-xl border ${
                  showOverride === "open" ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                }`}>
                  <p className={`text-sm font-semibold mb-3 ${showOverride === "open" ? "text-green-400" : "text-red-400"}`}>
                    {showOverride === "open" ? "🔓 Force open voting?" : "🔒 Force close voting?"}
                  </p>
                  <input type="text" className="input-field !py-2 !text-sm mb-3 w-full"
                    placeholder="Reason (optional)"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)} />
                  <div className="flex gap-2">
                    <button
                      onClick={() => manualOverride(showOverride === "open" ? "MANUAL_OPEN" : "MANUAL_CLOSE")}
                      disabled={saving}
                      className={`px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 ${
                        showOverride === "open"
                          ? "bg-green-500/20 border border-green-500/40 text-green-400"
                          : "bg-red-500/20 border border-red-500/40 text-red-400"
                      }`}>
                      {saving ? "Saving..." : "Confirm"}
                    </button>
                    <button onClick={() => { setShowOverride(null); setOverrideReason(""); }}
                      className="px-4 py-2 rounded-lg text-sm border border-surface-border text-dark-400">
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Current schedule */}
      {schedule && !showEdit && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-dark-300 uppercase tracking-wider">Current Schedule</p>
            <button onClick={startEdit}
              className="text-xs px-3 py-1.5 rounded-lg border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 transition-colors">
              ✏️ Edit Dates
            </button>
          </div>
          <p className="font-semibold text-dark-100 mb-3">{schedule.label}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-green-500/5 rounded-lg border border-green-500/20">
              <p className="text-xs text-dark-400 mb-1">📅 Opens</p>
              <p className="font-semibold text-green-400 text-sm">{formatDT(schedule.startDateTime)}</p>
            </div>
            <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
              <p className="text-xs text-dark-400 mb-1">🔒 Closes</p>
              <p className="font-semibold text-red-400 text-sm">{formatDT(schedule.endDateTime)}</p>
            </div>
          </div>
          {schedule.overrideReason && (
            <div className="mt-3 p-3 bg-gold-500/5 rounded-lg border border-gold-500/20">
              <p className="text-xs text-dark-400 mb-1">Override Reason</p>
              <p className="text-gold-400 text-sm">{schedule.overrideReason}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit schedule form */}
      <AnimatePresence>
        {showEdit && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="glass-card p-5 border border-gold-500/30">
            <p className="text-sm font-semibold text-gold-400 mb-4">✏️ Edit Schedule</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Label</label>
                <input type="text" className="input-field !text-sm"
                  value={editForm.label}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">📅 Start Date & Time</label>
                  <input type="datetime-local" className="input-field !text-sm"
                    value={editForm.startDateTime}
                    onChange={(e) => setEditForm({ ...editForm, startDateTime: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">🔒 End Date & Time</label>
                  <input type="datetime-local" className="input-field !text-sm"
                    value={editForm.endDateTime}
                    onChange={(e) => setEditForm({ ...editForm, endDateTime: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={editSchedule} disabled={saving} className="btn-gold !py-2 !text-sm">
                {saving ? "Saving..." : "✓ Save Changes"}
              </button>
              <button onClick={() => setShowEdit(false)} className="btn-outline !py-2 !text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create new schedule */}
      <div>
        <button onClick={() => { setShowNew(!showNew); setShowEdit(false); }}
          className="btn-gold !py-2 !px-4 !text-sm">
          {showNew ? "Cancel" : (schedule ? "➕ Create New Schedule" : "➕ Create First Schedule")}
        </button>
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="glass-card p-5 border border-gold-500/30">
            <p className="text-sm font-semibold text-gold-400 mb-1">New Voting Schedule</p>
            {schedule && <p className="text-xs text-dark-500 mb-4">This will replace the current schedule.</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Label *</label>
                <input type="text" className="input-field !text-sm"
                  placeholder="e.g. May 2026 Voting"
                  value={newForm.label}
                  onChange={(e) => setNewForm({ ...newForm, label: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">📅 Start Date & Time *</label>
                  <input type="datetime-local" className="input-field !text-sm"
                    value={newForm.startDateTime}
                    onChange={(e) => setNewForm({ ...newForm, startDateTime: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">🔒 End Date & Time *</label>
                  <input type="datetime-local" className="input-field !text-sm"
                    value={newForm.endDateTime}
                    onChange={(e) => setNewForm({ ...newForm, endDateTime: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={createSchedule} disabled={saving} className="btn-gold !py-2 !text-sm">
                {saving ? "Creating..." : "Create Schedule"}
              </button>
              <button onClick={() => setShowNew(false)} className="btn-outline !py-2 !text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Priority legend */}
      <div className="glass-card p-4 border border-surface-border">
        <p className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-3">Priority Order</p>
        <div className="space-y-2 text-xs text-dark-400">
          <div className="flex gap-2"><span className="text-red-400 font-bold w-24 flex-shrink-0">1st — Highest:</span><span>🔒 Force Close — always blocks voting, even during scheduled hours</span></div>
          <div className="flex gap-2"><span className="text-green-400 font-bold w-24 flex-shrink-0">2nd:</span><span>🔓 Force Open — always allows voting, overrides the schedule</span></div>
          <div className="flex gap-2"><span className="text-blue-400 font-bold w-24 flex-shrink-0">3rd:</span><span>📅 Schedule — voting open only between the exact start and end dates you set</span></div>
        </div>
      </div>
    </div>
  );
}
