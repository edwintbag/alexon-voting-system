-- Migration: Update voting_schedules table for exact date/time control
-- Run this in Neon SQL editor if db:push doesn't auto-migrate

-- Drop old table if exists
DROP TABLE IF EXISTS "voting_schedules";

-- Create new table
CREATE TABLE "voting_schedules" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "startDateTime" TIMESTAMP(3) NOT NULL,
  "endDateTime" TIMESTAMP(3) NOT NULL,
  "isManualOpen" BOOLEAN NOT NULL DEFAULT false,
  "isManualClosed" BOOLEAN NOT NULL DEFAULT false,
  "overrideReason" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "voting_schedules_pkey" PRIMARY KEY ("id")
);
