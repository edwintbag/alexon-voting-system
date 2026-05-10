// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, logAudit, COOKIE_OPTIONS } from "@/lib/auth";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password format" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Find admin
    const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Verify password
    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Create session
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;
    const token = await createSession(admin.id, ipAddress ?? undefined, userAgent ?? undefined);

    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await logAudit(admin.id, "LOGIN", { email: admin.email }, ipAddress ?? undefined);

    // Set cookie
    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });

    response.cookies.set({ ...COOKIE_OPTIONS, value: token });
    return response;
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
