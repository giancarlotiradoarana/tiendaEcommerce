import InfoPage, { H2, P } from "@/components/InfoPage";

export const metadata = { title: "Términos y condiciones | Aroma de Reyes" };

export default function Page() {
  return (
    <InfoPage title="Términos y condiciones">
      <P>Al usar este sitio y realizar una compra, aceptas los siguientes términos.</P>
      <H2>1. Productos y precios</H2>
      <P>Los precios están expresados en soles (S/) e incluyen IGV. Nos reservamos el derecho de modificar precios y disponibilidad sin previo aviso.</P>
      <H2>2. Pedidos</H2>
      <P>Al realizar un pedido, te contactaremos para confirmarlo. El pedido se considera concretado una vez confirmado y entregado bajo la modalidad de pago contra entrega.</P>
      <H2>3. Envíos</H2>
      <P>Realizamos envíos a todo el Perú a través de couriers. Los tiempos de entrega son estimados y pueden variar por factores externos.</P>
      <H2>4. Pago</H2>
      <P>El pago se realiza contra entrega, salvo acuerdo distinto. El cliente paga al recibir el producto.</P>
      <H2>5. Propiedad intelectual</H2>
      <P>Todo el contenido de este sitio pertenece a Aroma de Reyes y no puede reproducirse sin autorización.</P>
    </InfoPage>
  );
}
