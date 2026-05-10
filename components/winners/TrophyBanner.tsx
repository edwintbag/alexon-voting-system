// components/winners/TrophyBanner.tsx
"use client";

import { motion } from "framer-motion";

export default function TrophyBanner() {
  return (
    <div className="relative overflow-hidden bg-surface py-16 border-b border-surface-border">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,151,44,0.12)_0%,transparent_65%)]" />

      {/* Hex pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hex-w" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon points="30,2 58,17 58,45 30,60 2,45 2,17" fill="none" stroke="#C9972C" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-w)" />
      </svg>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Animated trophy */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex w-20 h-20 bg-gold-gradient rounded-full items-center justify-center shadow-gold-lg mb-6"
        >
          <span className="text-4xl">🏆</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-2">
            Alexon Group
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-dark-50 mb-3">
            Employee of the{" "}
            <span className="text-transparent bg-clip-text bg-gold-gradient">Month</span>
          </h1>
          <div className="gold-line w-40 mx-auto my-4" />
          <p className="text-dark-400 max-w-lg mx-auto text-sm leading-relaxed">
            Recognising excellence, dedication, and outstanding performance across
            all departments at Alexon Group.
          </p>
        </motion.div>

        {/* Floating stars */}
        {["⭐", "✨", "🌟", "⭐", "✨"].map((star, i) => (
          <motion.span
            key={i}
            className="absolute text-gold-400 opacity-30 text-lg"
            style={{ left: `${10 + i * 20}%`, top: `${20 + (i % 2) * 40}%` }}
            animate={{ y: [0, -10, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
          >
            {star}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
