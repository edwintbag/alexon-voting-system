// components/admin/AuditLogsPanel.tsx
// Super Admin sees all logs — Admin sees only their own
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  admin: { name: string; email: string; role: string };
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "text-green-400 bg-green-500/10 border-green-500/30",
  LOGOUT: "text-dark-400 bg-dark-500/10 border-dark-500/30",
  GENERATE_INVITE: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  ADMIN_REGISTERED: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  UPDATE_ADMIN: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  NULLIFY_VOTE: "text-red-400 bg-red-500/10 border-red-500/30",
  EXPORT_CSV: "text-gold-400 bg-gold-500/10 border-gold-500/30",
  ADD_EMPLOYEE: "text-green-400 bg-green-500/10 border-green-500/30",
  EDIT_EMPLOYEE: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  DELETE_EMPLOYEE: "text-red-400 bg-red-500/10 border-red-500/30",
  CREATE_CATEGORY: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  EDIT_CATEGORY: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  DELETE_CATEGORY: "text-red-400 bg-red-500/10 border-red-500/30",
  ADD_CATEGORY_MEMBER: "text-green-400 bg-green-500/10 border-green-500/30",
  REMOVE_CATEGORY_MEMBER: "text-red-400 bg-red-500/10 border-red-500/30",
  VOTING_FORCE_OPENED: "text-green-400 bg-green-500/10 border-green-500/30",
  VOTING_FORCE_CLOSED: "text-red-400 bg-red-500/10 border-red-500/30",
  VOTING_OVERRIDE_REMOVED: "text-gold-400 bg-gold-500/10 border-gold-500/30",
  VOTING_SCHEDULE_UPDATED: "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Signed In",
  LOGOUT: "Signed Out",
  GENERATE_INVITE: "Generated Invite",
  ADMIN_REGISTERED: "Admin Registered",
  UPDATE_ADMIN: "Updated Admin",
  EXPORT_CSV: "Exported CSV",
  ADD_EMPLOYEE: "Added Employee",
  EDIT_EMPLOYEE: "Edited Employee",
  DELETE_EMPLOYEE: "Disabled Employee",
  CREATE_CATEGORY: "Created Category",
  EDIT_CATEGORY: "Edited Category",
  DELETE_CATEGORY: "Deleted Category",
  ADD_CATEGORY_MEMBER: "Added Member to Category",
  REMOVE_CATEGORY_MEMBER: "Removed Member from Category",
  VOTING_FORCE_OPENED: "Force Opened Voting",
  VOTING_FORCE_CLOSED: "Force Closed Voting",
  VOTING_OVERRIDE_REMOVED: "Removed Voting Override",
  VOTING_SCHEDULE_UPDATED: "Updated Voting Schedule",
};

export default function AuditLogsPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewingOwn, setViewingOwn] = useState(false);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    const res = await fetch(`/api/admin/audit-logs?page=${p}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setPages(data.pages ?? 1);
    setTotal(data.total ?? 0);
    setViewingOwn(data.viewingOwn ?? false);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(page); }, [page]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-bold text-dark-50">Audit Logs</h2>
          <p className="text-dark-400 text-sm mt-1">
            {viewingOwn
              ? "Showing your activity history only."
              : "Full history of all admin actions in the system."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1.5 rounded-full border ${viewingOwn ? "border-blue-500/40 text-blue-400 bg-blue-500/10" : "border-gold-500/40 text-gold-400 bg-gold-500/10"}`}>
            {viewingOwn ? "👤 My Activity" : "⭐ All Activity"}
          </span>
          <span className="text-xs text-dark-500">{total} records</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : logs.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-dark-400 text-sm">No activity recorded yet.</p>
        </div>
      ) : (
        <>
          <div className="glass-card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider border-b border-surface-border">
              <div className="col-span-3">Action</div>
              <div className="col-span-3">By</div>
              <div className="col-span-4">Details</div>
              <div className="col-span-2">When</div>
            </div>

            <div className="divide-y divide-surface-border">
              {logs.map((log, i) => {
                const colorClass = ACTION_COLORS[log.action] ?? "text-dark-300 bg-dark-500/10 border-dark-500/30";
                const label = ACTION_LABELS[log.action] ?? log.action;
                let details = null;
                try { if (log.details) details = JSON.parse(log.details); } catch {}

                return (
                  <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-white/2 transition-colors">

                    {/* Action badge */}
                    <div className="col-span-3">
                      <span className={`text-xs px-2 py-1 rounded-lg border font-medium whitespace-nowrap ${colorClass}`}>
                        {label}
                      </span>
                    </div>

                    {/* Admin */}
                    <div className="col-span-3">
                      <p className="text-sm text-dark-100 font-medium truncate">{log.admin.name}</p>
                      <p className="text-xs text-dark-500 truncate">{log.admin.email}</p>
                    </div>

                    {/* Details */}
                    <div className="col-span-4">
                      {details && Object.keys(details).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(details).slice(0, 3).map(([k, v]) => (
                            <span key={k} className="text-xs px-2 py-0.5 rounded bg-surface-card border border-surface-border text-dark-400">
                              {k}: <span className="text-dark-200">{String(v)}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-dark-600">—</span>
                      )}
                      {log.ipAddress && (
                        <p className="text-xs text-dark-600 mt-0.5">IP: {log.ipAddress}</p>
                      )}
                    </div>

                    {/* Time */}
                    <div className="col-span-2 text-right">
                      <p className="text-xs text-dark-300">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-dark-500">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="btn-outline !py-1.5 !px-4 !text-sm disabled:opacity-40">← Prev</button>
              <span className="text-dark-400 text-sm">Page {page} of {pages}</span>
              <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages}
                className="btn-outline !py-1.5 !px-4 !text-sm disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
