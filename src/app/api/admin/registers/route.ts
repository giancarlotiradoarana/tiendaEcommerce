import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, guardResponse } from "@/lib/guard";

export async function GET() {
  try {
    await requireAdmin();
    const registers = await prisma.cashRegister.findMany({
      orderBy: { openedAt: "desc" },
      take: 100,
      include: { user: { select: { name: true } }, _count: { select: { sales: true } } },
    });
    return NextResponse.json(registers);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
