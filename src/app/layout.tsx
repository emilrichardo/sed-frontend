import { Source_Code_Pro, Inter, Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";

import { ProtectedRoute } from "@/components/ProtectedRoute";

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-mono",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const lora = Lora({ subsets: ["latin"], variable: "--font-serif" });
// ... (metadata)

import { LayoutContent } from "@/components/LayoutContent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{const t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
        }}
      />
      <body
        className={`${sourceCodePro.variable} ${inter.variable} ${lora.variable} font-sans bg-background`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ProtectedRoute>
            <LayoutContent>{children}</LayoutContent>
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
