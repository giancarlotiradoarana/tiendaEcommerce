import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, guardResponse } from "@/lib/guard";

// Listar movimientos de inventario (Kardex)
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    const moves = await prisma.stockMovement.findMany({
      where: productId ? { productId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { product: { select: { name: true, brand: true } } },
    });
    return NextResponse.json(moves);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Ajuste manual de stock (merma, rotura, corrección)
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { productId, quantity, reason } = await req.json();
    const qty = parseInt(quantity);
    if (!productId || !qty) {
      return NextResponse.json({ error: "Producto y cantidad son obligatorios" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

    const newStock = Math.max(0, product.stock + qty); // qty puede ser negativo

    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id: productId }, data: { stock: newStock } });
      await tx.stockMovement.create({
        data: {
          productId,
          type: "AJUSTE",
          quantity: qty,
          reason: reason || "Ajuste manual",
          balance: newStock,
        },
      });
    });

    return NextResponse.json({ ok: true, newStock });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
