import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, guardResponse } from "@/lib/guard";

const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un proveedor"),
  notes: z.string().optional(),
  items: z
    .array(z.object({
      productId: z.string(),
      cost: z.number().min(0),
      quantity: z.number().int().positive(),
    }))
    .min(1, "Agrega al menos un producto"),
});

function genCode() {
  const d = new Date();
  const n = Math.floor(1000 + Math.random() * 9000);
  return `C-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${n}`;
}

export async function GET() {
  try {
    await requireAdmin();
    const purchases = await prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { supplier: { select: { name: true } }, items: true },
    });
    return NextResponse.json(purchases);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Registrar una compra: sube stock, actualiza costo y deja movimiento en Kardex
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const data = purchaseSchema.parse(await req.json());

    const ids = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: ids } } });
    if (products.length !== ids.length) {
      return NextResponse.json({ error: "Algún producto no existe" }, { status: 400 });
    }

    let total = 0;
    const items = data.items.map((it) => {
      const p = products.find((x) => x.id === it.productId)!;
      const lineTotal = it.cost * it.quantity;
      total += lineTotal;
      return { product: p, cost: it.cost, quantity: it.quantity, total: lineTotal };
    });

    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          code: genCode(),
          supplierId: data.supplierId,
          total,
          notes: data.notes || "",
          items: {
            create: items.map((i) => ({
              productId: i.product.id,
              name: `${i.product.brand} ${i.product.name}`,
              cost: i.cost,
              quantity: i.quantity,
              total: i.total,
            })),
          },
        },
      });

      for (const i of items) {
        const newStock = i.product.stock + i.quantity;
        await tx.product.update({
          where: { id: i.product.id },
          data: { stock: newStock, cost: i.cost }, // actualiza costo al último de compra
        });
        await tx.stockMovement.create({
          data: {
            productId: i.product.id,
            type: "ENTRADA",
            quantity: i.quantity,
            reason: `Compra ${created.code}`,
            balance: newStock,
          },
        });
      }
      return created;
    });

    return NextResponse.json({ ok: true, code: purchase.code });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
