import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, guardResponse } from "@/lib/guard";

// Obtener una venta con sus items (para el comprobante)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const sale = await prisma.sale.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: { items: true, user: { select: { name: true } } },
    });
    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    const setting = await prisma.setting.findUnique({ where: { id: 1 } });

    return NextResponse.json({ sale, setting });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Anular una venta: la marca como ANULADA y devuelve el stock
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const { action } = await req.json();
    if (action !== "anular") {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

    const sale = await prisma.sale.findUnique({ where: { id }, include: { items: true } });
    if (!sale) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    if (sale.status === "ANULADA") {
      return NextResponse.json({ error: "La venta ya está anulada" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        const prodAfter = await tx.product.findUnique({ where: { id: item.productId } });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "ENTRADA",
            quantity: item.quantity,
            reason: `Anulación venta ${sale.code}`,
            balance: prodAfter?.stock ?? 0,
          },
        });
      }
      await tx.sale.update({ where: { id }, data: { status: "ANULADA" } });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
