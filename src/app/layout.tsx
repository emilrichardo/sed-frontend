import { Source_Code_Pro, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";

import { ProtectedRoute } from "@/components/ProtectedRoute";

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-mono",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// ... (metadata)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${sourceCodePro.variable} ${inter.variable} font-sans bg-background`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ProtectedRoute>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 w-full py-8 md:py-12 overflow-x-hidden">
                {children}
              </main>
            </div>
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
