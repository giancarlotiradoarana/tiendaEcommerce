import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, guardResponse } from "@/lib/guard";

// Busqueda de productos para el POS (por nombre, marca o SKU)
export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    const products = await prisma.product.findMany({
      where: {
        active: true,
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { brand: { contains: q } },
                { sku: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: 50,
      select: {
        id: true, name: true, brand: true, sku: true,
        price: true, stock: true, imageUrl: true,
      },
    });
    return NextResponse.json(products);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
