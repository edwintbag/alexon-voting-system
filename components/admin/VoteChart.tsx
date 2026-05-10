// components/admin/VoteChart.tsx — v3 dynamic categories
"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

interface AdminResult {
  employeeName: string;
  totalVotes: number;
  averageRating: number;
  finalScore: number;
  rank: number;
}

interface AdminData {
  results: Record<string, AdminResult[]>;
}

const GOLD = "#C9972C";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-lg p-3 text-sm shadow-card">
        <p className="text-gold-400 font-semibold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-dark-200">
            {p.name}: <span className="text-gold-300 font-mono">
              {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function VoteChart({ data }: AdminData & { data: AdminData }) {
  // Use dynamic category names from results
  const categoryNames = Object.keys(data?.results ?? {});

  // Bar chart: votes per category
  const categoryVoteData = categoryNames.map((cat) => ({
    name: cat.length > 15 ? cat.substring(0, 15) + "..." : cat,
    fullName: cat,
    votes: (data.results[cat] ?? []).reduce((a, b) => a + b.totalVotes, 0),
  }));

  // Top performers across all categories (top 6 by finalScore)
  const allResults = categoryNames
    .flatMap((cat) =>
      (data.results[cat] ?? []).map((r) => ({
        name: r.employeeName.split(" ")[0],
        score: r.finalScore,
        rating: r.averageRating,
        votes: r.totalVotes,
      }))
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <>
      {/* Votes by category */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-dark-200 mb-4 flex items-center gap-2">
          <span className="text-gold-400">📊</span> Votes by Category
        </h3>
        {categoryVoteData.length === 0 ? (
          <p className="text-dark-500 text-sm text-center py-12">No votes recorded yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryVoteData} margin={{ left: -10 }}>
              <XAxis dataKey="name" tick={{ fill: "#76768a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#76768a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(201,151,44,0.05)" }} />
              <Bar dataKey="votes" name="Votes" radius={[4, 4, 0, 0]}>
                {categoryVoteData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? GOLD : "#2a2a40"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top performers */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-dark-200 mb-4 flex items-center gap-2">
          <span className="text-gold-400">🏆</span> Top Performers (Final Score)
        </h3>
        {allResults.length === 0 ? (
          <p className="text-dark-500 text-sm text-center py-12">No results available yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={allResults} margin={{ left: -10 }} layout="vertical">
              <XAxis type="number" domain={[0, 5]} tick={{ fill: "#76768a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#9d9dab", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(201,151,44,0.05)" }} />
              <Bar dataKey="score" name="Final Score" radius={[0, 4, 4, 0]}>
                {allResults.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? GOLD : i === 1 ? "#9d9dab" : "#46465a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}
