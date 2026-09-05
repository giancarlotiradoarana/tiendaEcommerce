import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, guardResponse } from "@/lib/guard";

export async function GET() {
  try {
    await requireAdmin();
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(coupons);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const d = await req.json();
    if (!d.code || !d.value) {
      return NextResponse.json({ error: "Código y valor son obligatorios" }, { status: 400 });
    }
    const code = String(d.code).toUpperCase().trim();
    const exists = await prisma.coupon.findUnique({ where: { code } });
    if (exists) return NextResponse.json({ error: "Ese código ya existe" }, { status: 400 });

    const coupon = await prisma.coupon.create({
      data: {
        code,
        type: d.type === "MONTO" ? "MONTO" : "PORCENTAJE",
        value: parseFloat(d.value),
        minPurchase: parseFloat(d.minPurchase) || 0,
        usageLimit: parseInt(d.usageLimit) || 0,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
        active: d.active !== false,
      },
    });
    return NextResponse.json(coupon);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
