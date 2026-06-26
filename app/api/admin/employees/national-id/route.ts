export const dynamic = "force-dynamic";
// app/api/admin/employees/national-id/route.ts
// Admin sets National ID last-4 for employees, and can reset PINs
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest, logAudit } from "@/lib/auth";

// PATCH — set national ID last4 for one employee, OR reset their PIN
export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { employeeId, nationalIdLast4, resetPin } = body;

  if (!employeeId) return NextResponse.json({ error: "Employee ID required" }, { status: 400 });

  const updateData: any = {};

  if (nationalIdLast4 !== undefined) {
    if (nationalIdLast4 && !/^\d{4}$/.test(nationalIdLast4)) {
      return NextResponse.json({ error: "National ID last 4 digits must be exactly 4 digits" }, { status: 400 });
    }
    updateData.nationalIdLast4 = nationalIdLast4 || null;
  }

  if (resetPin) {
    updateData.pinHash = null;
    updateData.pinSetAt = null;
    updateData.failedPinAttempts = 0;
    updateData.pinLockedUntil = null;
  }

  const employee = await prisma.employee.update({
    where: { id: employeeId },
    data: updateData,
    select: { id: true, name: true, staffNumber: true, nationalIdLast4: true, pinHash: true },
  });

  await logAudit(admin.id, resetPin ? "RESET_EMPLOYEE_PIN" : "SET_EMPLOYEE_NATIONAL_ID", { employeeId, employeeName: employee.name });

  return NextResponse.json({
    success: true,
    employee: { ...employee, hasPinSet: !!employee.pinHash },
  });
}

// GET — list all employees with their PIN/ID status (for admin overview)
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, staffNumber: true, department: true,
      nationalIdLast4: true, pinHash: true, pinSetAt: true,
      failedPinAttempts: true, pinLockedUntil: true,
    },
    orderBy: { staffNumber: "asc" },
  });

  const result = employees.map(e => ({
    id: e.id,
    name: e.name,
    staffNumber: e.staffNumber,
    department: e.department,
    hasNationalId: !!e.nationalIdLast4,
    nationalIdLast4: e.nationalIdLast4,
    hasPinSet: !!e.pinHash,
    pinSetAt: e.pinSetAt,
    isLocked: e.pinLockedUntil ? new Date(e.pinLockedUntil) > new Date() : false,
    failedAttempts: e.failedPinAttempts,
  }));

  return NextResponse.json({ employees: result });
}
