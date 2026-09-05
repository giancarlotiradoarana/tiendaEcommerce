"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setLoading(false);
      setError("Correo o contraseña incorrectos");
      return;
    }
    // Consultar el rol para redirigir a la pantalla correcta
    try {
      const session = await fetch("/api/auth/session").then((r) => r.json());
      const role = session?.user?.role;
      if (role === "ADMIN") router.push("/panel");
      else router.push("/panel/pos");
    } catch {
      router.push("/panel");
    }
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="card-glass w-full max-w-sm rounded-2xl p-8">
        <div className="mb-6 text-center">
          <div className="text-4xl">👑</div>
          <h1 className="gold-text mt-2 text-2xl font-bold">Panel de Administración</h1>
          <p className="mt-1 text-sm text-gray-400">Aroma de Reyes</p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
            {error}
          </p>
        )}

        <label className="mb-1 block text-xs text-gray-400">Correo</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white outline-none focus:border-gold"
          placeholder="admin@aroma.pe"
        />

        <label className="mb-1 block text-xs text-gray-400">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-lg border border-gold/30 bg-ink px-3 py-2 text-white outline-none focus:border-gold"
          placeholder="••••••••"
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full rounded-xl py-3 disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
