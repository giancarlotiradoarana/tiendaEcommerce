"use client";

import { useEffect, useState } from "react";
import { PackagePlus, Check } from "lucide-react";

interface Req {
  id: string; productName: string; quantity: number; note: string;
  status: string; requestedBy: string; createdAt: string;
}

export default function ReabastecimientoPage() {
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); fetch("/api/restock").then((r) => r.json()).then((d) => { setItems(d); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const attend = async (id: string) => {
    await fetch("/api/restock", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <PackagePlus className="h-7 w-7 text-gold" />
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Reabastecimiento</h1>
          <p className="text-sm text-gray-400">Solicitudes de stock del vendedor</p>
        </div>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : items.length === 0 ? (
        <p className="text-gray-500">No hay solicitudes de reabastecimiento.</p>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="card-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
              <div>
                <p className="font-semibold text-white">
                  {r.productName} {r.quantity > 0 && <span className="text-gold">· {r.quantity} u.</span>}
                </p>
                <p className="text-xs text-gray-500">
                  Solicitado por {r.requestedBy || "—"} · {new Date(r.createdAt).toLocaleString("es-PE")}
                </p>
                {r.note && <p className="mt-1 text-xs text-gray-400">📝 {r.note}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs ${r.status === "PENDIENTE" ? "bg-yellow-400/10 text-yellow-400" : "bg-green-400/10 text-green-400"}`}>
                  {r.status}
                </span>
                {r.status === "PENDIENTE" && (
                  <button onClick={() => attend(r.id)} className="flex items-center gap-1 rounded-lg gold-border px-3 py-1.5 text-xs text-gold hover:bg-gold/10">
                    <Check className="h-3.5 w-3.5" /> Marcar atendida
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
