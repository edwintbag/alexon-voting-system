// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getVotingWindowInfo } from "@/lib/scoring";

// Decorative hexagon SVG
function HexPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-5"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="hex"
          x="0"
          y="0"
          width="60"
          height="52"
          patternUnits="userSpaceOnUse"
        >
          <polygon
            points="30,2 58,17 58,45 30,60 2,45 2,17"
            fill="none"
            stroke="#C9972C"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
    </svg>
  );
}

export default function HomePage() {
  const [windowInfo, setWindowInfo] = useState<{
    isOpen: boolean;
    message: string;
    start: number;
    end: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/voting-status")
      .then((r) => r.json())
      .then(setWindowInfo);
  }, []);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <HexPattern />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,151,44,0.08)_0%,transparent_70%)]" />

      {/* Top gold line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gold-gradient" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        {/* Logo / Brand */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-gold-gradient flex items-center justify-center">
              <span className="text-dark-950 font-display font-bold text-xl">A</span>
            </div>
            <span className="font-display text-gold-400 text-2xl font-semibold tracking-wide">
              Alexon Group
            </span>
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
            <span className="text-transparent bg-clip-text bg-gold-gradient">
              Month
            </span>
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
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
                windowInfo.isOpen
                  ? "border-green-500/40 bg-green-500/10 text-green-400"
                  : "border-gold-500/40 bg-gold-500/10 text-gold-400"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  windowInfo.isOpen ? "bg-green-400 animate-pulse" : "bg-gold-400"
                }`}
              />
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
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-gold text-base px-10 py-4 text-lg"
              disabled={windowInfo && !windowInfo.isOpen}
            >
              Cast Your Vote
            </motion.button>
          </Link>
          <Link href="/admin">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-outline text-base px-10 py-4"
            >
              Admin Dashboard
            </motion.button>
          </Link>
        </motion.div>

        {/* Voting period info */}
        {windowInfo && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-dark-400 text-sm"
          >
            Voting opens every month from the{" "}
            <span className="text-gold-400">{windowInfo.start}th</span> to the{" "}
            <span className="text-gold-400">{windowInfo.end}th</span>
          </motion.p>
        )}
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-gradient opacity-30" />

      {/* Category pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 flex-wrap px-6"
      >
        {[
          "Block/Cabros Production",
          "Non-Machine Production",
          "Team Leader",
        ].map((cat) => (
          <span
            key={cat}
            className="text-xs text-dark-400 border border-surface-border px-3 py-1 rounded-full"
          >
            {cat}
          </span>
        ))}
      </motion.div>
    </main>
  );
}
