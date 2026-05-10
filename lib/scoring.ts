// lib/scoring.ts — Alexon v3 with DB-driven voting schedule

import { prisma } from "@/lib/prisma";

// ── Scoring formula ───────────────────────────────────

export function computeFinalScore(avgRating: number, voteCount: number, maxVotesInCategory: number): number {
  const normalizedVotes = maxVotesInCategory > 0 ? (voteCount / maxVotesInCategory) * 5 : 0;
  return Math.round((avgRating * 0.7 + normalizedVotes * 0.3) * 100) / 100;
}

export function computeAvgRating(ratings: Record<string, number>): number {
  const values = Object.values(ratings).filter(v => typeof v === "number" && v >= 1 && v <= 5);
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

// ── Voting window — checks DB schedule ───────────────

export async function getVotingWindowStatus(): Promise<{
  isOpen: boolean;
  message: string;
  isManualOverride: boolean;
  schedule: { startDay: number; endDay: number; startHour: number; endHour: number } | null;
  overrideReason?: string | null;
}> {
  try {
    const schedule = await prisma.votingSchedule.findFirst({ where: { isActive: true } });

    if (!schedule) {
      return { isOpen: false, message: "No voting schedule configured.", isManualOverride: false, schedule: null };
    }

    // Manual override takes priority
    if (schedule.isManualOverride) {
      return {
        isOpen: schedule.manualIsOpen,
        message: schedule.manualIsOpen
          ? `Voting is open (manually opened by admin).${schedule.overrideReason ? " Reason: " + schedule.overrideReason : ""}`
          : `Voting is closed (manually closed by admin).${schedule.overrideReason ? " Reason: " + schedule.overrideReason : ""}`,
        isManualOverride: true,
        schedule: { startDay: schedule.recurringStartDay, endDay: schedule.recurringEndDay, startHour: schedule.recurringStartHour, endHour: schedule.recurringEndHour },
        overrideReason: schedule.overrideReason,
      };
    }

    // Check recurring schedule
    const now = new Date();
    const day = now.getDate();
    const hour = now.getHours();
    const { recurringStartDay: startDay, recurringEndDay: endDay, recurringStartHour: startHour, recurringEndHour: endHour } = schedule;

    let isOpen = false;
    if (day > startDay && day < endDay) {
      isOpen = true; // Full days in between
    } else if (day === startDay) {
      isOpen = hour >= startHour;
    } else if (day === endDay) {
      isOpen = hour < endHour;
    }

    const schedInfo = { startDay, endDay, startHour, endHour };

    if (isOpen) {
      return { isOpen: true, message: `Voting is open until the ${endDay}th at ${formatHour(endHour)}.`, isManualOverride: false, schedule: schedInfo };
    } else if (day < startDay) {
      return { isOpen: false, message: `Voting opens on the ${startDay}th at ${formatHour(startHour)}.`, isManualOverride: false, schedule: schedInfo };
    } else {
      return { isOpen: false, message: `Voting closed on the ${endDay}th. Results will be published soon.`, isManualOverride: false, schedule: schedInfo };
    }
  } catch {
    // Fallback to env-based check if DB unavailable
    const now = new Date();
    const day = now.getDate();
    const start = parseInt(process.env.VOTE_WINDOW_START ?? "25", 10);
    const end = parseInt(process.env.VOTE_WINDOW_END ?? "30", 10);
    const isOpen = day >= start && day <= end;
    return { isOpen, message: isOpen ? `Voting is open until the ${end}th.` : `Voting opens on the ${start}th.`, isManualOverride: false, schedule: null };
  }
}

export async function isVotingWindowOpenAsync(): Promise<boolean> {
  const status = await getVotingWindowStatus();
  return status.isOpen;
}

// Sync version for backwards compat (uses env vars)
export function isVotingWindowOpen(): boolean {
  const now = new Date();
  const day = now.getDate();
  const start = parseInt(process.env.VOTE_WINDOW_START ?? "25", 10);
  const end = parseInt(process.env.VOTE_WINDOW_END ?? "30", 10);
  return day >= start && day <= end;
}

export function getCurrentVotePeriod(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function formatHour(hour: number): string {
  if (hour === 0) return "12:00 AM";
  if (hour === 12) return "12:00 PM";
  return hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
}
