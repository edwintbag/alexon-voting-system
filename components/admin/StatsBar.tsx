// components/admin/StatsBar.tsx
"use client";

import { motion } from "framer-motion";

interface Props {
  totalVotes: number;
  uniqueVoters: number;
  month: string;
  year: number;
}

export default function StatsBar({ totalVotes, uniqueVoters, month, year }: Props) {
  const stats = [
    {
      label: "Total Votes Cast",
      value: totalVotes,
      icon: "🗳️",
      color: "text-gold-400",
    },
    {
      label: "Unique Voters",
      value: uniqueVoters,
      icon: "👥",
      color: "text-blue-400",
    },
    {
      label: "Voting Period",
      value: `${month} ${year}`,
      icon: "📅",
      color: "text-green-400",
      isText: true,
    },
    {
      label: "Categories",
      value: 3,
      icon: "🏷️",
      color: "text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="glass-card p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-dark-400 font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                {stat.isText ? stat.value : stat.value.toLocaleString()}
              </p>
            </div>
            <span className="text-2xl opacity-60">{stat.icon}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
