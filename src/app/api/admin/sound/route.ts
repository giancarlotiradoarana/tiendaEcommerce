import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin, guardResponse } from "@/lib/guard";

// Subir el audio de notificación de pedidos (solo admin)
export async function POST(req: Request) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("sound") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
    }

    const allowed = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Formato no válido (usa MP3, WAV u OGG)" }, { status: 400 });
    }
    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json({ error: "El audio supera los 3MB" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = file.type.includes("wav") ? "wav"
      : file.type.includes("ogg") ? "ogg"
      : file.type.includes("webm") ? "webm" : "mp3";

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filename = `notify-${Date.now()}.${ext}`;
    await writeFile(path.join(uploadsDir, filename), bytes);

    const notifySound = `/uploads/${filename}`;
    await prisma.setting.upsert({
      where: { id: 1 },
      update: { notifySound },
      create: { id: 1, notifySound },
    });

    return NextResponse.json({ ok: true, notifySound });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
