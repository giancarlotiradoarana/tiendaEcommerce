"use client";

import Link from "next/link";
import { useCart } from "./CartContext";

export default function Navbar({ storeName }: { storeName: string }) {
  const { count, setOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 card-glass border-b border-gold/20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">👑</span>
          <span className="gold-text text-xl font-bold tracking-wide">
            {storeName}
          </span>
        </Link>

        <nav className="hidden gap-8 text-sm text-gray-300 md:flex">
          <Link href="/" className="hover:text-gold">Inicio</Link>
          <Link href="/#catalogo" className="hover:text-gold">Catálogo</Link>
          <Link href="/#nosotros" className="hover:text-gold">Nosotros</Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="relative rounded-full gold-border px-4 py-2 text-sm text-gold hover:bg-gold/10"
          >
            🛒 Carrito
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-xs font-bold text-ink">
                {count}
              </span>
            )}
          </button>
          <Link
            href="/panel/login"
            className="text-xs text-gray-500 hover:text-gold"
            title="Acceso para el equipo"
          >
            Ingresar
          </Link>
        </div>
      </div>
    </header>
  );
}
