// components/ui/CardWrapper.tsx
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function CardWrapper({ children, className = "" }: CardWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 md:p-8 shadow-card ${className}`}
    >
      {children}
    </motion.div>
  );
}
