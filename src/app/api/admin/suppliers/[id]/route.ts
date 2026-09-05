import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, guardResponse } from "@/lib/guard";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const d = await req.json();
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: d.name, contact: d.contact || "", phone: d.phone || "",
        email: d.email || "", notes: d.notes || "", active: d.active !== false,
      },
    });
    return NextResponse.json(supplier);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const count = await prisma.purchase.count({ where: { supplierId: id } });
    if (count > 0) {
      return NextResponse.json({ error: "No se puede eliminar: tiene compras registradas" }, { status: 400 });
    }
    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
