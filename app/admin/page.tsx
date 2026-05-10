// app/admin/page.tsx — v3 with Employees + Categories management
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import AlexonHeader from "@/components/ui/AlexonHeader";
import LeaderboardTable from "@/components/admin/LeaderboardTable";
import StatsBar from "@/components/admin/StatsBar";
import VoteChart from "@/components/admin/VoteChart";
import AccountsPanel from "@/components/admin/AccountsPanel";
import InvitePanel from "@/components/admin/InvitePanel";
import AuditLogsPanel from "@/components/admin/AuditLogsPanel";
import EmployeesPanel from "@/components/admin/EmployeesPanel";
import CategoriesPanel from "@/components/admin/CategoriesPanel";
import VotingSchedulePanel from "@/components/admin/VotingSchedulePanel";
import PublishWinnersPanel from "@/components/admin/PublishWinnersPanel";
import BackupPanel from "@/components/admin/BackupPanel";
import CommentModerationPanel from "@/components/admin/CommentModerationPanel";

interface AdminUser { id: string; email: string; name: string; role: "SUPER_ADMIN" | "ADMIN"; }
type Tab = "dashboard" | "employees" | "categories" | "schedule" | "publish" | "comments" | "backup" | "accounts" | "invites" | "audit";
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function AdminPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json())
      .then(d => { if (d.admin) setAdmin(d.admin); else router.push("/auth/login"); })
      .catch(() => router.push("/auth/login"))
      .finally(() => setAuthLoading(false));
  }, [router]);

  const fetchResults = useCallback(async () => {
    if (!admin) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/results?month=${month}&year=${year}`);
      if (res.status === 401) { router.push("/auth/login"); return; }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setData(json);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [admin, month, year, router]);

  useEffect(() => { if (admin) fetchResults(); }, [admin, fetchResults]);

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/auth/login"); };

  if (authLoading) return <div className="min-h-screen bg-dark-950 flex items-center justify-center"><div className="text-gold-400 text-sm animate-pulse">Authenticating...</div></div>;
  if (!admin) return null;

  const isSuperAdmin = admin.role === "SUPER_ADMIN";
  const tabs: { id: Tab; label: string; icon: string; superOnly?: boolean }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "employees", label: "Employees", icon: "👤" },
    { id: "categories", label: "Categories", icon: "🏷️", superOnly: true },
    { id: "schedule", label: "Voting Schedule", icon: "📅", superOnly: true },
    { id: "publish", label: "Publish Winners", icon: "🏆", superOnly: true },
    { id: "comments", label: "Comments", icon: "💬", superOnly: true },
    { id: "backup", label: "Backup", icon: "🗄️", superOnly: true },
    { id: "accounts", label: "Admin Accounts", icon: "👥", superOnly: true },
    { id: "invites", label: "Invite Codes", icon: "🔗", superOnly: true },
    { id: "audit", label: "Audit Logs", icon: "📋" },
  ];

  const categoryKeys = data ? Object.keys(data.results) : [];

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="h-[2px] bg-gold-gradient" />
      <AlexonHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-dark-50">Admin Dashboard</h1>
            <p className="text-dark-400 text-sm mt-1">
              Welcome, <span className="text-gold-400">{admin.name}</span> ·{" "}
              <span className={`text-xs px-2 py-0.5 rounded-full border ${isSuperAdmin ? "border-gold-500/40 text-gold-400 bg-gold-500/10" : "border-blue-500/40 text-blue-400 bg-blue-500/10"}`}>
                {isSuperAdmin ? "⭐ Super Admin" : "Admin"}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {activeTab === "dashboard" && (
              <>
                <select className="input-field !py-2 !text-sm w-36" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select className="input-field !py-2 !text-sm w-28" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button onClick={fetchResults} className="btn-outline !py-2 !px-4 !text-sm">↻ Refresh</button>
                <button onClick={() => window.open(`/api/admin/export?month=${month}&year=${year}`, "_blank")} className="btn-gold !py-2 !px-4 !text-sm">⬇ Export CSV</button>
              </>
            )}
            <button onClick={handleLogout} className="px-4 py-2 text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">Sign Out</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-8 border-b border-surface-border pb-4">
          {tabs.filter(t => !t.superOnly || isSuperAdmin).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id ? "bg-gold-500 text-dark-950" : "bg-surface-card border border-surface-border text-dark-300 hover:border-gold-500/40"}`}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {data && <StatsBar totalVotes={data.totalVotes} uniqueVoters={data.uniqueVoters} month={MONTHS[data.month - 1]} year={data.year} />}
              {loading && <div className="space-y-4 mt-6">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>}
              {error && <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">❌ {error}</div>}
              {data && !loading && (
                <>
                  <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6"><VoteChart data={data} /></div>
                  <div className="mt-8">
                    <div className="flex gap-2 flex-wrap mb-6">
                      {["ALL", ...categoryKeys].map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeCategory === cat ? "bg-gold-500 text-dark-950" : "bg-surface-card border border-surface-border text-dark-300 hover:border-gold-500/40"}`}>
                          {cat === "ALL" ? "All Categories" : cat}
                        </button>
                      ))}
                    </div>
                    {activeCategory === "ALL" ? (
                      <div className="space-y-8">
                        {categoryKeys.map(cat => (
                          <div key={cat}>
                            <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-3">{cat}</h3>
                            <LeaderboardTable results={data.results[cat] ?? []} />
                          </div>
                        ))}
                      </div>
                    ) : <LeaderboardTable results={data.results[activeCategory] ?? []} />}
                  </div>
                </>
              )}
            </motion.div>
          )}
          {activeTab === "employees" && (
            <motion.div key="employees" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <EmployeesPanel isSuperAdmin={isSuperAdmin} />
            </motion.div>
          )}
          {activeTab === "schedule" && isSuperAdmin && (
            <motion.div key="schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <VotingSchedulePanel />
            </motion.div>
          )}
          {activeTab === "categories" && isSuperAdmin && (
            <motion.div key="categories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <CategoriesPanel />
            </motion.div>
          )}
          {activeTab === "publish" && isSuperAdmin && (
            <motion.div key="publish" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <PublishWinnersPanel />
            </motion.div>
          )}
          {activeTab === "comments" && isSuperAdmin && (
            <motion.div key="comments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <CommentModerationPanel />
            </motion.div>
          )}
          {activeTab === "backup" && isSuperAdmin && (
            <motion.div key="backup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <BackupPanel />
            </motion.div>
          )}
          {activeTab === "accounts" && isSuperAdmin && (
            <motion.div key="accounts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <AccountsPanel currentAdminId={admin.id} />
            </motion.div>
          )}
          {activeTab === "invites" && isSuperAdmin && (
            <motion.div key="invites" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <InvitePanel />
            </motion.div>
          )}
          {activeTab === "audit" && (
            <motion.div key="audit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <AuditLogsPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
