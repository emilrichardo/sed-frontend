import { Source_Code_Pro, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

import { ProtectedRoute } from "@/components/ProtectedRoute";

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-mono",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const tiemposHeadline = localFont({
  src: [
    {
      path: "./fonts/tiempos/headline/TiemposHeadline-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/tiempos/headline/TiemposHeadline-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/tiempos/headline/TiemposHeadline-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/tiempos/headline/TiemposHeadline-RegularItalic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/tiempos/headline/TiemposHeadline-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/tiempos/headline/TiemposHeadline-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/tiempos/headline/TiemposHeadline-Semibold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/tiempos/headline/TiemposHeadline-SemiboldItalic.otf",
      weight: "600",
      style: "italic",
    },
    {
      path: "./fonts/tiempos/headline/TiemposHeadline-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/tiempos/headline/TiemposHeadline-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "./fonts/tiempos/headline/TiemposHeadline-Black.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/tiempos/headline/TiemposHeadline-BlackItalic.otf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-tiempos-headline",
});
// ... (metadata)

import { LayoutContent } from "@/components/LayoutContent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${sourceCodePro.variable} ${inter.variable} ${tiemposHeadline.variable} font-sans bg-background`}
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
