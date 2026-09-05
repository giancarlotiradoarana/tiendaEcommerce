import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, guardResponse } from "@/lib/guard";

// Devuelve el total de pedidos y el más reciente (para detectar nuevos en el panel)
export async function GET() {
  try {
    await requireAuth();
    const [count, latest] = await Promise.all([
      prisma.order.count(),
      prisma.order.findFirst({
        orderBy: { createdAt: "desc" },
        select: { id: true, code: true, customerName: true, total: true, createdAt: true },
      }),
    ]);
    return NextResponse.json({ count, latest });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
