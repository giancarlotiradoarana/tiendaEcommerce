import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, guardResponse } from "@/lib/guard";

// Listar solicitudes (admin ve todas; vendedor ve pendientes también)
export async function GET() {
  try {
    await requireAuth();
    const requests = await prisma.restockRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(requests);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Crear solicitud (vendedor)
export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const { productId, productName, quantity, note } = await req.json();
    if (!productId || !productName) {
      return NextResponse.json({ error: "Producto requerido" }, { status: 400 });
    }
    const request = await prisma.restockRequest.create({
      data: {
        productId,
        productName,
        quantity: parseInt(quantity) || 0,
        note: note || "",
        requestedBy: session.user.name || "",
      },
    });
    return NextResponse.json({ ok: true, request });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Marcar como atendida (admin)
export async function PATCH(req: Request) {
  try {
    await requireAuth();
    const { id } = await req.json();
    await prisma.restockRequest.update({ where: { id }, data: { status: "ATENDIDA" } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
