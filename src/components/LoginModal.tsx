"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { API_URL } from "@/lib/api";

export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Assuming Next.js route or direct Payload API
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Paylaod CMS login expects 'email' and 'password' normally
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          // If response is not JSON (e.g. 500 error page), throw
          throw new Error(
            res.status === 500
              ? "Error interno del servidor (500). Es posible que necesites reiniciar el backend."
              : `Error del servidor (${res.status}): ${text.substring(0, 50)}...`,
          );
        }
      } catch (parseErr: unknown) {
        const message =
          parseErr instanceof Error
            ? parseErr.message
            : "Respuesta inválida del servidor";
        throw new Error(message);
      }

      if (res.ok && data.token && data.user) {
        // Successful login
        login(data.token, data.user);
        closeLoginModal();
        // Clear fields
        setPassword("");
        setEmail("");
      } else {
        // Handle error
        // Payload errors are often in 'errors' array or just 'message'
        const msg =
          data.errors?.[0]?.message || data.message || "Credenciales inválidas";
        setError(msg);
      }
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Error de conexión al servidor";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isLoginModalOpen}
      onOpenChange={(open) => {
        if (!open) closeLoginModal();
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sesión Expirada</DialogTitle>
          <DialogDescription>
            Tu sesión ha caducado. Por favor ingresa tus credenciales para
            continuar sin perder tu trabajo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {error && (
            <div className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}
          <div className="grid gap-2">
            <label
              htmlFor="modal-email"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Email
            </label>
            <Input
              id="modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="modal-password"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Contraseña
            </label>
            <Input
              id="modal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={closeLoginModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ingresar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
