import InfoPage, { H2, P } from "@/components/InfoPage";

export const metadata = { title: "Política de cookies | Aroma de Reyes" };

export default function Page() {
  return (
    <InfoPage title="Política de cookies">
      <P>Este sitio utiliza cookies para mejorar tu experiencia de navegación.</P>
      <H2>¿Qué son las cookies?</H2>
      <P>Son pequeños archivos que se guardan en tu navegador para recordar tus preferencias, como los productos de tu carrito.</P>
      <H2>¿Para qué las usamos?</H2>
      <P>Las usamos para mantener tu carrito de compras, recordar tu sesión y entender cómo se usa la tienda para mejorarla.</P>
      <H2>Control de cookies</H2>
      <P>Puedes desactivar las cookies desde la configuración de tu navegador, aunque algunas funciones de la tienda podrían no operar correctamente.</P>
    </InfoPage>
  );
}
