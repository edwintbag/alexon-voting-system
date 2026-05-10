// app/page.tsx — Landing page with real Alexon logo
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const LOGO_URL = "https://lh3.googleusercontent.com/d/1TuIn-uqVHCU041-lNSFgrnYk17w5Yacb";

function HexPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hex" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
          <polygon points="30,2 58,17 58,45 30,60 2,45 2,17" fill="none" stroke="#C9972C" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
    </svg>
  );
}

export default function HomePage() {
  const [windowInfo, setWindowInfo] = useState<{ isOpen: boolean; message: string; start: number; end: number } | null>(null);

  useEffect(() => {
    fetch("/api/voting-status").then(r => r.json()).then(setWindowInfo);
  }, []);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <HexPattern />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,151,44,0.08)_0%,transparent_70%)]" />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gold-gradient" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* Real Alexon Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="inline-flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-dark-800 shadow-gold flex items-center justify-center">
              <img
                src={LOGO_URL}
                alt="Alexon Group"
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement!.innerHTML = '<span class="text-gold-400 font-display font-bold text-4xl">A</span>';
                }}
              />
            </div>
            <span className="font-display text-gold-400 text-2xl font-semibold tracking-wide">
              Alexon Group Ltd
            </span>
            <p className="text-dark-500 text-xs italic">"Your trusted partner for growth and sustainability"</p>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="font-display text-5xl md:text-6xl font-bold text-dark-50 mb-4 leading-tight">
            Employee of the{" "}
            <span className="text-transparent bg-clip-text bg-gold-gradient">Month</span>
          </h1>
          <div className="gold-line my-6 mx-auto w-40" />
          <p className="text-dark-300 text-lg leading-relaxed mb-2">
            Recognising excellence across our teams in Construction Materials,
            Equipment Hire, Agribusiness, and Real Estate.
          </p>
        </motion.div>

        {/* Voting window status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 mb-10"
        >
          {windowInfo ? (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${windowInfo.isOpen ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-gold-500/40 bg-gold-500/10 text-gold-400"}`}>
              <span className={`w-2 h-2 rounded-full ${windowInfo.isOpen ? "bg-green-400 animate-pulse" : "bg-gold-400"}`} />
              {windowInfo.message}
            </div>
          ) : (
            <div className="inline-block skeleton h-8 w-64 rounded-full" />
          )}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/vote">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn-gold text-base px-10 py-4 text-lg">
              Cast Your Vote
            </motion.button>
          </Link>
          <Link href="/winners">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn-outline text-base px-10 py-4">
              View Winners
            </motion.button>
          </Link>
        </motion.div>

        {/* Voting period info */}
        {windowInfo && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-dark-400 text-sm"
          >
            Voting opens every month from the{" "}
            <span className="text-gold-400">{windowInfo.start}th</span> to the{" "}
            <span className="text-gold-400">{windowInfo.end}th</span>
          </motion.p>
        )}

        {/* Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 flex justify-center gap-6"
        >
          <Link href="/hall-of-fame" className="text-xs text-dark-500 hover:text-gold-400 transition-colors">
            🏛️ Hall of Fame
          </Link>
          <Link href="/admin" className="text-xs text-dark-500 hover:text-gold-400 transition-colors">
            🔐 Admin Portal
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-gradient opacity-30" />
    </main>
  );
}
