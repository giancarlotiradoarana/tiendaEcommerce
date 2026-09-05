"use client";

import { useEffect, useState } from "react";
import { BarChart3, FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/export";

interface Report {
  today: { total: number; count: number };
  month: { total: number; count: number };
  byChannel: { channel: string; total: number; count: number }[];
  byPayment: { method: string; total: number }[];
  topProducts: { name: string; qty: number; total: number }[];
  bySeller: { name: string; total: number; count: number }[];
}

export default function ReportesPage() {
  const [data, setData] = useState<Report | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <p className="text-gray-500">Cargando...</p>;

  // Arma un resumen consolidado para exportar
  const buildRows = () => {
    const rows: Record<string, string | number>[] = [];
    rows.push({ Sección: "Resumen", Detalle: "Ventas hoy", Valor: `S/ ${data.today.total.toFixed(2)} (${data.today.count})` });
    rows.push({ Sección: "Resumen", Detalle: "Ventas del mes", Valor: `S/ ${data.month.total.toFixed(2)} (${data.month.count})` });
    data.byChannel.forEach((c) =>
      rows.push({ Sección: "Por canal", Detalle: c.channel === "WEB" ? "Web" : "Física", Valor: `S/ ${c.total.toFixed(2)} (${c.count})` })
    );
    data.byPayment.forEach((p) =>
      rows.push({ Sección: "Por pago", Detalle: p.method, Valor: `S/ ${p.total.toFixed(2)}` })
    );
    data.topProducts.forEach((t) =>
      rows.push({ Sección: "Top productos", Detalle: t.name, Valor: `${t.qty} u. · S/ ${t.total.toFixed(2)}` })
    );
    data.bySeller.forEach((s) =>
      rows.push({ Sección: "Por vendedor", Detalle: s.name, Valor: `S/ ${s.total.toFixed(2)} (${s.count})` })
    );
    return rows;
  };
  const exportExcel = () => exportToExcel(`reporte-${new Date().toISOString().slice(0, 10)}`, buildRows(), "Reporte de Ventas");
  const exportPDF = () => exportToPDF("Reporte de Ventas", buildRows());

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-gold" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Reportes</h1>
            <p className="text-sm text-gray-400">Resumen de ventas del negocio</p>
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Ventas hoy (S/)" value={data.today.total.toFixed(2)} accent />
        <Stat label="Nº ventas hoy" value={String(data.today.count)} />
        <Stat label="Ventas del mes (S/)" value={data.month.total.toFixed(2)} />
        <Stat label="Nº ventas del mes" value={String(data.month.count)} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Ventas por canal">
          {data.byChannel.map((c) => (
            <Line key={c.channel} label={`${c.channel === "WEB" ? "🌐 Web" : "🏪 Física"} (${c.count})`} value={`S/ ${c.total.toFixed(2)}`} />
          ))}
          {data.byChannel.length === 0 && <Empty />}
        </Panel>

        <Panel title="Ventas por método de pago">
          {data.byPayment.map((p) => (
            <Line key={p.method} label={p.method} value={`S/ ${p.total.toFixed(2)}`} />
          ))}
          {data.byPayment.length === 0 && <Empty />}
        </Panel>

        <Panel title="Productos más vendidos">
          {data.topProducts.map((t) => (
            <Line key={t.name} label={`${t.name} (${t.qty} u.)`} value={`S/ ${t.total.toFixed(2)}`} />
          ))}
          {data.topProducts.length === 0 && <Empty />}
        </Panel>

        <Panel title="Ventas por vendedor">
          {data.bySeller.map((s) => (
            <Line key={s.name} label={`${s.name} (${s.count})`} value={`S/ ${s.total.toFixed(2)}`} />
          ))}
          {data.bySeller.length === 0 && <Empty />}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`card-glass rounded-2xl p-4 ${accent ? "shadow-glow" : ""}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "gold-text" : "text-white"}`}>{value}</p>
    </div>
  );
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-glass rounded-2xl p-5">
      <h2 className="mb-3 font-bold text-white">{title}</h2>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}
function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 py-1.5">
      <span className="text-gray-400">{label}</span>
      <span className="text-gold">{value}</span>
    </div>
  );
}
function Empty() { return <p className="text-gray-500">Sin datos aún</p>; }
