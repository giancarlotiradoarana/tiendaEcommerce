"use client";

import { useEffect, useState } from "react";

interface P { left: number; size: number; duration: number; delay: number; bottom: number }

// Partículas doradas flotantes para el hero (CSS puro, muy livianas).
// Se generan solo en el cliente para evitar mismatch de hidratación (Math.random).
export default function GoldParticles({ count = 18 }: { count?: number }) {
  const [particles, setParticles] = useState<P[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100,
        size: 3 + Math.random() * 6,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 8,
        bottom: Math.random() * 30,
      }))
    );
  }, [count]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            bottom: `${p.bottom}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
