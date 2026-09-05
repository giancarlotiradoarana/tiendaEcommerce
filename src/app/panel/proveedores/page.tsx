"use client";

import { useEffect, useState } from "react";
import { Truck, Plus, Pencil, Trash2 } from "lucide-react";

interface Supplier {
  id: string; name: string; contact: string; phone: string; email: string; notes: string; active: boolean;
}
const empty = { name: "", contact: "", phone: "", email: "", notes: "", active: true };

export default function ProveedoresPage() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/suppliers").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditingId(null); setError(""); setModal(true); };
  const openEdit = (s: Supplier) => {
    setForm({ name: s.name, contact: s.contact, phone: s.phone, email: s.email, notes: s.notes, active: s.active });
    setEditingId(s.id); setError(""); setModal(true);
  };

  const save = async () => {
    setError("");
    if (!form.name) { setError("El nombre es obligatorio"); return; }
    const url = editingId ? `/api/admin/suppliers/${editingId}` : "/api/admin/suppliers";
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setModal(false); load(); }
    else { const d = await res.json(); setError(d.error || "Error"); }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    const res = await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else { const d = await res.json(); alert(d.error); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="h-7 w-7 text-gold" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Proveedores</h1>
            <p className="text-sm text-gray-400">Tus fuentes de mercadería</p>
          </div>
        </div>
        <button onClick={openNew} className="btn-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Nuevo proveedor
        </button>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : items.length === 0 ? (
        <p className="text-gray-500">Aún no tienes proveedores.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold/10 text-left text-gray-400">
                <th className="p-3">Nombre</th><th className="p-3">Contacto</th>
                <th className="p-3">Celular</th><th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="p-3 text-white">{s.name}</td>
                  <td className="p-3 text-gray-400">{s.contact || "—"}</td>
                  <td className="p-3 text-gray-400">{s.phone || "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(s)} className="flex items-center gap-1 text-gold hover:underline"><Pencil className="h-3.5 w-3.5" /> Editar</button>
                      <button onClick={() => remove(s.id)} className="flex items-center gap-1 text-red-400 hover:underline"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
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
            <h2 className="mb-4 text-xl font-bold text-white">{editingId ? "Editar proveedor" : "Nuevo proveedor"}</h2>
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <div className="space-y-3">
              <F label="Nombre / Empresa *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <F label="Persona de contacto" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} />
              <F label="Celular / WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <F label="Correo" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <F label="Notas" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={save} className="btn-gold flex-1 rounded-xl py-2.5">{editingId ? "Guardar" : "Crear"}</button>
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
