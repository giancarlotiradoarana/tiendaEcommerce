import Link from "next/link";

// Plantilla para páginas de contenido (info legal / atención al cliente)
export default function InfoPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Barra superior simple */}
      <header className="sticky top-0 z-40 card-glass border-b border-gold/20">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <span className="gold-text font-serif text-lg font-bold">Aroma de Reyes</span>
          </Link>
          <Link href="/" className="text-sm text-gold hover:underline">← Volver a la tienda</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Atención al cliente</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-white md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-gray-400">{subtitle}</p>}
        <div className="prose-invert mt-8 space-y-5 text-sm leading-relaxed text-gray-300">
          {children}
        </div>
      </main>

      <footer className="border-t border-gold/10 py-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Aroma de Reyes. Todos los derechos reservados.
      </footer>
    </div>
  );
}

// Helpers de contenido
export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-4 font-serif text-xl font-bold text-gold">{children}</h2>;
}
export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-300">{children}</p>;
}
