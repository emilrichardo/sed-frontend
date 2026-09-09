"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBulletins } from "@/lib/api";

// En static export no puede haber redirect() server-side ni force-dynamic.
// Este componente fetchea el último boletín en el cliente y redirige.
// Usa getBulletins (mismo API_URL con soporte de /api-proxy que el resto de
// la app) en vez de armar la URL a mano: eso pegaba directo al CMS en el
// puerto 3000, que en producción no es accesible desde el navegador y
// terminaba cayendo en el catch → redirigía al listado en vez del boletín.
export default function BoletinHoyPage() {
  const router = useRouter();

  useEffect(() => {
    getBulletins({ limit: 1 })
      .then((data) => {
        const slug = data.docs[0]?.slug;
        router.replace(slug ? `/boletines/${slug}` : "/boletines");
      })
      .catch(() => router.replace("/boletines"));
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
      Redirigiendo al último boletín...
    </div>
  );
}
