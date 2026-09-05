"use client";

import { useEffect, useState } from "react";
import PushManager from "@/components/PushManager";
import LogoUploader from "@/components/LogoUploader";
import SoundUploader from "@/components/SoundUploader";

export default function ConfiguracionPage() {
  const [form, setForm] = useState({
    storeName: "",
    notifyPhone: "",
    shippingCost: "0",
    freeShippingFrom: "165",
  });
  const [logoUrl, setLogoUrl] = useState("/icon.png");
  const [notifySound, setNotifySound] = useState("/audio.mp3");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setForm({
          storeName: d.storeName || "",
          notifyPhone: d.notifyPhone || "",
          shippingCost: String(d.shippingCost ?? 0),
          freeShippingFrom: String(d.freeShippingFrom ?? 165),
        });
        setLogoUrl(d.logoUrl || "/icon.png");
        setNotifySound(d.notifySound || "/audio.mp3");
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setError(""); setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else { const d = await res.json(); setError(d.error || "Error"); }
  };

  if (loading) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-white">Configuración</h1>
      <p className="mb-6 text-sm text-gray-400">Ajustes generales de la tienda</p>

      <div className="mb-6">
        <LogoUploader current={logoUrl} />
      </div>

      <div className="mb-6">
        <SoundUploader current={notifySound} />
      </div>

      {saved && (
        <p className="mb-4 rounded-lg bg-green-400/10 p-3 text-sm text-green-400">
          ✅ Cambios guardados
        </p>
      )}
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="card-glass space-y-4 rounded-2xl p-6">
        <Field label="Nombre de la tienda" value={form.storeName}
          onChange={(v) => setForm({ ...form, storeName: v })} />

        <div>
          <label className="mb-1 block text-xs text-gray-400">
            📱 Número para notificaciones de pedido
          </label>
          <input
            value={form.notifyPhone}
            onChange={(e) => setForm({ ...form, notifyPhone: e.target.value })}
            placeholder="51987654321"
            className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white outline-none focus:border-gold"
          />
          <p className="mt-1 text-xs text-gray-500">
            A este número llega el aviso cada vez que entra un pedido nuevo.
            Formato: código de país + número (ej. 51 + 987654321).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Costo de envío S/" value={form.shippingCost} type="number"
            onChange={(v) => setForm({ ...form, shippingCost: v })} />
          <Field label="Envío gratis desde S/" value={form.freeShippingFrom} type="number"
            onChange={(v) => setForm({ ...form, freeShippingFrom: v })} />
        </div>

        <button onClick={save} className="btn-gold w-full rounded-xl py-3">
          Guardar cambios
        </button>
      </div>

      <div className="mt-6">
        <PushManager />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white outline-none focus:border-gold" />
    </div>
  );
}
