// components/admin/AccountsPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Account {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  createdBy?: { name: string } | null;
}

export default function AccountsPanel({ currentAdminId }: { currentAdminId: string }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/accounts");
    const data = await res.json();
    setAccounts(data.accounts ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch("/api/admin/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    fetchAccounts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-bold text-dark-50">Admin Accounts</h2>
          <p className="text-dark-400 text-sm mt-1">Manage all admin users · Max 3 admins + 1 Super Admin</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-surface-border">
            {accounts.map((acc, i) => (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 px-5 py-4"
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${acc.role === "SUPER_ADMIN" ? "bg-gold-500 text-dark-950" : "bg-surface-border text-dark-300"}`}>
                  {acc.name.split(" ").slice(0,2).map((n: string) => n[0]).join("")}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-dark-100">{acc.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${acc.role === "SUPER_ADMIN" ? "border-gold-500/40 text-gold-400 bg-gold-500/10" : "border-blue-500/40 text-blue-400 bg-blue-500/10"}`}>
                      {acc.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                    </span>
                    {!acc.isActive && <span className="text-xs px-2 py-0.5 rounded-full border border-red-500/40 text-red-400 bg-red-500/10">Inactive</span>}
                  </div>
                  <p className="text-xs text-dark-400 mt-0.5">{acc.email}</p>
                  <p className="text-xs text-dark-600 mt-0.5">
                    Last login: {acc.lastLoginAt ? new Date(acc.lastLoginAt).toLocaleDateString() : "Never"}
                    {acc.createdBy && ` · Added by ${acc.createdBy.name}`}
                  </p>
                </div>

                {/* Actions */}
                {acc.id !== currentAdminId && acc.role !== "SUPER_ADMIN" && (
                  <button
                    onClick={() => toggleActive(acc.id, acc.isActive)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${acc.isActive ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-green-500/30 text-green-400 hover:bg-green-500/10"}`}
                  >
                    {acc.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
