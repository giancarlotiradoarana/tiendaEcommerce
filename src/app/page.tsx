import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tienda?: string }>;
}) {
  const params = await searchParams;
  const verTienda = params?.tienda === "1";

  // Si el usuario ya inició sesión (equipo) y NO pidió ver la tienda,
  // lo llevamos a su panel según el rol.
  const session = await getServerSession(authOptions);
  if (session?.user && !verTienda) {
    if (session.user.role === "ADMIN") redirect("/panel");
    redirect("/panel/pos"); // vendedor arranca en el Punto de Venta
  }

  const [products, setting] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.setting.findUnique({ where: { id: 1 } }),
  ]);

  const storeName = setting?.storeName || "Aroma de Reyes";
  const freeFrom = setting?.freeShippingFrom ?? 165;

  return (
    <>
      <Navbar storeName={storeName} />
      <CartDrawer freeShippingFrom={freeFrom} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-gold">
            Perfumería Árabe de Lujo
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl">
            Huele a <span className="gold-text">realeza</span> por una fracción del precio
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-gray-400">
            Fragancias originales con alta duración y proyección de hasta 12 horas.
            Envíos a todo el Perú con <b className="text-gold">pago contra entrega</b>.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="#catalogo" className="btn-gold rounded-xl px-8 py-3">
              Ver catálogo
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-400">
            <span>🚚 Envío a todo el Perú</span>
            <span>💵 Pago contra entrega</span>
            <span>✨ 100% originales</span>
            <span>⏱️ Larga duración</span>
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section id="catalogo" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-8 text-center text-3xl font-bold text-white">
          Nuestras <span className="gold-text">Fragancias</span>
        </h2>
        {products.length === 0 ? (
          <p className="text-center text-gray-500">
            Aún no hay productos. Agrégalos desde el panel de administración.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Nosotros */}
      <section id="nosotros" className="border-t border-gold/10 bg-ink-soft/50">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-white">
            ¿Por qué <span className="gold-text">{storeName}</span>?
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
            <Feature icon="👑" title="Lujo accesible" text="El mismo aroma de las grandes marcas, a un precio justo." />
            <Feature icon="⏱️" title="Duración real" text="Fragancias concentradas que duran todo el día." />
            <Feature icon="🇵🇪" title="Confianza total" text="Pagas cuando recibes. Envíos a todo el país." />
          </div>
        </div>
      </section>

      <footer className="border-t border-gold/10 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
      </footer>
    </>
  );
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="card-glass rounded-2xl p-6">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-4 text-lg font-bold text-gold">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{text}</p>
    </div>
  );
}
