import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, guardResponse } from "@/lib/guard";

// Busca un producto por su código EXACTO (para lector de código de barras)
export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const code = (searchParams.get("code") || "").trim();
    if (!code) return NextResponse.json({ product: null });

    const product = await prisma.product.findFirst({
      where: { active: true, sku: code },
      select: {
        id: true, name: true, brand: true, sku: true,
        price: true, stock: true, imageUrl: true,
      },
    });
    return NextResponse.json({ product });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
