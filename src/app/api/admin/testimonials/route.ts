import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdmin, guardResponse } from "@/lib/guard";

// Listar todas (admin)
export async function GET() {
  try {
    await requireAdmin();
    const items = await prisma.testimonial.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(items);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}

// Subir una evidencia (imagen + datos)
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const customer = (formData.get("customer") as string) || "";
    const caption = (formData.get("caption") as string) || "";

    if (!file) return NextResponse.json({ error: "Sube una imagen o video" }, { status: 400 });
    const images = ["image/png", "image/jpeg", "image/webp"];
    const videos = ["video/mp4", "video/webm", "video/quicktime"];
    const isVideo = videos.includes(file.type);
    if (!images.includes(file.type) && !isVideo) {
      return NextResponse.json({ error: "Formato no válido (imagen JPG/PNG/WEBP o video MP4/WEBM)" }, { status: 400 });
    }
    const maxSize = isVideo ? 25 * 1024 * 1024 : 4 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `El archivo supera los ${isVideo ? 25 : 4}MB` }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png",
      "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
    };
    const ext = extMap[file.type] || "bin";
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `evidencia-${Date.now()}.${ext}`;
    await writeFile(path.join(dir, filename), bytes);

    const item = await prisma.testimonial.create({
      data: {
        imageUrl: `/uploads/${filename}`,
        mediaType: isVideo ? "video" : "image",
        customer, caption,
      },
    });
    return NextResponse.json(item);
  } catch (err) {
    const { status, body } = guardResponse(err);
    return NextResponse.json(body, { status });
  }
}
