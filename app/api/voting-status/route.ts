// app/api/voting-status/route.ts — uses DB schedule
import { NextResponse } from "next/server";
import { getVotingWindowStatus } from "@/lib/scoring";

export async function GET() {
  const status = await getVotingWindowStatus();
  return NextResponse.json(status);
}
