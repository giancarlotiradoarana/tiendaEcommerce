import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Público: evidencias activas para mostrar en la tienda
export async function GET() {
  try {
    const items = await prisma.testimonial.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}
