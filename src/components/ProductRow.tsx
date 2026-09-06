"use client";

import ProductCard from "./ProductCard";

interface Product {
  id: string; name: string; brand: string; description: string; notes: string;
  gender: string; price: number; compareAt: number | null; stock: number;
  imageUrl: string; featured?: boolean;
}

export default function ProductRow({
  eyebrow, title, products,
}: {
  eyebrow: string; title: string; products: Product[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
        <h2 className="mt-1 font-serif text-2xl font-bold text-white md:text-3xl">{title}</h2>
      </div>

      {/* Grilla: muestra todos los productos */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
