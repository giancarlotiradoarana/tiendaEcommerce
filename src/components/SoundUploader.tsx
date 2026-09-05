"use client";

import { useRef, useState } from "react";
import { Music, Play } from "lucide-react";

export default function SoundUploader({ current }: { current: string }) {
  const [soundUrl, setSoundUrl] = useState(current);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setMsg("");
    setUploading(true);
    const fd = new FormData();
    fd.append("sound", file);
    const res = await fetch("/api/admin/sound", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) {
      setSoundUrl(`${data.notifySound}?t=${Date.now()}`);
      setMsg("✅ Audio actualizado. Sonará al llegar cada pedido nuevo.");
    } else {
      setMsg(data.error || "Error al subir");
    }
  };

  const play = () => {
    const a = new Audio(soundUrl);
    a.play().catch(() => setMsg("Toca la pantalla una vez y vuelve a probar."));
  };

  return (
    <div className="card-glass rounded-2xl p-6">
      <h2 className="mb-1 font-semibold text-white">Sonido de notificación de pedidos</h2>
      <p className="mb-4 text-sm text-gray-400">
        Este audio suena en el panel cada vez que entra un pedido nuevo.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
        >
          <Music className="h-4 w-4" />
          {uploading ? "Subiendo..." : "Subir audio"}
        </button>
        <button
          onClick={play}
          className="flex items-center gap-2 rounded-xl gold-border px-5 py-2.5 text-sm text-gold hover:bg-gold/10"
        >
          <Play className="h-4 w-4" /> Escuchar
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-500">MP3, WAV u OGG · máx 3MB</p>
      {msg && <p className="mt-3 text-sm text-gold">{msg}</p>}
    </div>
  );
}
