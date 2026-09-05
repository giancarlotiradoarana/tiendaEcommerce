"use client";

import { useCart } from "./CartContext";

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  notes: string;
  gender: string;
  price: number;
  compareAt: number | null;
  stock: number;
  imageUrl: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const soldOut = product.stock <= 0;
  const discount = product.compareAt
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0;

  return (
    <div className="group card-glass overflow-hidden rounded-2xl transition hover:shadow-glow">
      <div className="relative aspect-square overflow-hidden bg-ink-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={`${product.brand} ${product.name}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {discount > 0 && !soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink">
            -{discount}%
          </span>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/70 text-lg font-bold text-gold">
            AGOTADO
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-xs uppercase tracking-widest text-gold">
          {product.brand} · {product.gender}
        </p>
        <h3 className="mt-1 text-lg font-bold text-white">{product.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-gray-400">
          {product.notes}
        </p>

        <div className="mt-4 flex items-end justify-between">
          <div>
            {product.compareAt && (
              <span className="mr-2 text-sm text-gray-500 line-through">
                S/ {product.compareAt.toFixed(0)}
              </span>
            )}
            <span className="text-xl font-bold text-white">
              S/ {product.price.toFixed(0)}
            </span>
          </div>
        </div>

        <button
          disabled={soldOut}
          onClick={() =>
            addItem({
              id: product.id,
              name: product.name,
              brand: product.brand,
              price: product.price,
              imageUrl: product.imageUrl,
              stock: product.stock,
            })
          }
          className="btn-gold mt-4 w-full rounded-xl py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          {soldOut ? "Sin stock" : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}
