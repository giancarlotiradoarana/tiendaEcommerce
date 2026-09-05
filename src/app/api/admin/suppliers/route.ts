import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, guardResponse } from "@/lib/guard";

export async function GET() {
  try {
    await requireAdmin();
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(suppliers);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const d = await req.json();
    if (!d.name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    const supplier = await prisma.supplier.create({
      data: {
        name: d.name, contact: d.contact || "", phone: d.phone || "",
        email: d.email || "", notes: d.notes || "",
      },
    });
    return NextResponse.json(supplier);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
