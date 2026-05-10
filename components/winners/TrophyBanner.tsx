// components/winners/TrophyBanner.tsx — with real logo
"use client";

import { motion } from "framer-motion";

const LOGO_URL = "https://lh3.googleusercontent.com/d/1TuIn-uqVHCU041-lNSFgrnYk17w5Yacb";

export default function TrophyBanner() {
  return (
    <div className="relative overflow-hidden bg-surface py-16 border-b border-surface-border">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,151,44,0.12)_0%,transparent_65%)]" />
      <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hex-w" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon points="30,2 58,17 58,45 30,60 2,45 2,17" fill="none" stroke="#C9972C" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-w)" />
      </svg>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex w-20 h-20 rounded-2xl overflow-hidden bg-dark-800 shadow-gold-lg mb-6 items-center justify-center"
        >
          <img
            src={LOGO_URL}
            alt="Alexon Group"
            className="w-full h-full object-contain p-1"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement!.innerHTML = '<span class="text-4xl">🏆</span>';
            }}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-2">Alexon Group Ltd</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-dark-50 mb-3">
            Employee of the{" "}
            <span className="text-transparent bg-clip-text bg-gold-gradient">Month</span>
          </h1>
          <div className="gold-line w-40 mx-auto my-4" />
          <p className="text-dark-400 max-w-lg mx-auto text-sm leading-relaxed">
            Recognising excellence, dedication, and outstanding performance across
            all departments at Alexon Group.
          </p>
          <p className="text-dark-600 text-xs mt-2 italic">"Your trusted partner for growth and sustainability"</p>
        </motion.div>
      </div>
    </div>
  );
}
