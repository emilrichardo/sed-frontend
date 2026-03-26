"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// En static export no puede haber redirect() server-side ni force-dynamic.
// Este componente fetchea el último boletín en el cliente y redirige.
export default function BoletinHoyPage() {
  const router = useRouter();

  useEffect(() => {
    const API_URL =
      process.env.NEXT_PUBLIC_PAYLOAD_API_URL ||
      (typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:3000`
        : "http://localhost:3000");

    fetch(`${API_URL}/api/boletines?page=1&limit=1&sort=-fecha_publicacion&depth=0&draft=false`)
      .then((r) => r.json())
      .then((data) => {
        const slug = data?.docs?.[0]?.slug;
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
