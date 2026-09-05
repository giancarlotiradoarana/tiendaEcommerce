import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, guardResponse } from "@/lib/guard";

// Valida un cupón y devuelve el descuento aplicable (para el POS)
export async function POST(req: Request) {
  try {
    await requireAuth();
    const { code, subtotal } = await req.json();
    const c = String(code || "").toUpperCase().trim();
    if (!c) return NextResponse.json({ valid: false, error: "Ingresa un código" });

    const coupon = await prisma.coupon.findUnique({ where: { code: c } });
    if (!coupon || !coupon.active) {
      return NextResponse.json({ valid: false, error: "Cupón no válido" });
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: "Cupón vencido" });
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, error: "Cupón agotado" });
    }
    const sub = parseFloat(subtotal) || 0;
    if (coupon.minPurchase > 0 && sub < coupon.minPurchase) {
      return NextResponse.json({ valid: false, error: `Compra mínima S/ ${coupon.minPurchase.toFixed(2)}` });
    }

    const discount = coupon.type === "PORCENTAJE"
      ? Math.round((sub * coupon.value / 100) * 100) / 100
      : Math.min(coupon.value, sub);

    return NextResponse.json({
      valid: true, code: coupon.code, discount,
      label: coupon.type === "PORCENTAJE" ? `${coupon.value}%` : `S/ ${coupon.value.toFixed(2)}`,
    });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
