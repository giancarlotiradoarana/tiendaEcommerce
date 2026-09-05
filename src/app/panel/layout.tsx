import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AuthProvider from "@/components/SessionProvider";
import AdminNav from "@/components/AdminNav";
import OrderAlert from "@/components/OrderAlert";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // La pagina de login se maneja aparte (no requiere sesion)
  // pero como comparte layout, dejamos pasar si no hay sesion y
  // la propia pagina de login se muestra. Para el resto, protegemos
  // en cada pagina con getServerSession. Aqui mostramos el chrome
  // solo cuando hay sesion.
  if (!session?.user) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  const role = session.user.role || "VENDEDOR";

  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <AdminNav
          role={role}
          userName={session.user.name || "Usuario"}
        />
        <OrderAlert />
        <div className="flex flex-1 flex-col overflow-x-hidden">
          <main className="flex-1 p-6 md:p-8">{children}</main>
          <footer className="border-t border-gold/10 px-4 py-4 text-center text-xs italic leading-snug text-gray-400 sm:py-5 sm:text-sm md:text-base">
            Sistema desarrollado por{" "}
            <span className="block font-semibold text-gold sm:inline">
              Ing. Giancarlo Tirado Arana
            </span>
          </footer>
        </div>
      </div>
    </AuthProvider>
  );
}
