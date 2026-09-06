"use client";

import { useRef, useState } from "react";
import { Film, Upload, Trash2 } from "lucide-react";

export default function HeroVideoUploader({ current }: { current: string }) {
  const [video, setVideo] = useState(current);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setMsg(""); setUploading(true);
    const fd = new FormData();
    fd.append("video", file);
    const res = await fetch("/api/admin/hero-video", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) { setVideo(`${data.heroVideo}?t=${Date.now()}`); setMsg("✅ Video de portada actualizado."); }
    else setMsg(data.error || "Error");
  };

  const remove = async () => {
    if (!confirm("¿Quitar el video de portada? Se volverá a mostrar la imagen.")) return;
    await fetch("/api/admin/hero-video", { method: "DELETE" });
    setVideo(""); setMsg("Video quitado. Se muestra la imagen de portada.");
  };

  return (
    <div className="card-glass rounded-2xl p-6">
      <h2 className="mb-1 flex items-center gap-2 font-semibold text-white">
        <Film className="h-5 w-5 text-gold" /> Video de portada (Hero)
      </h2>
      <p className="mb-4 text-sm text-gray-400">
        Se reproduce de fondo en la página principal. Si no hay video, se muestra la imagen por defecto.
      </p>

      {video && (
        <video src={video} className="mb-4 h-48 w-full rounded-xl object-cover" controls muted playsInline />
      )}

      <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />

      <div className="flex flex-wrap gap-3">
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="btn-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm disabled:opacity-50">
          <Upload className="h-4 w-4" /> {uploading ? "Subiendo..." : video ? "Cambiar video" : "Subir video"}
        </button>
        {video && (
          <button onClick={remove} className="flex items-center gap-2 rounded-xl gold-border px-5 py-2.5 text-sm text-red-400 hover:bg-red-500/10">
            <Trash2 className="h-4 w-4" /> Quitar
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        MP4, WEBM o MOV · máx 40MB. Recomendado: video corto (8-12s), horizontal, sin audio.
      </p>
      {msg && <p className="mt-2 text-sm text-gold">{msg}</p>}
    </div>
  );
}
