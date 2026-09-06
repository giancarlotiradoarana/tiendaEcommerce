"use client";

interface Props { phone: string }

export default function WhatsappFloat({ phone }: Props) {
  const number = (phone || "").replace(/\D/g, "");
  if (!number) return null;
  const href = `https://wa.me/${number}?text=${encodeURIComponent("Hola 👋, quisiera información sobre sus perfumes.")}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] p-4 shadow-lg transition hover:scale-105 hover:shadow-[0_0_25px_rgba(37,211,102,0.6)]"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white">
        <path d="M16.004 3C9.383 3 4 8.383 4 15.004c0 2.117.555 4.184 1.61 6.008L4 29l8.184-1.57a11.94 11.94 0 0 0 3.82.627h.004C22.63 28.057 28 22.674 28 16.053 28 9.43 22.625 3 16.004 3Zm0 21.86h-.003a9.87 9.87 0 0 1-3.42-.61l-.246-.098-4.855.93.928-4.73-.16-.253a9.83 9.83 0 0 1-1.51-5.243c0-5.45 4.437-9.887 9.898-9.887 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.99c0 5.45-4.437 9.887-9.885 9.887Zm5.43-7.403c-.297-.15-1.758-.867-2.03-.966-.273-.1-.472-.15-.67.15-.198.297-.767.966-.94 1.164-.174.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.76-1.653-2.057-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.15-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.15-.67-1.612-.918-2.207-.242-.58-.487-.5-.67-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.478 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347Z" />
      </svg>
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold text-white transition-all group-hover:max-w-xs group-hover:pr-1 md:inline">
        Escríbenos
      </span>
    </a>
  );
}
