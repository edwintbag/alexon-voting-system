export const dynamic = "force-dynamic";
// app/api/voting-status/route.ts — public status check
import { NextResponse } from "next/server";
import { getVotingWindowStatus } from "@/lib/scoring";

export async function GET() {
  try {
    const status = await getVotingWindowStatus();
    return NextResponse.json({
      isOpen: status.isOpen,
      message: status.message,
      reason: status.reason,
      schedule: status.schedule,
      // For landing page display
      start: status.schedule?.startDateTime ?? null,
      end: status.schedule?.endDateTime ?? null,
    });
  } catch (error) {
    console.error("[GET /api/voting-status]", error);
    return NextResponse.json({ isOpen: false, message: "Unable to check voting status." });
  }
}
