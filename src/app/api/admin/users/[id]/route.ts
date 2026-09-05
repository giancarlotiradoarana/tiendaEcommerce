import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, guardResponse } from "@/lib/guard";

// Editar usuario: nombre, correo, rol y (opcional) contraseña
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { name, email, role, password } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Nombre y correo son obligatorios" }, { status: 400 });
    }

    // Verificar que el correo no lo use otro usuario
    const emailNorm = email.toLowerCase().trim();
    const other = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (other && other.id !== id) {
      return NextResponse.json({ error: "El correo ya está en uso" }, { status: 400 });
    }

    const data: {
      name: string; email: string; role: "ADMIN" | "VENDEDOR"; password?: string;
    } = {
      name,
      email: emailNorm,
      role: role === "ADMIN" ? "ADMIN" : "VENDEDOR",
    };
    if (password && password.trim()) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(user);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Eliminar usuario (solo admin)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    if (session.user.id === id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
