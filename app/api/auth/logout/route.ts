// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deleteSession, COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_OPTIONS.name)?.value;
  if (token) await deleteSession(token);

  const response = NextResponse.json({ success: true });
  response.cookies.set({ ...COOKIE_OPTIONS, value: "", maxAge: 0 });
  return response;
}
