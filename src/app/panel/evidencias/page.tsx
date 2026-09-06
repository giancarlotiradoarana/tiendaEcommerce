"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Upload, Trash2, Eye, EyeOff } from "lucide-react";

interface Item {
  id: string; imageUrl: string; mediaType: string; customer: string; caption: string; active: boolean;
}

export default function EvidenciasPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => { setLoading(true); fetch("/api/admin/testimonials").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const upload = async (file: File) => {
    setMsg(""); setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    fd.append("customer", customer);
    fd.append("caption", caption);
    const res = await fetch("/api/admin/testimonials", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) { setCustomer(""); setCaption(""); load(); }
    else { const d = await res.json(); setMsg(d.error || "Error"); }
  };

  const toggle = async (it: Item) => {
    await fetch(`/api/admin/testimonials/${it.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !it.active }),
    });
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta evidencia?")) return;
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <ImagePlus className="h-7 w-7 text-gold" />
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Evidencias de clientes</h1>
          <p className="text-sm text-gray-400">Fotos de clientes con sus compras (se muestran en la tienda)</p>
        </div>
      </div>

      {/* Subir */}
      <div className="card-glass mb-6 rounded-2xl p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Nombre del cliente (opcional)</label>
            <input value={customer} onChange={(e) => setCustomer(e.target.value)}
              className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Descripción (opcional)</label>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ej: Compró Lattafa Asad"
              className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white" />
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime" className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="btn-gold mt-4 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm disabled:opacity-50">
          <Upload className="h-4 w-4" /> {uploading ? "Subiendo..." : "Subir imagen o video"}
        </button>
        {msg && <p className="mt-2 text-sm text-red-400">{msg}</p>}
        <p className="mt-2 text-xs text-gray-500">Imagen (JPG/PNG/WEBP, máx 4MB) o video (MP4/WEBM, máx 25MB)</p>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : items.length === 0 ? (
        <p className="text-gray-500">Aún no hay evidencias. Sube la primera arriba.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.id} className={`card-glass overflow-hidden rounded-2xl ${!it.active && "opacity-50"}`}>
              {it.mediaType === "video" ? (
                <video src={it.imageUrl} className="h-40 w-full object-cover" controls preload="metadata" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imageUrl} alt={it.customer} className="h-40 w-full object-cover" />
              )}
              <div className="p-3">
                {it.customer && <p className="text-sm font-semibold text-white">{it.customer}</p>}
                {it.caption && <p className="text-xs text-gray-400">{it.caption}</p>}
                <div className="mt-2 flex gap-3">
                  <button onClick={() => toggle(it)} className="flex items-center gap-1 text-xs text-gold">
                    {it.active ? <><EyeOff className="h-3.5 w-3.5" /> Ocultar</> : <><Eye className="h-3.5 w-3.5" /> Mostrar</>}
                  </button>
                  <button onClick={() => remove(it.id)} className="flex items-center gap-1 text-xs text-red-400">
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
