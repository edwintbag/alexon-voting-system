// app/api/admin/voting-schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest, logAudit } from "@/lib/auth";

// GET — current schedule
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schedule = await prisma.votingSchedule.findFirst({ where: { isActive: true } });
  if (!schedule) {
    // Create default if none exists
    const def = await prisma.votingSchedule.create({
      data: { recurringStartDay: 25, recurringEndDay: 30, recurringStartHour: 8, recurringEndHour: 17 },
    });
    return NextResponse.json({ schedule: def });
  }
  return NextResponse.json({ schedule });
}

// PATCH — update schedule or toggle override
export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden — Super Admin only" }, { status: 403 });

  const body = await req.json();
  const {
    recurringStartDay, recurringEndDay, recurringStartHour, recurringEndHour,
    isManualOverride, manualIsOpen, overrideReason,
  } = body;

  const schedule = await prisma.votingSchedule.findFirst({ where: { isActive: true } });
  if (!schedule) return NextResponse.json({ error: "No schedule found" }, { status: 404 });

  const updated = await prisma.votingSchedule.update({
    where: { id: schedule.id },
    data: {
      ...(recurringStartDay !== undefined && { recurringStartDay }),
      ...(recurringEndDay !== undefined && { recurringEndDay }),
      ...(recurringStartHour !== undefined && { recurringStartHour }),
      ...(recurringEndHour !== undefined && { recurringEndHour }),
      ...(typeof isManualOverride === "boolean" && { isManualOverride }),
      ...(typeof manualIsOpen === "boolean" && { manualIsOpen }),
      ...(overrideReason !== undefined && { overrideReason }),
      ...(typeof isManualOverride === "boolean" && isManualOverride && {
        overrideSetAt: new Date(),
        overrideSetById: admin.id,
      }),
    },
  });

  // Audit log
  const action = typeof isManualOverride === "boolean"
    ? isManualOverride
      ? manualIsOpen ? "VOTING_FORCE_OPENED" : "VOTING_FORCE_CLOSED"
      : "VOTING_OVERRIDE_REMOVED"
    : "VOTING_SCHEDULE_UPDATED";

  await logAudit(admin.id, action, { recurringStartDay, recurringEndDay, manualIsOpen, overrideReason });
  return NextResponse.json({ success: true, schedule: updated });
}
