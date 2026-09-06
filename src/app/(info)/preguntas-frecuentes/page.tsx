import InfoPage, { H2, P } from "@/components/InfoPage";

export const metadata = { title: "Preguntas frecuentes | Aroma de Reyes" };

export default function Page() {
  return (
    <InfoPage title="Preguntas frecuentes" subtitle="Resolvemos tus dudas más comunes.">
      <H2>¿Los perfumes son originales?</H2>
      <P>Sí. Todas nuestras fragancias son 100% originales de casas de perfumería árabe reconocidas.</P>

      <H2>¿Cómo funciona el pago contra entrega?</H2>
      <P>
        Realizas tu pedido en la web sin pagar por adelantado. Nos contactamos contigo para
        confirmar, y pagas al courier <b>cuando recibes tu producto</b> en la puerta de tu casa.
      </P>

      <H2>¿A qué zonas envían?</H2>
      <P>Enviamos a <b className="text-gold">todo el Perú</b>. Los tiempos varían según tu ubicación (Lima suele ser más rápido que provincia).</P>

      <H2>¿Cuánto cuesta el envío?</H2>
      <P>El costo depende de tu zona y del monto de compra. Ofrecemos envío gratis a partir de cierto monto (revísalo en el carrito al finalizar tu pedido).</P>

      <H2>¿Cuánto dura la fragancia?</H2>
      <P>Los perfumes árabes destacan por su alta concentración: pueden durar hasta 12 horas en la piel, según el tipo y tu química corporal.</P>

      <H2>¿Puedo cambiar o devolver un producto?</H2>
      <P>Sí, dentro de las condiciones de nuestra política de reembolso. Escríbenos por WhatsApp y te ayudamos.</P>
    </InfoPage>
  );
}
