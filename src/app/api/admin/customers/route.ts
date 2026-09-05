import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, guardResponse } from "@/lib/guard";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const customers = await prisma.customer.findMany({
      where: q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(customers);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const d = await req.json();
    if (!d.name || !d.phone) {
      return NextResponse.json({ error: "Nombre y celular son obligatorios" }, { status: 400 });
    }
    const exists = await prisma.customer.findUnique({ where: { phone: d.phone } });
    if (exists) return NextResponse.json({ error: "Ya existe un cliente con ese celular" }, { status: 400 });
    const customer = await prisma.customer.create({
      data: { name: d.name, phone: d.phone, email: d.email || "", notes: d.notes || "" },
    });
    return NextResponse.json(customer);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
