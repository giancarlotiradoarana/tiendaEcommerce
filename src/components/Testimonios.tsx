"use client";

import { useEffect, useState } from "react";

interface Item {
  id: string;
  imageUrl: string;
  mediaType: string;
  customer: string;
  caption: string;
}

export default function Testimonios() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch("/api/testimonials").then((r) => r.json()).then(setItems).catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="border-t border-gold/10 bg-ink-soft/30">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Nos respaldan</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-white">
            Clientes <span className="gold-text">felices</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400">Miles de peruanos ya huelen a realeza</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((t) => (
            <figure key={t.id} className="group relative overflow-hidden rounded-2xl gold-border">
              {t.mediaType === "video" ? (
                <video
                  src={t.imageUrl}
                  className="h-64 w-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.imageUrl}
                  alt={t.customer || "Cliente"}
                  className="h-64 w-full object-cover transition duration-500 group-hover:scale-110"
                />
              )}

              {/* Nombre del cliente siempre visible (badge) */}
              {t.customer && (
                <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-gold backdrop-blur">
                  ⭐ {t.customer}
                </div>
              )}

              {/* Descripción abajo (no tapa el video en su zona de controles) */}
              {t.caption && t.mediaType !== "video" && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/60 to-transparent p-3">
                  <p className="text-xs text-gray-200">{t.caption}</p>
                </figcaption>
              )}
              {t.caption && t.mediaType === "video" && (
                <figcaption className="bg-ink-card px-3 py-2 text-xs text-gray-300">{t.caption}</figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
