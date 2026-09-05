import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireSeller, guardResponse } from "@/lib/guard";
import { getOpenRegister, computeExpected } from "@/lib/pos";

// Estado de la caja del usuario actual
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id!;
    const register = await getOpenRegister(userId);

    if (!register) return NextResponse.json({ open: false });

    const expected = await computeExpected(register.id);
    const movements = await prisma.cashMovement.findMany({
      where: { registerId: register.id },
      orderBy: { createdAt: "desc" },
    });
    const salesCount = await prisma.sale.count({
      where: { registerId: register.id, status: "COMPLETADA" },
    });
    const salesTotal = await prisma.sale.aggregate({
      where: { registerId: register.id, status: "COMPLETADA" },
      _sum: { total: true },
    });
    // Desglose por metodo de pago (solo ventas fisicas de esta caja)
    const byPayment = await prisma.sale.groupBy({
      by: ["paymentMethod"],
      where: { registerId: register.id, status: "COMPLETADA" },
      _sum: { total: true },
      _count: true,
    });
    const efectivo = byPayment.find((p) => p.paymentMethod === "EFECTIVO")?._sum.total || 0;

    return NextResponse.json({
      open: true,
      register,
      expected,
      movements,
      salesCount,
      salesTotal: salesTotal._sum.total || 0,
      efectivo,
      byPayment: byPayment.map((p) => ({ method: p.paymentMethod, total: p._sum.total || 0, count: p._count })),
    });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Abrir caja (solo vendedor)
export async function POST(req: Request) {
  try {
    const session = await requireSeller();
    const userId = session.user.id!;

    const existing = await getOpenRegister(userId);
    if (existing) {
      return NextResponse.json({ error: "Ya tienes una caja abierta" }, { status: 400 });
    }

    const { openingAmount, note } = await req.json();
    const register = await prisma.cashRegister.create({
      data: {
        userId,
        openingAmount: parseFloat(openingAmount) || 0,
        openingNote: note || null,
      },
    });
    return NextResponse.json({ ok: true, register });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Cerrar caja (arqueo, solo vendedor)
export async function PUT(req: Request) {
  try {
    const session = await requireSeller();
    const userId = session.user.id!;

    const register = await getOpenRegister(userId);
    if (!register) {
      return NextResponse.json({ error: "No tienes una caja abierta" }, { status: 400 });
    }

    const { closingAmount, note } = await req.json();
    const expected = await computeExpected(register.id);
    const counted = parseFloat(closingAmount) || 0;

    const closed = await prisma.cashRegister.update({
      where: { id: register.id },
      data: {
        status: "CERRADA",
        closingAmount: counted,
        expectedAmount: expected,
        difference: counted - expected,
        closingNote: note || null,
        closedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, register: closed });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
