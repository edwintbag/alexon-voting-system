// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ admin });
}
