import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSeller, guardResponse } from "@/lib/guard";
import { getOpenRegister } from "@/lib/pos";

// Registrar ingreso/egreso de caja (solo vendedor)
export async function POST(req: Request) {
  try {
    const session = await requireSeller();
    const register = await getOpenRegister(session.user.id!);
    if (!register) {
      return NextResponse.json({ error: "No tienes una caja abierta" }, { status: 400 });
    }

    const { type, amount, reason } = await req.json();
    if (!["INGRESO", "EGRESO"].includes(type) || !amount) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const mov = await prisma.cashMovement.create({
      data: {
        registerId: register.id,
        type,
        amount: parseFloat(amount),
        reason: reason || "",
      },
    });
    return NextResponse.json({ ok: true, movement: mov });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
