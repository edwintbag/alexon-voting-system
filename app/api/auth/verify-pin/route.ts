export const dynamic = "force-dynamic";
// app/api/auth/verify-pin/route.ts — used during voting flow
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

export async function POST(req: NextRequest) {
  try {
    const { employeeId, pin } = await req.json();

    if (!employeeId || !pin) {
      return NextResponse.json({ error: "Missing employee or PIN." }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, isActive: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    if (!employee.pinHash) {
      return NextResponse.json({
        error: "You have not set up a PIN yet. Please set up your PIN first.",
        needsSetup: true,
      }, { status: 400 });
    }

    // ── Check lockout ──────────────────────────────────
    if (employee.pinLockedUntil && new Date(employee.pinLockedUntil) > new Date()) {
      const minutesLeft = Math.ceil((new Date(employee.pinLockedUntil).getTime() - Date.now()) / 60000);
      return NextResponse.json({
        error: `Too many failed attempts. Your account is locked for ${minutesLeft} more minute(s). Please try again later or contact ICT.`,
        locked: true,
      }, { status: 423 });
    }

    // ── Verify PIN ──────────────────────────────────────
    const isValid = await bcrypt.compare(pin, employee.pinHash);

    if (!isValid) {
      const newAttempts = employee.failedPinAttempts + 1;
      const shouldLock = newAttempts >= MAX_ATTEMPTS;

      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          failedPinAttempts: shouldLock ? 0 : newAttempts,
          pinLockedUntil: shouldLock
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60000)
            : null,
        },
      });

      if (shouldLock) {
        return NextResponse.json({
          error: `Incorrect PIN. Too many failed attempts — your account is now locked for ${LOCKOUT_MINUTES} minutes.`,
          locked: true,
        }, { status: 423 });
      }

      const remaining = MAX_ATTEMPTS - newAttempts;
      return NextResponse.json({
        error: `Incorrect PIN. ${remaining} attempt(s) remaining before lockout.`,
      }, { status: 401 });
    }

    // ── Success — reset failed attempts ────────────────
    await prisma.employee.update({
      where: { id: employeeId },
      data: { failedPinAttempts: 0, pinLockedUntil: null },
    });

    return NextResponse.json({
      success: true,
      employeeName: employee.name,
      employeeId: employee.id,
      staffNumber: employee.staffNumber,
    });
  } catch (error: any) {
    console.error("[POST /api/auth/verify-pin]", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
