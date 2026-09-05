"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard, ScanLine, Wallet, Receipt, Bell, SprayCan,
  BarChart3, Archive, Users, Settings, Crown, Globe, LogOut,
  Truck, PackagePlus, ClipboardList, Contact, Ticket, Tags,
  type LucideIcon,
} from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
}

const groups: { title: string; links: NavLink[] }[] = [
  {
    title: "General",
    links: [
      { href: "/panel", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "VENDEDOR"] },
    ],
  },
  {
    title: "Ventas",
    links: [
      { href: "/panel/pos", label: "Punto de Venta", icon: ScanLine, roles: ["VENDEDOR"] },
      { href: "/panel/caja", label: "Caja", icon: Wallet, roles: ["VENDEDOR"] },
      { href: "/panel/ventas", label: "Ventas", icon: Receipt, roles: ["ADMIN", "VENDEDOR"] },
      { href: "/panel/pedidos", label: "Pedidos Web", icon: Bell, roles: ["ADMIN", "VENDEDOR"] },
    ],
  },
  {
    title: "Catálogo",
    links: [
      { href: "/panel/productos", label: "Productos", icon: SprayCan, roles: ["ADMIN", "VENDEDOR"] },
      { href: "/panel/categorias", label: "Categorías / Marcas", icon: Tags, roles: ["ADMIN"] },
    ],
  },
  {
    title: "Inventario",
    links: [
      { href: "/panel/proveedores", label: "Proveedores", icon: Truck, roles: ["ADMIN"] },
      { href: "/panel/compras", label: "Compras", icon: PackagePlus, roles: ["ADMIN"] },
      { href: "/panel/kardex", label: "Kardex", icon: ClipboardList, roles: ["ADMIN"] },
      { href: "/panel/reabastecimiento", label: "Reabastecimiento", icon: PackagePlus, roles: ["ADMIN"] },
    ],
  },
  {
    title: "Marketing",
    links: [
      { href: "/panel/clientes", label: "Clientes", icon: Contact, roles: ["ADMIN"] },
      { href: "/panel/cupones", label: "Cupones", icon: Ticket, roles: ["ADMIN"] },
    ],
  },
  {
    title: "Administración",
    links: [
      { href: "/panel/reportes", label: "Reportes", icon: BarChart3, roles: ["ADMIN"] },
      { href: "/panel/cajas", label: "Historial de Cajas", icon: Archive, roles: ["ADMIN"] },
      { href: "/panel/usuarios", label: "Usuarios", icon: Users, roles: ["ADMIN"] },
      { href: "/panel/configuracion", label: "Configuración", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];

export default function AdminNav({ role, userName }: { role: string; userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visibleGroups = groups
    .map((g) => ({ ...g, links: g.links.filter((l) => l.roles.includes(role)) }))
    .filter((g) => g.links.length > 0);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 rounded-lg gold-border bg-ink p-2 text-gold md:hidden"
        aria-label="Menú"
      >
        <LayoutDashboard className="h-5 w-5" />
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto border-r border-gold/20 bg-ink-soft transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-full flex-col p-4">
          <div className="mb-6 px-2 pt-2">
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-gold" />
              <span className="gold-text font-display text-lg font-bold">Aroma de Reyes</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {userName} ·{" "}
              <span className="text-gold">
                {role === "ADMIN" ? "Administrador" : "Vendedor"}
              </span>
            </p>
          </div>

          <nav className="flex-1 space-y-5">
            {visibleGroups.map((g) => (
              <div key={g.title}>
                <p className="mb-1 px-3 text-[10px] uppercase tracking-widest text-gray-600">
                  {g.title}
                </p>
                <div className="space-y-1">
                  {g.links.map((l) => {
                    const active =
                      l.href === "/panel"
                        ? pathname === "/panel"
                        : pathname.startsWith(l.href);
                    const Icon = l.icon;
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                          active
                            ? "bg-gold/15 text-gold"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {l.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-5 space-y-2 border-t border-gold/10 pt-4">
            <a
              href="/?tienda=1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-white"
            >
              <Globe className="h-4 w-4" /> Ver tienda
            </a>
            <button
              onClick={() => signOut({ callbackUrl: "/panel/login" })}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  );
}
