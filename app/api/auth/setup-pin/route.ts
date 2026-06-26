export const dynamic = "force-dynamic";
// app/api/auth/setup-pin/route.ts
// Step 1: Verify name + last 4 of National ID
// Step 2: Set a new 6-digit PIN (hashed)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST with action="verify" — check name + ID match, return employee if so
// POST with action="setPin" — actually save the new PIN
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, employeeId, nationalIdLast4, pin } = body;

    // ── STEP 1: Verify identity before allowing PIN creation ──
    if (action === "verify") {
      if (!employeeId || !nationalIdLast4) {
        return NextResponse.json({ error: "Missing employee or ID number." }, { status: 400 });
      }

      const employee = await prisma.employee.findUnique({
        where: { id: employeeId, isActive: true },
      });

      if (!employee) {
        return NextResponse.json({ error: "Employee not found." }, { status: 404 });
      }

      if (!employee.nationalIdLast4) {
        return NextResponse.json({
          error: "Your National ID has not been recorded yet. Please contact HR/ICT to set this up first."
        }, { status: 400 });
      }

      // Compare last 4 digits (trimmed, exact match)
      if (employee.nationalIdLast4.trim() !== nationalIdLast4.trim()) {
        return NextResponse.json({ error: "ID number does not match our records." }, { status: 401 });
      }

      // Already has a PIN?
      if (employee.pinHash) {
        return NextResponse.json({
          error: "You already have a PIN set up. Use 'Forgot PIN' if you need to reset it.",
          alreadyHasPin: true,
        }, { status: 409 });
      }

      // Verified! Allow them to proceed to set a PIN
      return NextResponse.json({
        success: true,
        employeeName: employee.name,
        employeeId: employee.id,
      });
    }

    // ── STEP 2: Actually create the PIN ───────────────────────
    if (action === "setPin") {
      if (!employeeId || !nationalIdLast4 || !pin) {
        return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
      }

      if (!/^\d{6}$/.test(pin)) {
        return NextResponse.json({ error: "PIN must be exactly 6 digits." }, { status: 400 });
      }

      const employee = await prisma.employee.findUnique({
        where: { id: employeeId, isActive: true },
      });

      if (!employee) {
        return NextResponse.json({ error: "Employee not found." }, { status: 404 });
      }

      // Re-verify ID match (don't trust client state alone)
      if (!employee.nationalIdLast4 || employee.nationalIdLast4.trim() !== nationalIdLast4.trim()) {
        return NextResponse.json({ error: "Verification expired. Please start again." }, { status: 401 });
      }

      if (employee.pinHash) {
        return NextResponse.json({ error: "PIN already set. Use reset instead." }, { status: 409 });
      }

      // Reject weak/sequential PINs
      const weakPins = ["123456", "111111", "000000", "654321", "222222", "333333", "444444", "555555", "666666", "777777", "888888", "999999", "121212"];
      if (weakPins.includes(pin)) {
        return NextResponse.json({ error: "This PIN is too easy to guess. Please choose a different one." }, { status: 400 });
      }

      const pinHash = await bcrypt.hash(pin, 10);

      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          pinHash,
          pinSetAt: new Date(),
          failedPinAttempts: 0,
          pinLockedUntil: null,
        },
      });

      return NextResponse.json({ success: true, message: "PIN created successfully! You can now vote." });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("[POST /api/auth/setup-pin]", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
