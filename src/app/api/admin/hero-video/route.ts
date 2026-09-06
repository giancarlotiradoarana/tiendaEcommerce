import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin, guardResponse } from "@/lib/guard";

// Subir el video de portada (hero)
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const formData = await req.formData();
    const file = formData.get("video") as File | null;
    if (!file) return NextResponse.json({ error: "Sube un video" }, { status: 400 });

    const allowed = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Formato no válido (MP4, WEBM o MOV)" }, { status: 400 });
    }
    if (file.size > 40 * 1024 * 1024) {
      return NextResponse.json({ error: "El video supera los 40MB" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `hero-${Date.now()}.${ext}`;
    await writeFile(path.join(dir, filename), bytes);

    const heroVideo = `/uploads/${filename}`;
    await prisma.setting.upsert({
      where: { id: 1 },
      update: { heroVideo },
      create: { id: 1, heroVideo },
    });
    return NextResponse.json({ ok: true, heroVideo });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Quitar el video (volver a la imagen)
export async function DELETE() {
  try {
    await requireAdmin();
    await prisma.setting.update({ where: { id: 1 }, data: { heroVideo: "" } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
