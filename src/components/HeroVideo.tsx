"use client";

import { useEffect, useRef } from "react";

// Video de fondo del hero.
// En iOS/Safari el autoplay a veces no arranca solo aunque tenga los atributos
// correctos, por eso forzamos .play() al montar y reintentamos cuando el
// componente entra en pantalla o el usuario interactua por primera vez.
export default function HeroVideo({
  src,
  poster,
}: {
  src: string;
  poster?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const tryPlay = () => {
      // muted + playsInline son obligatorios para autoplay en movil
      v.muted = true;
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    tryPlay();

    // Reintentos: al cargar metadata y ante la primera interaccion del usuario
    v.addEventListener("loadeddata", tryPlay);
    const onFirstTouch = () => {
      tryPlay();
      window.removeEventListener("touchstart", onFirstTouch);
      window.removeEventListener("click", onFirstTouch);
    };
    window.addEventListener("touchstart", onFirstTouch, { once: true });
    window.addEventListener("click", onFirstTouch, { once: true });

    return () => {
      v.removeEventListener("loadeddata", tryPlay);
      window.removeEventListener("touchstart", onFirstTouch);
      window.removeEventListener("click", onFirstTouch);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      className="absolute inset-0 h-full w-full object-cover brightness-110 contrast-105"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      controls={false}
      {...({ "webkit-playsinline": "true", "x5-playsinline": "true" } as Record<string, string>)}
    />
  );
}
