import InfoPage, { H2, P } from "@/components/InfoPage";

export const metadata = { title: "¿Quiénes somos? | Aroma de Reyes" };

export default function Page() {
  return (
    <InfoPage title="¿Quiénes somos?" subtitle="Perfumería árabe de lujo, hecha para el Perú.">
      <P>
        En <b className="text-gold">Aroma de Reyes</b> creemos que oler a realeza no debería ser
        un privilegio de pocos. Nacimos con una misión clara: acercar las fragancias árabes de
        alta calidad —conocidas por su intensa duración y proyección— a todos los peruanos, a un
        precio justo.
      </P>
      <H2>Nuestra pasión</H2>
      <P>
        Seleccionamos cuidadosamente cada fragancia de casas reconocidas de perfumería árabe.
        Cada frasco que enviamos es <b>100% original</b>, con la concentración de aceites que hace
        que estos perfumes duren hasta 12 horas en la piel.
      </P>
      <H2>Nuestro compromiso</H2>
      <P>
        Enviamos a todo el Perú con <b className="text-gold">pago contra entrega</b>: pagas solo
        cuando recibes tu pedido. Queremos que compres con total confianza y que cada experiencia
        con nosotros sea impecable, desde el primer clic hasta que abres tu fragancia.
      </P>
    </InfoPage>
  );
}
