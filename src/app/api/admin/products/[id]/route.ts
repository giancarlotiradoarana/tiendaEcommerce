import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, guardResponse } from "@/lib/guard";

// Actualizar (solo admin)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await req.json();

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        brand: data.brand,
        sku: data.sku ? String(data.sku).trim() : null,
        description: data.description,
        notes: data.notes,
        gender: data.gender,
        cost: parseFloat(data.cost) || 0,
        price: parseFloat(data.price),
        compareAt: data.compareAt ? parseFloat(data.compareAt) : null,
        stock: parseInt(data.stock),
        lowStock: parseInt(data.lowStock) || 3,
        imageUrl: data.imageUrl,
        featured: !!data.featured,
        active: data.active !== false,
      },
    });
    return NextResponse.json(product);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Eliminar (solo admin)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
