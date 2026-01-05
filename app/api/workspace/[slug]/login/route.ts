import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPasscode } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const formData = await req.formData();
  const passcode = String(formData.get("passcode") || "");

  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) {
    return NextResponse.redirect(new URL(`/g/${slug}`, req.url));
  }

  const ok = await verifyPasscode(passcode, workspace.passcodeHash);

  const res = NextResponse.redirect(new URL(`/g/${slug}`, req.url));
  if (ok) {
    res.cookies.set(`wsp_${slug}`, "1", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return res;
}
