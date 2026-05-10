// components/admin/VotingSchedulePanel.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Schedule {
  id: string;
  recurringStartDay: number;
  recurringEndDay: number;
  recurringStartHour: number;
  recurringEndHour: number;
  isManualOverride: boolean;
  manualIsOpen: boolean;
  overrideReason: string | null;
  overrideSetAt: string | null;
}

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? "12:00 AM" : i === 12 ? "12:00 PM" : i > 12 ? `${i - 12}:00 PM` : `${i}:00 AM`,
}));

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export default function VotingSchedulePanel() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<"open" | "close" | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({
    recurringStartDay: 25,
    recurringEndDay: 30,
    recurringStartHour: 8,
    recurringEndHour: 17,
  });

  const fetchSchedule = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/voting-schedule");
    const data = await res.json();
    if (data.schedule) {
      setSchedule(data.schedule);
      setForm({
        recurringStartDay: data.schedule.recurringStartDay,
        recurringEndDay: data.schedule.recurringEndDay,
        recurringStartHour: data.schedule.recurringStartHour,
        recurringEndHour: data.schedule.recurringEndHour,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchSchedule(); }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Save recurring schedule
  const saveSchedule = async () => {
    if (form.recurringStartDay >= form.recurringEndDay) {
      alert("Start day must be before end day"); return;
    }
    setSaving(true);
    await fetch("/api/admin/voting-schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    await fetchSchedule();
    setSaving(false);
    showSuccess("✅ Recurring schedule saved!");
  };

  // Initiate manual override
  const initiateOverride = (action: "open" | "close") => {
    setPendingAction(action);
    setShowReasonInput(true);
    setOverrideReason("");
  };

  // Confirm manual override
  const confirmOverride = async () => {
    if (!pendingAction) return;
    setSaving(true);
    await fetch("/api/admin/voting-schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isManualOverride: true,
        manualIsOpen: pendingAction === "open",
        overrideReason: overrideReason || null,
      }),
    });
    setShowReasonInput(false);
    setPendingAction(null);
    setOverrideReason("");
    await fetchSchedule();
    setSaving(false);
    showSuccess(pendingAction === "open" ? "✅ Voting opened manually!" : "✅ Voting closed manually!");
  };

  // Remove override — revert to schedule
  const removeOverride = async () => {
    setSaving(true);
    await fetch("/api/admin/voting-schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isManualOverride: false, manualIsOpen: false, overrideReason: null }),
    });
    await fetchSchedule();
    setSaving(false);
    showSuccess("✅ Reverted to recurring schedule!");
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>;

  const isCurrentlyOpen = schedule?.isManualOverride ? schedule.manualIsOpen : false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-dark-50">Voting Schedule</h2>
        <p className="text-dark-400 text-sm mt-1">Set the recurring monthly window and manually control voting.</p>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Status Card */}
      <div className={`glass-card p-5 border-2 ${schedule?.isManualOverride ? (schedule.manualIsOpen ? "border-green-500/50" : "border-red-500/50") : "border-gold-500/30"}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-1">Current Status</p>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${schedule?.isManualOverride ? (schedule.manualIsOpen ? "bg-green-400 animate-pulse" : "bg-red-400") : "bg-gold-400 animate-pulse"}`} />
              <span className={`text-lg font-bold ${schedule?.isManualOverride ? (schedule.manualIsOpen ? "text-green-400" : "text-red-400") : "text-gold-400"}`}>
                {schedule?.isManualOverride ? (schedule.manualIsOpen ? "OPEN — Manually Opened" : "CLOSED — Manually Closed") : `Recurring Schedule Active`}
              </span>
            </div>
            {schedule?.isManualOverride && (
              <p className="text-dark-400 text-sm mt-1">
                {schedule.overrideReason ? `Reason: ${schedule.overrideReason}` : "No reason provided"}
              </p>
            )}
            {!schedule?.isManualOverride && schedule && (
              <p className="text-dark-400 text-sm mt-1">
                Opens on the <span className="text-gold-400">{schedule.recurringStartDay}th</span> at <span className="text-gold-400">{HOURS[schedule.recurringStartHour]?.label}</span> · Closes on the <span className="text-gold-400">{schedule.recurringEndDay}th</span> at <span className="text-gold-400">{HOURS[schedule.recurringEndHour]?.label}</span>
              </p>
            )}
          </div>

          {/* Override badge */}
          {schedule?.isManualOverride && (
            <span className="text-xs px-3 py-1 rounded-full border border-yellow-500/40 text-yellow-400 bg-yellow-500/10">
              ⚡ Manual Override Active
            </span>
          )}
        </div>
      </div>

      {/* Manual Controls */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-1">Manual Controls</h3>
        <p className="text-dark-400 text-xs mb-4">Instantly open or close voting regardless of the schedule.</p>

        <div className="flex flex-wrap gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => initiateOverride("open")}
            disabled={saving || (schedule?.isManualOverride && schedule.manualIsOpen)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-500/10 border border-green-500/40 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm">
            ▶ Open Voting Now
          </motion.button>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => initiateOverride("close")}
            disabled={saving || (schedule?.isManualOverride && !schedule.manualIsOpen)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm">
            ⏹ Close Voting Now
          </motion.button>

          {schedule?.isManualOverride && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={removeOverride} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold-500/10 border border-gold-500/40 text-gold-400 hover:bg-gold-500/20 transition-colors font-medium text-sm">
              🔄 Revert to Schedule
            </motion.button>
          )}
        </div>

        {/* Reason input */}
        <AnimatePresence>
          {showReasonInput && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
              <div className="p-4 bg-surface-card rounded-xl border border-surface-border">
                <p className="text-sm font-medium text-dark-200 mb-3">
                  {pendingAction === "open" ? "✅ Confirm: Open Voting Now" : "⛔ Confirm: Close Voting Now"}
                </p>
                <input type="text" className="input-field !py-2 !text-sm mb-3"
                  placeholder="Reason (optional, e.g. 'Early voting for remote staff')"
                  value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={confirmOverride} disabled={saving}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${pendingAction === "open" ? "bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30" : "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30"}`}>
                    {saving ? "Applying..." : "Confirm"}
                  </button>
                  <button onClick={() => { setShowReasonInput(false); setPendingAction(null); }} className="btn-outline !py-2 !px-4 !text-sm">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recurring Schedule Settings */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-1">Recurring Monthly Schedule</h3>
        <p className="text-dark-400 text-xs mb-5">This runs automatically every month unless manually overridden.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Start */}
          <div className="p-4 bg-surface-card rounded-xl border border-surface-border">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">🟢 Voting Opens</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Day of Month</label>
                <select className="input-field !py-2 !text-sm" value={form.recurringStartDay}
                  onChange={(e) => setForm({ ...form, recurringStartDay: parseInt(e.target.value) })}>
                  {DAYS.map(d => <option key={d} value={d}>{d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Time</label>
                <select className="input-field !py-2 !text-sm" value={form.recurringStartHour}
                  onChange={(e) => setForm({ ...form, recurringStartHour: parseInt(e.target.value) })}>
                  {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* End */}
          <div className="p-4 bg-surface-card rounded-xl border border-surface-border">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">🔴 Voting Closes</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Day of Month</label>
                <select className="input-field !py-2 !text-sm" value={form.recurringEndDay}
                  onChange={(e) => setForm({ ...form, recurringEndDay: parseInt(e.target.value) })}>
                  {DAYS.map(d => <option key={d} value={d}>{d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Time</label>
                <select className="input-field !py-2 !text-sm" value={form.recurringEndHour}
                  onChange={(e) => setForm({ ...form, recurringEndHour: parseInt(e.target.value) })}>
                  {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-4 p-3 bg-gold-500/5 border border-gold-500/20 rounded-lg">
          <p className="text-xs text-dark-300">
            📅 Preview: Every month, voting will open on the{" "}
            <span className="text-gold-400 font-semibold">{form.recurringStartDay}th</span> at{" "}
            <span className="text-gold-400 font-semibold">{HOURS[form.recurringStartHour]?.label}</span> and close on the{" "}
            <span className="text-gold-400 font-semibold">{form.recurringEndDay}th</span> at{" "}
            <span className="text-gold-400 font-semibold">{HOURS[form.recurringEndHour]?.label}</span>.
          </p>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={saveSchedule} disabled={saving}
          className="btn-gold mt-4 !py-2 !px-6 !text-sm">
          {saving ? "Saving..." : "💾 Save Schedule"}
        </motion.button>
      </div>
    </div>
  );
}
