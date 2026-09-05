export default function Loading() {
  return (
    <div className="flex items-center gap-3 text-gold">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      <span className="text-sm text-gray-400">Cargando...</span>
    </div>
  );
}
