"use client";

import { useEffect, useState } from "react";
import { Contact, Plus, Trash2, Search, MessageCircle } from "lucide-react";

interface Customer { id: string; name: string; phone: string; email: string; notes: string; createdAt: string }
const empty = { name: "", phone: "", email: "", notes: "" };

export default function ClientesPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  const load = (query = "") => {
    setLoading(true);
    fetch(`/api/admin/customers${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then((r) => r.json()).then((d) => { setItems(d); setLoading(false); });
  };
  useEffect(() => { const t = setTimeout(() => load(q), 250); return () => clearTimeout(t); }, [q]);

  const save = async () => {
    setError("");
    if (!form.name || !form.phone) { setError("Nombre y celular son obligatorios"); return; }
    const res = await fetch("/api/admin/customers", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (res.ok) { setModal(false); setForm(empty); load(q); }
    else { const d = await res.json(); setError(d.error || "Error"); }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
    if (res.ok) load(q);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Contact className="h-7 w-7 text-gold" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Clientes</h1>
            <p className="text-sm text-gray-400">Base de clientes para recompra y campañas</p>
          </div>
        </div>
        <button onClick={() => { setError(""); setModal(true); }} className="btn-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Nuevo cliente
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o celular..."
          className="w-full rounded-lg border border-gold/30 bg-ink py-2 pl-9 pr-3 text-sm text-white" />
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : items.length === 0 ? (
        <p className="text-gray-500">No hay clientes registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold/10 text-left text-gray-400">
                <th className="p-3">Nombre</th><th className="p-3">Celular</th><th className="p-3">Correo</th><th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="p-3 text-white">{c.name}</td>
                  <td className="p-3 text-gray-400">{c.phone}</td>
                  <td className="p-3 text-gray-400">{c.email || "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-green-400 hover:underline"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
                      <button onClick={() => remove(c.id)} className="flex items-center gap-1 text-red-400 hover:underline"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
                    </div>
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
            <h2 className="mb-4 text-xl font-bold text-white">Nuevo cliente</h2>
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <div className="space-y-3">
              <F label="Nombre *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <F label="Celular *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <F label="Correo" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <F label="Notas" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
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

function F({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white outline-none focus:border-gold" />
    </div>
  );
}
