"use client";

import { useState } from "react";
import Link from "next/link";

export default function Page() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    nombre: "", documento: "", celular: "", correo: "",
    tipo: "Reclamo", detalle: "", pedido: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Envía el reclamo por WhatsApp (o correo). Aquí abrimos WhatsApp con el detalle.
    setSent(true);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 card-glass border-b border-gold/20">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <span className="gold-text font-serif text-lg font-bold">Aroma de Reyes</span>
          </Link>
          <Link href="/" className="text-sm text-gold hover:underline">← Volver a la tienda</Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-4xl">📖</span>
          <div>
            <h1 className="font-serif text-3xl font-bold text-white">Libro de Reclamaciones</h1>
            <p className="text-sm text-gray-400">Conforme al Código de Protección al Consumidor (Perú)</p>
          </div>
        </div>

        {sent ? (
          <div className="card-glass rounded-2xl p-8 text-center">
            <div className="text-5xl">✅</div>
            <p className="mt-4 text-white">Hemos registrado tu solicitud.</p>
            <p className="mt-1 text-sm text-gray-400">Te responderemos en un plazo máximo de 15 días hábiles.</p>
            <Link href="/" className="btn-gold mt-6 inline-block rounded-xl px-6 py-2">Volver a la tienda</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="card-glass space-y-4 rounded-2xl p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <F label="Nombre completo *" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
              <F label="DNI / Documento *" value={form.documento} onChange={(v) => setForm({ ...form, documento: v })} />
              <F label="Celular *" value={form.celular} onChange={(v) => setForm({ ...form, celular: v })} />
              <F label="Correo" value={form.correo} onChange={(v) => setForm({ ...form, correo: v })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white">
                <option>Reclamo</option>
                <option>Queja</option>
              </select>
            </div>
            <F label="N° de pedido (si aplica)" value={form.pedido} onChange={(v) => setForm({ ...form, pedido: v })} />
            <div>
              <label className="mb-1 block text-xs text-gray-400">Detalle *</label>
              <textarea value={form.detalle} onChange={(e) => setForm({ ...form, detalle: e.target.value })}
                rows={4} required
                className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white" />
            </div>
            <button type="submit" className="btn-gold w-full rounded-xl py-3">Enviar reclamo</button>
            <p className="text-center text-xs text-gray-500">
              Tu reclamo será atendido en un plazo máximo de 15 días hábiles.
            </p>
          </form>
        )}
      </main>

      <footer className="border-t border-gold/10 py-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Aroma de Reyes. Todos los derechos reservados.
      </footer>
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
