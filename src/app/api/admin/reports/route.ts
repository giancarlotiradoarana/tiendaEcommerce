import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, guardResponse } from "@/lib/guard";

export async function GET() {
  try {
    await requireAdmin();

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    // Ventas de los últimos 7 días (para el gráfico de línea)
    const days: { label: string; total: number }[] = [];
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const agg = await prisma.sale.aggregate({
        _sum: { total: true },
        where: { status: "COMPLETADA", createdAt: { gte: d, lt: next } },
      });
      days.push({ label: dayNames[d.getDay()], total: Math.round((agg._sum.total || 0) * 100) / 100 });
    }

    const [today, month, byChannel, byPayment, topProducts, bySeller] = await Promise.all([
      prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { status: "COMPLETADA", createdAt: { gte: startOfDay } } }),
      prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { status: "COMPLETADA", createdAt: { gte: startOfMonth } } }),
      prisma.sale.groupBy({ by: ["channel"], _sum: { total: true }, _count: true, where: { status: "COMPLETADA" } }),
      prisma.sale.groupBy({ by: ["paymentMethod"], _sum: { total: true }, where: { status: "COMPLETADA" } }),
      prisma.saleItem.groupBy({ by: ["name"], _sum: { quantity: true, total: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
      prisma.sale.groupBy({ by: ["userId"], _sum: { total: true }, _count: true, where: { status: "COMPLETADA", userId: { not: null } } }),
    ]);

    // Resolver nombres de vendedores
    const userIds = bySeller.map((s) => s.userId).filter(Boolean) as string[];
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
    const sellerRows = bySeller.map((s) => ({
      name: users.find((u) => u.id === s.userId)?.name || "—",
      total: s._sum.total || 0,
      count: s._count,
    }));

    return NextResponse.json({
      today: { total: today._sum.total || 0, count: today._count },
      month: { total: month._sum.total || 0, count: month._count },
      last7Days: days,
      byChannel: byChannel.map((c) => ({ channel: c.channel, total: c._sum.total || 0, count: c._count })),
      byPayment: byPayment.map((p) => ({ method: p.paymentMethod, total: p._sum.total || 0 })),
      topProducts: topProducts.map((t) => ({ name: t.name, qty: t._sum.quantity || 0, total: t._sum.total || 0 })),
      bySeller: sellerRows,
    });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
