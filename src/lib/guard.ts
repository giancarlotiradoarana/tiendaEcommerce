import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("NO_AUTH");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    throw new Error("NO_ADMIN");
  }
  return session;
}

// Solo el VENDEDOR opera caja y POS (el admin solo supervisa)
export async function requireSeller() {
  const session = await requireAuth();
  if (session.user.role !== "VENDEDOR") {
    throw new Error("NO_SELLER");
  }
  return session;
}

export function guardResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : "";
  if (msg === "NO_AUTH")
    return { status: 401, body: { error: "No autenticado" } };
  if (msg === "NO_ADMIN")
    return { status: 403, body: { error: "Requiere permisos de administrador" } };
  if (msg === "NO_SELLER")
    return { status: 403, body: { error: "Solo el vendedor puede operar caja y ventas" } };
  return { status: 500, body: { error: "Error del servidor" } };
}
