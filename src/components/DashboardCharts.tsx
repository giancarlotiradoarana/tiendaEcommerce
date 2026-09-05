"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";

interface Report {
  last7Days: { label: string; total: number }[];
  byChannel: { channel: string; total: number; count: number }[];
  byPayment: { method: string; total: number }[];
  topProducts: { name: string; qty: number; total: number }[];
}

const GOLD = "#C9A24B";
const GOLD_LIGHT = "#E4C77A";
const BLUE = "#60A5FA";
const CARD = "#1B1B24";

export default function DashboardCharts() {
  const [data, setData] = useState<Report | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports").then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const channelData = data.byChannel.map((c) => ({
    name: c.channel === "WEB" ? "Web" : "Física",
    value: Math.round(c.total * 100) / 100,
  }));
  const channelColors = [GOLD, BLUE];

  const topData = data.topProducts.map((t) => ({
    name: t.name.length > 16 ? t.name.slice(0, 16) + "…" : t.name,
    ventas: t.qty,
  }));

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Línea: ventas últimos 7 días (ocupa 2 columnas) */}
      <div className="card-glass rounded-2xl p-5 lg:col-span-2">
        <h2 className="mb-4 font-semibold text-white">Ventas de los últimos 7 días</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.last7Days} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.5} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" />
            <XAxis dataKey="label" stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} />
            <Tooltip
              contentStyle={{ background: CARD, border: `1px solid ${GOLD}55`, borderRadius: 8, color: "#fff" }}
              formatter={(v) => [`S/ ${Number(v).toFixed(2)}`, "Ventas"]}
            />
            <Area type="monotone" dataKey="total" stroke={GOLD_LIGHT} strokeWidth={2} fill="url(#gold)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Dona: ventas por canal */}
      <div className="card-glass rounded-2xl p-5">
        <h2 className="mb-4 font-semibold text-white">Ventas por canal</h2>
        {channelData.length === 0 ? (
          <p className="text-sm text-gray-500">Sin datos aún</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={channelData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {channelData.map((_, i) => <Cell key={i} fill={channelColors[i % channelColors.length]} />)}
              </Pie>
              <Legend />
              <Tooltip
                contentStyle={{ background: CARD, border: `1px solid ${GOLD}55`, borderRadius: 8 }}
                formatter={(v) => `S/ ${Number(v).toFixed(2)}`}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Barras: productos más vendidos (2 cols) */}
      <div className="card-glass rounded-2xl p-5 lg:col-span-2">
        <h2 className="mb-4 font-semibold text-white">Productos más vendidos</h2>
        {topData.length === 0 ? (
          <p className="text-sm text-gray-500">Sin datos aún</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" />
              <XAxis dataKey="name" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: CARD, border: `1px solid ${GOLD}55`, borderRadius: 8 }}
                formatter={(v) => [`${Number(v)} u.`, "Vendidos"]}
              />
              <Bar dataKey="ventas" fill={GOLD} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Métodos de pago */}
      <div className="card-glass rounded-2xl p-5">
        <h2 className="mb-4 font-semibold text-white">Por método de pago</h2>
        {data.byPayment.length === 0 ? (
          <p className="text-sm text-gray-500">Sin datos aún</p>
        ) : (
          <div className="space-y-2 text-sm">
            {data.byPayment.map((p) => (
              <div key={p.method} className="flex justify-between border-b border-white/5 py-1.5">
                <span className="text-gray-400">{p.method}</span>
                <span className="text-gold">S/ {p.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
