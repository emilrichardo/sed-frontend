import { Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";

import { ProtectedRoute } from "@/components/ProtectedRoute";

const sourceCodePro = Source_Code_Pro({ subsets: ["latin"] });
// ... (metadata)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={sourceCodePro.className}>
        <AuthProvider>
          <ProtectedRoute>
            <Navbar />
            <main className="min-h-screen py-8 md:py-12">{children}</main>
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
