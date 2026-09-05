import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth, guardResponse } from "@/lib/guard";

// Leer configuracion
export async function GET() {
  try {
    await requireAuth();
    let setting = await prisma.setting.findUnique({ where: { id: 1 } });
    if (!setting) {
      setting = await prisma.setting.create({ data: { id: 1 } });
    }
    return NextResponse.json(setting);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Actualizar configuracion, incluido el numero de notificaciones (solo admin)
export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const data = await req.json();

    const setting = await prisma.setting.upsert({
      where: { id: 1 },
      update: {
        storeName: data.storeName,
        notifyPhone: data.notifyPhone,
        shippingCost: parseFloat(data.shippingCost) || 0,
        freeShippingFrom: parseFloat(data.freeShippingFrom) || 0,
      },
      create: {
        id: 1,
        storeName: data.storeName || "Aroma de Reyes",
        notifyPhone: data.notifyPhone || "",
        shippingCost: parseFloat(data.shippingCost) || 0,
        freeShippingFrom: parseFloat(data.freeShippingFrom) || 0,
      },
    });
    return NextResponse.json(setting);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
