import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, guardResponse } from "@/lib/guard";
import { sendPushToAll } from "@/lib/push";

// Registrar (o actualizar) la suscripcion push del dispositivo actual
export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const { subscription, label } = await req.json();

    if (!subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        label: label || session.user.name || "",
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        label: label || session.user.name || "",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Eliminar la suscripcion (al desactivar notificaciones)
export async function DELETE(req: Request) {
  try {
    await requireAuth();
    const { endpoint } = await req.json();
    if (endpoint) {
      await prisma.pushSubscription
        .delete({ where: { endpoint } })
        .catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Enviar una notificacion de PRUEBA a este dispositivo/todos
export async function PUT() {
  try {
    await requireAuth();
    await sendPushToAll({
      title: "🛎️ Nueva orden (prueba)",
      body: "3 productos por S/ 24.95 — así se verán tus notificaciones",
      url: "/panel/pedidos",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
