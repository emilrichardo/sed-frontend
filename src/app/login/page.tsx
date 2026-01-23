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
      // Assuming standard Payload CMS login endpoint for 'users' collection
      const res = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.errors?.[0]?.message || "Error al iniciar sesión");
      }

      if (data.token && data.user) {
        login(data.token, data.user);
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
      <div className="w-full max-w-md p-8 border border-border rounded-lg bg-card shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>

        {isExpired && !error && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-3 rounded mb-4 text-sm text-center">
            Su sesión ha expirado. Por favor, ingrese de nuevo.
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded mb-4 text-sm text-center">
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
              className="w-full p-2 rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="admin@ejemplo.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              name="password"
              className="block text-sm font-medium mb-1"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background font-medium py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
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
