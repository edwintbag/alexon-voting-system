// components/ui/AlexonHeader.tsx — with real Alexon logo
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

const LOGO_URL = "https://lh3.googleusercontent.com/d/1TuIn-uqVHCU041-lNSFgrnYk17w5Yacb";

export default function AlexonHeader() {
  return (
    <header className="border-b border-surface-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-800 flex items-center justify-center">
              <img
                src={LOGO_URL}
                alt="Alexon Group Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to text if image fails
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement!.innerHTML = '<span class="text-gold-400 font-display font-bold text-lg">A</span>';
                }}
              />
            </div>
            <div>
              <span className="font-display text-gold-400 text-lg font-semibold tracking-wide">
                Alexon Group
              </span>
              <p className="text-dark-400 text-xs leading-none">Employee of the Month</p>
            </div>
          </motion.div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3">
          <Link href="/vote" className="text-sm text-dark-300 hover:text-gold-400 transition-colors px-2 py-1">
            Vote
          </Link>
          <Link href="/winners" className="text-sm text-dark-300 hover:text-gold-400 transition-colors px-2 py-1">
            Winners
          </Link>
          <Link href="/hall-of-fame" className="text-sm text-dark-300 hover:text-gold-400 transition-colors px-2 py-1 hidden sm:block">
            Hall of Fame
          </Link>
          <Link href="/admin">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="text-xs px-3 py-1.5 rounded-lg border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 transition-colors"
            >
              Admin
            </motion.button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
