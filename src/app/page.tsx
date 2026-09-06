import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Crown, Clock, ShieldCheck, Truck, Banknote, BadgeCheck } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import CatalogoTienda from "@/components/CatalogoTienda";
import ProductRow from "@/components/ProductRow";
import Testimonios from "@/components/Testimonios";
import WhatsappFloat from "@/components/WhatsappFloat";
import GoldParticles from "@/components/GoldParticles";
import HeroVideo from "@/components/HeroVideo";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tienda?: string }>;
}) {
  const params = await searchParams;
  const verTienda = params?.tienda === "1";

  const session = await getServerSession(authOptions);
  if (session?.user && !verTienda) {
    if (session.user.role === "ADMIN") redirect("/panel");
    redirect("/panel/pos");
  }

  const [products, setting, topSold] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.setting.findUnique({ where: { id: 1 } }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
  ]);

  const storeName = setting?.storeName || "Aroma de Reyes";
  const freeFrom = setting?.freeShippingFrom ?? 165;
  const notifyPhone = setting?.notifyPhone || "";
  const heroVideo = setting?.heroVideo || "";

  // --- Secciones: sistema MIXTO (automático + etiquetas manuales) ---

  // NOVEDADES: los marcados manualmente (isNew) primero, luego los más recientes por fecha
  const marcadosNuevos = products.filter((p) => p.isNew);
  const recientesAuto = [...products]
    .filter((p) => !p.isNew)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recientes = [...marcadosNuevos, ...recientesAuto].slice(0, 8);

  // OFERTAS: automático por precio "antes" mayor al actual
  const ofertas = products.filter((p) => p.compareAt && p.compareAt > p.price).slice(0, 8);

  // MÁS VENDIDOS: marcados manualmente (isBestSeller) + ventas reales, sin duplicar
  const soldMap = new Map(topSold.map((t) => [t.productId, t._sum.quantity || 0]));
  const marcadosVendidos = products.filter((p) => p.isBestSeller);
  const vendidosAuto = [...products]
    .filter((p) => !p.isBestSeller && soldMap.has(p.id))
    .sort((a, b) => (soldMap.get(b.id) || 0) - (soldMap.get(a.id) || 0));
  let populares = [...marcadosVendidos, ...vendidosAuto].slice(0, 8);
  // Si no hay ni marcados ni ventas, usamos los destacados
  if (populares.length === 0) populares = products.filter((p) => p.featured).slice(0, 8);

  return (
    <>
      <Navbar storeName={storeName} />
      <CartDrawer freeShippingFrom={freeFrom} />
      <WhatsappFloat phone={notifyPhone} />

      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center overflow-hidden border-b border-gold/10">
        {/* Fondo: video si está configurado, si no imagen con zoom lento */}
        {heroVideo ? (
          <HeroVideo
            src={heroVideo}
            poster="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&q=80"
          />
        ) : (
          <div
            className="hero-kenburns absolute inset-0"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        {/* Degradados más suaves: aclaran el video pero mantienen legible el texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-ink/30" />
        <div className="absolute inset-0 bg-ink/15" />
        {/* Glow dorado que respira */}
        <div className="hero-breathe pointer-events-none absolute -left-32 top-1/2 h-96 w-96 rounded-full bg-gold/15 blur-[120px]" />
        {/* Partículas doradas flotantes */}
        <GoldParticles />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-20 text-center sm:py-24 md:py-32">
          {/* Badge superior */}
          <div className="animate-fade-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-ink/30 px-4 py-1.5 backdrop-blur-md sm:mb-7 sm:px-5 sm:py-2">
            <Crown className="h-3.5 w-3.5 text-gold sm:h-4 sm:w-4" />
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-gold sm:text-[11px] sm:tracking-[0.35em]">
              Perfumería Árabe de Lujo
            </span>
          </div>

          <h1
            className="animate-fade-up mx-auto max-w-4xl px-2 font-serif text-[2rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl sm:leading-[1.1] md:text-7xl md:leading-[1.08]"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}
          >
            Huele a <span className="gold-text italic">realeza</span>
            <br className="hidden sm:block" /> por una fracción del precio
          </h1>

          {/* Divisor decorativo */}
          <div className="animate-fade-up mx-auto mt-7 flex items-center justify-center gap-3">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold" />
            <span className="text-gold">✦</span>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold" />
          </div>

          <p
            className="animate-fade-up mx-auto mt-5 max-w-xs text-sm font-light leading-relaxed tracking-wide text-gray-100 sm:mt-7 sm:max-w-xl sm:text-base md:text-lg"
            style={{ textShadow: "0 1px 10px rgba(0,0,0,0.7)" }}
          >
            Fragancias originales con alta duración y proyección de hasta 12 horas.
            Envíos a todo el Perú con <b className="font-semibold text-gold">pago contra entrega</b>.
          </p>

          <div className="animate-fade-up mt-8 flex flex-col justify-center gap-3 sm:mt-9 sm:flex-row sm:gap-4">
            <Link href="#catalogo" className="btn-gold flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm sm:px-8 sm:py-3.5 sm:text-base">
              Explorar catálogo →
            </Link>
            <Link href="#nosotros" className="rounded-xl border border-gold/50 bg-ink/40 px-6 py-3 text-sm text-gold backdrop-blur transition hover:bg-gold/10 sm:px-8 sm:py-3.5 sm:text-base">
              ¿Por qué nosotros?
            </Link>
          </div>

          {/* Prueba social bajo los botones */}
          <div
            className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-100"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}
          >
            <span className="flex items-center gap-2"><span className="text-gold">★★★★★</span> +1,000 clientes</span>
            <span className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-gold" /> 100% originales</span>
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-gold" /> Envío a todo el Perú</span>
          </div>
        </div>
      </section>

      {/* Banda de confianza */}
      <section className="border-b border-gold/10 bg-gradient-to-b from-ink-soft/60 to-transparent">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-4 py-8 md:grid-cols-4 md:divide-x md:divide-gold/15">
          <Trust icon={<Truck className="h-6 w-6" />} title="Envíos a todo el Perú" text="Con courier a tu puerta" />
          <Trust icon={<Banknote className="h-6 w-6" />} title="Pago contra entrega" text="Pagas cuando recibes" />
          <Trust icon={<BadgeCheck className="h-6 w-6" />} title="100% originales" text="Fragancias garantizadas" />
          <Trust icon={<Clock className="h-6 w-6" />} title="Larga duración" text="Hasta 12 horas de aroma" />
        </div>
      </section>

      {/* Categorías por género */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CategoryCard title="Para Él" gender="Masculino"
            img="https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80" />
          <CategoryCard title="Para Ella" gender="Femenino"
            img="https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800&q=80" />
          <CategoryCard title="Unisex" gender="Unisex"
            img="https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80" />
        </div>
      </section>

      {/* Ofertas */}
      {ofertas.length > 0 && (
        <div className="border-y border-gold/10 bg-gradient-to-r from-gold/5 via-transparent to-gold/5">
          <ProductRow eyebrow="🔥 Precios rebajados" title="Ofertas del momento" products={ofertas} />
        </div>
      )}

      {/* Más vendidos */}
      <ProductRow eyebrow="Los favoritos" title="Lo más vendido" products={populares} />

      {/* Lo más reciente */}
      <ProductRow eyebrow="Recién llegados" title="Lo más reciente" products={recientes} />

      {/* Catálogo con filtros */}
      <section id="catalogo" className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Catálogo completo</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-white">
            Nuestras <span className="gold-text">Fragancias</span>
          </h2>
        </div>
        {products.length === 0 ? (
          <p className="text-center text-gray-500">Aún no hay productos disponibles.</p>
        ) : (
          <CatalogoTienda products={products} />
        )}
      </section>

      {/* Evidencias de clientes (administrable) */}
      <Testimonios />

      {/* Nosotros */}
      <section id="nosotros" className="relative overflow-hidden border-t border-gold/10 bg-ink-soft/50">
        {/* brillo decorativo */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[100px]" />

        <div className="relative mx-auto max-w-6xl px-4 py-20">
          <div className="mb-14 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-gold">La experiencia Aroma de Reyes</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-white md:text-4xl">
              ¿Por qué elegir <span className="gold-text">{storeName}</span>?
            </h2>
            <div className="mx-auto mt-4 flex items-center justify-center gap-2">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold" />
              <Crown className="h-4 w-4 text-gold" />
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Feature icon={<Crown className="h-7 w-7" />} title="Lujo accesible"
              text="El mismo aroma de las grandes marcas de perfumería, a un precio que sí puedes pagar." />
            <Feature icon={<Clock className="h-7 w-7" />} title="Duración real"
              text="Fragancias concentradas de alta calidad que se sienten durante todo el día." />
            <Feature icon={<ShieldCheck className="h-7 w-7" />} title="Compra sin riesgo"
              text="Pagas contra entrega, solo cuando recibes. Envíos con courier a todo el Perú." />
          </div>

          {/* Franja de estadísticas */}
          <div className="mt-14 grid grid-cols-2 gap-4 rounded-2xl gold-border bg-ink/40 p-6 text-center md:grid-cols-4">
            <Stat value="100%" label="Originales" />
            <Stat value="12h+" label="De duración" />
            <Stat value="24" label="Departamentos" />
            <Stat value="★ 4.9" label="Satisfacción" />
          </div>
        </div>
      </section>

      {/* Footer profesional */}
      <footer className="border-t border-gold/20 bg-ink-soft/60">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 md:grid-cols-2">
          {/* Marca + contacto + redes */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">👑</span>
              <span className="gold-text font-serif text-2xl font-bold">{storeName}</span>
            </div>

            <div className="mt-8 space-y-3 text-sm text-gray-300">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold">Contáctanos</p>
              {notifyPhone && (
                <a
                  href={`https://wa.me/${notifyPhone.replace(/\D/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-gold"
                >
                  <span className="text-green-400">✆</span> +{notifyPhone}
                </a>
              )}
              <p className="flex items-center gap-2"><span className="text-gold">✉</span> contacto@aromadereyes.pe</p>
              <p className="flex items-center gap-2"><span className="text-gold">📍</span> Envíos a todo el Perú</p>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold">Síguenos en</p>
              <div className="flex gap-3">
                <SocialDot label="Facebook">f</SocialDot>
                <SocialDot label="Instagram">◎</SocialDot>
                <SocialDot label="TikTok">♪</SocialDot>
              </div>
            </div>
          </div>

          {/* Atención al cliente */}
          <div className="md:text-right">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gold">Atención al cliente</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><Link href="/nosotros" className="hover:text-gold">¿Quiénes somos?</Link></li>
              <li><Link href="/preguntas-frecuentes" className="hover:text-gold">Preguntas frecuentes</Link></li>
              <li><Link href="/terminos" className="hover:text-gold">Términos y condiciones</Link></li>
              <li><Link href="/politica-cookies" className="hover:text-gold">Política de cookies</Link></li>
              <li><Link href="/politica-reembolso" className="hover:text-gold">Política de reembolso</Link></li>
              <li><Link href="/politica-privacidad" className="hover:text-gold">Política de privacidad</Link></li>
              <li>
                <Link href="/libro-reclamaciones" className="inline-flex items-center gap-2 font-semibold text-gold hover:underline">
                  📖 Libro de reclamaciones
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 py-5 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
        </div>
      </footer>
    </>
  );
}

function Trust({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="group flex flex-col items-center gap-2 px-3 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold transition group-hover:scale-110 group-hover:bg-gold group-hover:text-ink">
        {icon}
      </span>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-gray-400">{text}</p>
    </div>
  );
}

function CategoryCard({ title, gender, img }: { title: string; gender: string; img: string }) {
  return (
    <Link href="#catalogo" className="group relative block h-48 overflow-hidden rounded-2xl gold-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={title}
        className="h-full w-full object-cover brightness-[0.85] transition duration-700 group-hover:scale-110 group-hover:brightness-[0.7]" />
      {/* Overlay ligero solo para asegurar legibilidad del texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-ink/20" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gold drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
          {gender}
        </p>
        <p className="mt-1 font-serif text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
          {title}
        </p>
        <span className="mt-3 rounded-full border border-gold bg-ink/60 px-4 py-1.5 text-xs font-medium text-gold backdrop-blur transition group-hover:bg-gold group-hover:text-ink">
          Ver colección →
        </span>
      </div>
    </Link>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="group card-glass relative overflow-hidden rounded-2xl p-8 text-center transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-glow">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold shadow-[0_0_20px_rgba(201,162,75,0.25)] transition group-hover:bg-gold group-hover:text-ink">
        {icon}
      </div>
      <h3 className="font-serif text-xl font-bold text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-gray-400">{text}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-serif text-2xl font-bold text-gold md:text-3xl">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-widest text-gray-400">{label}</p>
    </div>
  );
}

function SocialDot({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span title={label} className="flex h-9 w-9 items-center justify-center rounded-full gold-border text-gold transition hover:bg-gold hover:text-ink">
      {children}
    </span>
  );
}
