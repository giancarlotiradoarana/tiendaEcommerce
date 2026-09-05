"use client";

import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";

export default function LogoUploader({ current }: { current: string }) {
  const [preview, setPreview] = useState(current);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setMsg("");
    setUploading(true);
    const fd = new FormData();
    fd.append("logo", file);
    const res = await fetch("/api/admin/logo", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) {
      setPreview(`${data.logoUrl}?t=${Date.now()}`);
      setMsg("✅ Logo actualizado. Se usará en comprobantes, Excel y PDF.");
    } else {
      setMsg(data.error || "Error al subir");
    }
  };

  return (
    <div className="card-glass rounded-2xl p-6">
      <h2 className="mb-1 font-semibold text-white">Logo del negocio</h2>
      <p className="mb-4 text-sm text-gray-400">
        Este logo se muestra en los comprobantes, y en los reportes Excel y PDF.
      </p>

      <div className="flex items-center gap-5">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-gold/30 bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Logo" className="h-full w-full object-contain" />
        </div>

        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
          >
            <ImageUp className="h-4 w-4" />
            {uploading ? "Subiendo..." : "Subir logo"}
          </button>
          <p className="mt-2 text-xs text-gray-500">PNG, JPG, WEBP o SVG · máx 2MB</p>
        </div>
      </div>

      {msg && <p className="mt-3 text-sm text-gold">{msg}</p>}
    </div>
  );
}
