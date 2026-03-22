"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function LoginContent() {
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("expired") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      if (data.user) {
        login(data.user);

        const returnUrl = searchParams.get("returnUrl");
        window.location.href = returnUrl ? decodeURIComponent(returnUrl) : "/";
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Ocurrió un error inesperado";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md p-8 border rounded-lg bg-card shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>

        {isExpired && !error && (
          <div className="bg-amber-50 text-amber-900 p-3 border-2 border-amber-900 mb-4 text-sm text-center font-bold">
            Su sesión ha expirado. Por favor, ingrese de nuevo.
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-900 p-3 border-2 border-red-900 mb-4 text-sm text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
              placeholder="admin@ejemplo.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-normal py-2 rounded-md hover:bg-primary/90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          Cargando...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
