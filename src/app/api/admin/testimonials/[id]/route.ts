import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, guardResponse } from "@/lib/guard";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { active } = await req.json();
    const item = await prisma.testimonial.update({ where: { id }, data: { active: !!active } });
    return NextResponse.json(item);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
