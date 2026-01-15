import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { AdminBar } from "@/components/AdminBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Santiago en Datos",
  description: "Documentación y noticias sobre Santiago.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen py-8 md:py-12">{children}</main>
          <AdminBar />
        </AuthProvider>
      </body>
    </html>
  );
}
