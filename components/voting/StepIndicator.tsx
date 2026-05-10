// components/voting/StepIndicator.tsx
"use client";

import { motion } from "framer-motion";

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
  completedSteps: number;
  onStepClick: (step: 1 | 2 | 3 | 4 | 5) => void;
}

export default function StepIndicator({
  currentStep,
  steps,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop: full labels */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-0 right-0 h-[1px] bg-surface-border" />
        <motion.div
          className="absolute top-4 left-0 h-[1px] bg-gold-gradient"
          initial={{ width: "0%" }}
          animate={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isClickable = stepNum <= currentStep;

          return (
            <div key={label} className="flex flex-col items-center relative z-10">
              <motion.button
                onClick={() =>
                  isClickable && stepNum <= completedSteps + 1
                    ? onStepClick(stepNum as 1 | 2 | 3 | 4 | 5)
                    : null
                }
                className={`step-dot ${
                  isCompleted
                    ? "bg-gold-500 text-dark-950 cursor-pointer"
                    : isCurrent
                    ? "bg-surface-card border-2 border-gold-500 text-gold-400"
                    : "bg-surface-card border border-surface-border text-dark-400"
                }`}
                whileHover={isClickable ? { scale: 1.1 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
              >
                {isCompleted ? (
                  <CheckIcon />
                ) : (
                  <span className="text-xs">{stepNum}</span>
                )}
              </motion.button>
              <span
                className={`mt-2 text-xs font-medium whitespace-nowrap ${
                  isCurrent
                    ? "text-gold-400"
                    : isCompleted
                    ? "text-dark-300"
                    : "text-dark-500"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile: compact */}
      <div className="flex sm:hidden items-center gap-3">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 < currentStep
                  ? "bg-gold-500 w-6"
                  : i + 1 === currentStep
                  ? "bg-gold-400 w-8"
                  : "bg-surface-border w-4"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-dark-400">
          Step <span className="text-gold-400">{currentStep}</span> of{" "}
          {steps.length} — <span className="text-dark-200">{steps[currentStep - 1]}</span>
        </span>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M2.5 7L5.5 10L11.5 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
