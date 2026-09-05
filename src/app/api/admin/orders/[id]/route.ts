import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, guardResponse } from "@/lib/guard";
import { getTaxRate } from "@/lib/pos";

const VALID = ["PENDIENTE", "CONFIRMADO", "ENVIADO", "ENTREGADO", "CANCELADO"];

// Cambiar estado del pedido (admin y vendedor)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { status } = await req.json();

    if (!VALID.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const current = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const saleCode = `W-${current.code.replace(/^AR-/, "")}`;

    if (status === "CANCELADO" && current.status !== "CANCELADO") {
      // Al cancelar, devolvemos el stock y anulamos la venta si existía
      await prisma.$transaction(async (tx) => {
        for (const item of current.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.sale.updateMany({ where: { code: saleCode }, data: { status: "ANULADA" } });
        await tx.order.update({ where: { id }, data: { status } });
      });
    } else if (status === "ENTREGADO" && current.status !== "ENTREGADO") {
      // Al ENTREGAR se concreta la venta: la registramos en el sistema unificado
      const taxRate = await getTaxRate();
      const subtotal = current.total / (1 + taxRate / 100);

      await prisma.$transaction(async (tx) => {
        const exists = await tx.sale.findUnique({ where: { code: saleCode } });
        if (!exists) {
          await tx.sale.create({
            data: {
              code: saleCode,
              channel: "WEB",
              status: "COMPLETADA",
              docType: "NOTA",
              customerName: current.customerName,
              subtotal: Math.round(subtotal * 100) / 100,
              tax: Math.round((current.total - subtotal) * 100) / 100,
              total: current.total,
              paymentMethod: "CONTRAENTREGA",
              userId: session.user.id || null,
              items: {
                create: current.items.map((i) => ({
                  productId: i.productId,
                  name: i.name,
                  price: i.price,
                  quantity: i.quantity,
                  total: i.price * i.quantity,
                })),
              },
            },
          });
        } else {
          await tx.sale.update({ where: { code: saleCode }, data: { status: "COMPLETADA" } });
        }
        await tx.order.update({ where: { id }, data: { status } });
      });
    } else {
      await prisma.order.update({ where: { id }, data: { status } });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
