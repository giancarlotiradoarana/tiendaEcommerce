import InfoPage, { H2, P } from "@/components/InfoPage";

export const metadata = { title: "Política de privacidad | Aroma de Reyes" };

export default function Page() {
  return (
    <InfoPage title="Política de privacidad">
      <P>En Aroma de Reyes protegemos tus datos personales conforme a la Ley N° 29733 de Protección de Datos Personales del Perú.</P>
      <H2>Datos que recopilamos</H2>
      <P>Recopilamos los datos necesarios para procesar tu pedido: nombre, celular y dirección de entrega.</P>
      <H2>Uso de tus datos</H2>
      <P>Usamos tus datos únicamente para gestionar tu compra, coordinar la entrega y, si lo autorizas, informarte sobre ofertas y novedades.</P>
      <H2>Protección</H2>
      <P>No compartimos tus datos con terceros ajenos a la operación de entrega. Aplicamos medidas razonables para mantenerlos seguros.</P>
      <H2>Tus derechos</H2>
      <P>Puedes solicitar acceder, rectificar o eliminar tus datos escribiéndonos por WhatsApp en cualquier momento.</P>
    </InfoPage>
  );
}
