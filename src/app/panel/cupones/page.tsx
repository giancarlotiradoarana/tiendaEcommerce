"use client";

import { useEffect, useState } from "react";
import { Ticket, Plus, Trash2 } from "lucide-react";

interface Coupon {
  id: string; code: string; type: string; value: number; minPurchase: number;
  active: boolean; usageLimit: number; usedCount: number; expiresAt: string | null;
}
const empty = { code: "", type: "PORCENTAJE", value: "", minPurchase: "0", usageLimit: "0", expiresAt: "", active: true };

export default function CuponesPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  const load = () => { setLoading(true); fetch("/api/admin/coupons").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setError("");
    if (!form.code || !form.value) { setError("Código y valor son obligatorios"); return; }
    const res = await fetch("/api/admin/coupons", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (res.ok) { setModal(false); setForm(empty); load(); }
    else { const d = await res.json(); setError(d.error || "Error"); }
  };

  const toggle = async (c: Coupon) => {
    await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !c.active }),
    });
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este cupón?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="h-7 w-7 text-gold" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Cupones</h1>
            <p className="text-sm text-gray-400">Descuentos para tus campañas</p>
          </div>
        </div>
        <button onClick={() => { setError(""); setModal(true); }} className="btn-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Nuevo cupón
        </button>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : items.length === 0 ? (
        <p className="text-gray-500">Aún no tienes cupones.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold/10 text-left text-gray-400">
                <th className="p-3">Código</th><th className="p-3">Descuento</th><th className="p-3">Mínimo</th>
                <th className="p-3">Usos</th><th className="p-3">Estado</th><th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="p-3 font-semibold text-gold">{c.code}</td>
                  <td className="p-3 text-white">{c.type === "PORCENTAJE" ? `${c.value}%` : `S/ ${c.value.toFixed(2)}`}</td>
                  <td className="p-3 text-gray-400">{c.minPurchase > 0 ? `S/ ${c.minPurchase.toFixed(2)}` : "—"}</td>
                  <td className="p-3 text-gray-400">{c.usedCount}{c.usageLimit > 0 ? ` / ${c.usageLimit}` : ""}</td>
                  <td className="p-3">
                    <button onClick={() => toggle(c)} className={`rounded-full px-2 py-1 text-xs ${c.active ? "bg-green-400/10 text-green-400" : "bg-gray-500/10 text-gray-400"}`}>
                      {c.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="p-3">
                    <button onClick={() => remove(c.id)} className="flex items-center gap-1 text-red-400 hover:underline"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setModal(false)} />
          <div className="card-glass relative w-full max-w-md rounded-2xl p-6">
            <h2 className="mb-4 text-xl font-bold text-white">Nuevo cupón</h2>
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Código *</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="Ej: BIENVENIDO10"
                  className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Tipo</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-lg border border-gold/30 bg-ink px-2 py-2 text-sm text-white">
                    <option value="PORCENTAJE">Porcentaje (%)</option>
                    <option value="MONTO">Monto fijo (S/)</option>
                  </select>
                </div>
                <F label="Valor *" value={form.value} onChange={(v) => setForm({ ...form, value: v })} type="number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Compra mínima S/" value={form.minPurchase} onChange={(v) => setForm({ ...form, minPurchase: v })} type="number" />
                <F label="Límite de usos (0=∞)" value={form.usageLimit} onChange={(v) => setForm({ ...form, usageLimit: v })} type="number" />
              </div>
              <F label="Vence (opcional)" value={form.expiresAt} onChange={(v) => setForm({ ...form, expiresAt: v })} type="date" />
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={save} className="btn-gold flex-1 rounded-xl py-2.5">Crear</button>
              <button onClick={() => setModal(false)} className="flex-1 rounded-xl gold-border py-2.5 text-gold">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white outline-none focus:border-gold" />
    </div>
  );
}
