export const dynamic = "force-dynamic";
// app/api/admin/voting-schedule/route.ts — full schedule control
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest, logAudit } from "@/lib/auth";
import { getVotingWindowStatus } from "@/lib/scoring";

// GET — current schedule + status
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const schedule = await prisma.votingSchedule.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const status = await getVotingWindowStatus();

    // Get all past schedules for history
    const history = await prisma.votingSchedule.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ schedule, status, history });
  } catch (error) {
    console.error("[GET /api/admin/voting-schedule]", error);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

// POST — create a new schedule
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { label, startDateTime, endDateTime } = await req.json();

  if (!label || !startDateTime || !endDateTime) {
    return NextResponse.json({ error: "Label, start date and end date are required" }, { status: 400 });
  }

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  if (end <= start) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
  }

  try {
    // Deactivate all existing schedules
    await prisma.votingSchedule.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new schedule
    const schedule = await prisma.votingSchedule.create({
      data: {
        label,
        startDateTime: start,
        endDateTime: end,
        isManualOpen: false,
        isManualClosed: false,
        isActive: true,
        createdById: admin.id,
      },
    });

    await logAudit(admin.id, "CREATE_VOTING_SCHEDULE", {
      label,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
    });

    return NextResponse.json({ success: true, schedule });
  } catch (error: any) {
    console.error("[POST /api/admin/voting-schedule]", error);
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
  }
}

// PATCH — update override (open/close manually) or edit existing schedule
export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, reason, label, startDateTime, endDateTime } = body;

  try {
    const schedule = await prisma.votingSchedule.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!schedule) {
      return NextResponse.json({ error: "No active schedule found. Create one first." }, { status: 404 });
    }

    let updateData: any = {};
    let auditAction = "";

    switch (action) {
      case "MANUAL_OPEN":
        updateData = { isManualOpen: true, isManualClosed: false, overrideReason: reason || null };
        auditAction = "MANUAL_OPEN_VOTING";
        break;

      case "MANUAL_CLOSE":
        updateData = { isManualClosed: true, isManualOpen: false, overrideReason: reason || null };
        auditAction = "MANUAL_CLOSE_VOTING";
        break;

      case "CLEAR_OVERRIDE":
        updateData = { isManualOpen: false, isManualClosed: false, overrideReason: null };
        auditAction = "CLEAR_VOTING_OVERRIDE";
        break;

      case "EDIT":
        // Edit start/end dates
        if (!startDateTime || !endDateTime) {
          return NextResponse.json({ error: "Start and end dates required" }, { status: 400 });
        }
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        if (end <= start) {
          return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
        }
        updateData = {
          label: label || schedule.label,
          startDateTime: start,
          endDateTime: end,
          isManualOpen: false,
          isManualClosed: false,
          overrideReason: null,
        };
        auditAction = "EDIT_VOTING_SCHEDULE";
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.votingSchedule.update({
      where: { id: schedule.id },
      data: updateData,
    });

    await logAudit(admin.id, auditAction, { scheduleId: schedule.id, reason, ...updateData });

    const status = await getVotingWindowStatus();
    return NextResponse.json({ success: true, schedule: updated, status });
  } catch (error: any) {
    console.error("[PATCH /api/admin/voting-schedule]", error);
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
  }
}
