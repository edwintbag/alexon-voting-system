// lib/scoring.ts — Alexon v9 — Proper voting window with exact dates

import { prisma } from "@/lib/prisma";

// ── Max possible total score ──────────────────────────
export const MAX_TOTAL_SCORE = 25;

// ── Compute total score from ratings map ─────────────
export function computeTotalScore(ratings: Record<string, number>): number {
  const values = Object.values(ratings).filter(
    (v) => typeof v === "number" && v >= 1 && v <= 5
  );
  return values.reduce((a, b) => a + b, 0);
}

// ── Compute average rating ────────────────────────────
export function computeAvgRating(ratings: Record<string, number>): number {
  const values = Object.values(ratings).filter(
    (v) => typeof v === "number" && v >= 1 && v <= 5
  );
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

// ── Final Score Formula ───────────────────────────────
// finalScore = (totalScore × 70%) + (normalizedVotes × 30%)
export function computeFinalScore(
  totalScore: number,
  voteCount: number,
  maxVotesInCategory: number
): number {
  const normalizedVotes =
    maxVotesInCategory > 0
      ? (voteCount / maxVotesInCategory) * MAX_TOTAL_SCORE
      : 0;
  const score = totalScore * 0.7 + normalizedVotes * 0.3;
  return Math.round(score * 100) / 100;
}

// ── Voting Window Status ──────────────────────────────
export interface VotingWindowStatus {
  isOpen: boolean;
  message: string;
  reason: "MANUAL_OPEN" | "MANUAL_CLOSED" | "SCHEDULED_OPEN" | "SCHEDULED_CLOSED" | "NO_SCHEDULE";
  schedule: {
    label: string;
    startDateTime: string;
    endDateTime: string;
    isManualOpen: boolean;
    isManualClosed: boolean;
    overrideReason: string | null;
  } | null;
}

export async function getVotingWindowStatus(): Promise<VotingWindowStatus> {
  try {
    // Get the active schedule (most recently created)
    const schedule = await prisma.votingSchedule.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!schedule) {
      return {
        isOpen: false,
        message: "No voting schedule has been configured.",
        reason: "NO_SCHEDULE",
        schedule: null,
      };
    }

    const schedInfo = {
      label: schedule.label,
      startDateTime: schedule.startDateTime.toISOString(),
      endDateTime: schedule.endDateTime.toISOString(),
      isManualOpen: schedule.isManualOpen,
      isManualClosed: schedule.isManualClosed,
      overrideReason: schedule.overrideReason,
    };

    // ── Manual CLOSED takes highest priority ──────────
    if (schedule.isManualClosed) {
      return {
        isOpen: false,
        message: schedule.overrideReason
          ? `Voting has been closed by admin. Reason: ${schedule.overrideReason}`
          : "Voting has been closed by admin.",
        reason: "MANUAL_CLOSED",
        schedule: schedInfo,
      };
    }

    // ── Manual OPEN overrides schedule ────────────────
    if (schedule.isManualOpen) {
      return {
        isOpen: true,
        message: schedule.overrideReason
          ? `Voting is open (manually opened). Reason: ${schedule.overrideReason}`
          : "Voting is open (manually opened by admin).",
        reason: "MANUAL_OPEN",
        schedule: schedInfo,
      };
    }

    // ── Check against exact scheduled dates ───────────
    const now = new Date();
    const start = new Date(schedule.startDateTime);
    const end = new Date(schedule.endDateTime);

    if (now >= start && now <= end) {
      // Format end date nicely
      const endFormatted = end.toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      });
      const endTime = end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      return {
        isOpen: true,
        message: `Voting is open until ${endFormatted} at ${endTime}.`,
        reason: "SCHEDULED_OPEN",
        schedule: schedInfo,
      };
    }

    if (now < start) {
      const startFormatted = start.toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      });
      const startTime = start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      return {
        isOpen: false,
        message: `Voting opens on ${startFormatted} at ${startTime}.`,
        reason: "SCHEDULED_CLOSED",
        schedule: schedInfo,
      };
    }

    // Past end date
    const endFormatted = end.toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric"
    });
    return {
      isOpen: false,
      message: `Voting closed on ${endFormatted}. Results will be published soon.`,
      reason: "SCHEDULED_CLOSED",
      schedule: schedInfo,
    };
  } catch (error) {
    console.error("[getVotingWindowStatus]", error);
    return {
      isOpen: false,
      message: "Unable to check voting schedule. Please try again.",
      reason: "NO_SCHEDULE",
      schedule: null,
    };
  }
}

export async function isVotingWindowOpenAsync(): Promise<boolean> {
  const status = await getVotingWindowStatus();
  return status.isOpen;
}

export function getCurrentVotePeriod(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}
