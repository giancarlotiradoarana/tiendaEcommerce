"use client";

import { useEffect, useState } from "react";
import { Archive, FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/export";

interface Register {
  id: string; status: string; openingAmount: number;
  closingAmount: number | null; expectedAmount: number | null; difference: number | null;
  openedAt: string; closedAt: string | null;
  user: { name: string }; _count: { sales: number };
}

export default function CajasPage() {
  const [regs, setRegs] = useState<Register[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/registers").then((r) => r.json()).then((d) => { setRegs(d); setLoading(false); });
  }, []);

  const toRows = () =>
    regs.map((r) => ({
      Vendedor: r.user.name,
      Apertura: `S/ ${r.openingAmount.toFixed(2)}`,
      Ventas: r._count.sales,
      Esperado: r.expectedAmount != null ? `S/ ${r.expectedAmount.toFixed(2)}` : "—",
      Contado: r.closingAmount != null ? `S/ ${r.closingAmount.toFixed(2)}` : "—",
      Diferencia: r.difference != null ? `S/ ${r.difference.toFixed(2)}` : "—",
      Estado: r.status,
      Abierta: new Date(r.openedAt).toLocaleString("es-PE"),
      Cerrada: r.closedAt ? new Date(r.closedAt).toLocaleString("es-PE") : "—",
    }));
  const exportExcel = () => exportToExcel(`historial-cajas-${new Date().toISOString().slice(0, 10)}`, toRows(), "Historial de Cajas");
  const exportPDF = () => exportToPDF("Historial de Cajas", toRows());

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Archive className="h-7 w-7 text-gold" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Historial de Cajas</h1>
            <p className="text-sm text-gray-400">Aperturas y cierres de todos los vendedores</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-1.5 rounded-lg gold-border px-4 py-2 text-sm text-gold hover:bg-gold/10">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-1.5 rounded-lg gold-border px-4 py-2 text-sm text-gold hover:bg-gold/10">
            <FileText className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      {loading ? <p className="text-gray-500">Cargando...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold/10 text-left text-gray-400">
                <th className="p-3">Vendedor</th>
                <th className="p-3">Apertura</th>
                <th className="p-3">Ventas</th>
                <th className="p-3">Esperado</th>
                <th className="p-3">Contado</th>
                <th className="p-3">Diferencia</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {regs.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="p-3 text-white">{r.user.name}</td>
                  <td className="p-3 text-gray-300">S/ {r.openingAmount.toFixed(2)}</td>
                  <td className="p-3 text-gray-300">{r._count.sales}</td>
                  <td className="p-3 text-gray-300">{r.expectedAmount != null ? `S/ ${r.expectedAmount.toFixed(2)}` : "—"}</td>
                  <td className="p-3 text-gray-300">{r.closingAmount != null ? `S/ ${r.closingAmount.toFixed(2)}` : "—"}</td>
                  <td className="p-3">
                    {r.difference != null ? (
                      <span className={r.difference === 0 ? "text-green-400" : r.difference > 0 ? "text-blue-400" : "text-red-400"}>
                        S/ {r.difference.toFixed(2)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${r.status === "ABIERTA" ? "bg-green-400/10 text-green-400" : "bg-gray-500/10 text-gray-400"}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
