import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();

  if (!process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
  }

  if (password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set("pf_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return res;
}
