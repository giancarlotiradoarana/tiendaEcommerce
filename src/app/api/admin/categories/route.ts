import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth, guardResponse } from "@/lib/guard";

// Listar (cualquier usuario autenticado, para usarlas en formularios)
export async function GET() {
  try {
    await requireAuth();
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json(categories);
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
    const exists = await prisma.category.findUnique({ where: { name: d.name.trim() } });
    if (exists) return NextResponse.json({ error: "Ya existe" }, { status: 400 });
    const category = await prisma.category.create({
      data: { name: d.name.trim(), kind: d.kind === "marca" ? "marca" : "categoria" },
    });
    return NextResponse.json(category);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
