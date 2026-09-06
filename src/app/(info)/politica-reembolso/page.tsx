import InfoPage, { H2, P } from "@/components/InfoPage";

export const metadata = { title: "Política de reembolso | Aroma de Reyes" };

export default function Page() {
  return (
    <InfoPage title="Política de reembolso y cambios">
      <P>Tu satisfacción es importante para nosotros. Estas son las condiciones para cambios y devoluciones.</P>
      <H2>Cambios</H2>
      <P>Aceptamos cambios de producto dentro de las 48 horas de recibido, siempre que el frasco esté sellado y sin usar, en su empaque original.</P>
      <H2>Devoluciones</H2>
      <P>Si tu producto llegó dañado o presenta un defecto de fábrica, contáctanos de inmediato por WhatsApp con evidencia (fotos/video) y coordinaremos el reemplazo o reembolso.</P>
      <H2>Productos no sujetos a cambio</H2>
      <P>Por higiene, no se aceptan cambios de perfumes que ya han sido abiertos o usados, salvo defecto comprobado.</P>
      <H2>¿Cómo solicitarlo?</H2>
      <P>Escríbenos por WhatsApp indicando tu número de pedido y el motivo. Te responderemos a la brevedad.</P>
    </InfoPage>
  );
}
