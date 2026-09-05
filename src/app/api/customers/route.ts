import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, guardResponse } from "@/lib/guard";

// Buscar clientes (para el POS) — cualquier usuario autenticado
export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    if (!q) return NextResponse.json([]);
    const customers = await prisma.customer.findMany({
      where: { OR: [{ name: { contains: q } }, { phone: { contains: q } }] },
      take: 8,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(customers);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Crear cliente rápido desde el POS
export async function POST(req: Request) {
  try {
    await requireAuth();
    const { name, phone } = await req.json();
    if (!name || !phone) return NextResponse.json({ error: "Nombre y celular requeridos" }, { status: 400 });
    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) return NextResponse.json(existing);
    const customer = await prisma.customer.create({ data: { name, phone } });
    return NextResponse.json(customer);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
