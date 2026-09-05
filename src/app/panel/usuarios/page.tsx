"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Pencil, Trash2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const emptyForm = { name: "", email: "", password: "", role: "VENDEDOR" };

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setModal(true);
  };

  const openEdit = (u: User) => {
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setEditingId(u.id);
    setError("");
    setModal(true);
  };

  const save = async () => {
    setError("");
    if (!form.name || !form.email) {
      setError("Nombre y correo son obligatorios");
      return;
    }
    if (!editingId && !form.password) {
      setError("La contraseña es obligatoria para un usuario nuevo");
      return;
    }

    const url = editingId ? `/api/admin/users/${editingId}` : "/api/admin/users";
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setModal(false);
      setForm(emptyForm);
      setEditingId(null);
      load();
    } else {
      const d = await res.json();
      setError(d.error || "Error");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else { const d = await res.json(); alert(d.error); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-gold" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Usuarios</h1>
            <p className="text-sm text-gray-400">Administra el acceso de tu equipo</p>
          </div>
        </div>
        <button onClick={openNew} className="btn-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
          <UserPlus className="h-4 w-4" /> Nuevo usuario
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold/10 text-left text-gray-400">
                <th className="p-3">Nombre</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="p-3 text-white">{u.name}</td>
                  <td className="p-3 text-gray-400">{u.email}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${u.role === "ADMIN" ? "bg-gold/15 text-gold" : "bg-blue-400/10 text-blue-400"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(u)} className="flex items-center gap-1 text-gold hover:underline">
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button onClick={() => remove(u.id)} className="flex items-center gap-1 text-red-400 hover:underline">
                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                      </button>
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
            <h2 className="mb-4 text-xl font-bold text-white">
              {editingId ? "Editar usuario" : "Nuevo usuario"}
            </h2>
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <div className="space-y-3">
              <Field label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Correo" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
              <Field
                label={editingId ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                type="password"
              />
              <div>
                <label className="mb-1 block text-xs text-gray-400">Rol</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white">
                  <option value="VENDEDOR">Vendedor (gestiona pedidos y stock)</option>
                  <option value="ADMIN">Administrador (control total)</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={save} className="btn-gold flex-1 rounded-xl py-2.5">
                {editingId ? "Guardar cambios" : "Crear"}
              </button>
              <button onClick={() => setModal(false)} className="flex-1 rounded-xl gold-border py-2.5 text-gold">Cancelar</button>
            </div>
          </div>
        </div>
      )}
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
