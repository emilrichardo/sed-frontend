"use client";

import Link from "next/link";
import { Instagram, Twitter, Linkedin, Mail, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      {/* Desktop full footer */}
      <div className="hidden md:block max-w-[1440px] mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12 lg:gap-8">
          {/* Logo & About */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-extrabold tracking-tight font-heading">
                Santiago en Datos
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Plataforma de visualización y análisis de datos públicos de la
              provincia de Santiago del Estero. Transparencia, acceso y
              conocimiento.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/santiagoendatos"
                className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Resources / Support */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Contacto y Soporte
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-primary" />
                <div className="text-sm text-muted-foreground">
                  <span className="block font-medium text-foreground">
                    Email
                  </span>
                  <a
                    href="mailto:contacto@santiagoendatos.com"
                    className="hover:text-primary transition-colors"
                  >
                    contacto@santiagoendatos.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <div className="text-sm text-muted-foreground">
                  <span className="block font-medium text-foreground">
                    Ubicación
                  </span>
                  Santiago del Estero, Argentina
                </div>
              </li>
            </ul>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground italic">
                Los datos presentados son de carácter público y se actualizan
                periódicamente según fuentes oficiales.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Santiago en Datos. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6 text-xs">
            <Link 
              href="/privacidad" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Política de Privacidad
            </Link>
            <span className="text-border">|</span>
            <Link 
              href="/legales" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Aviso Legal
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile: only copyright */}
      <div className="md:hidden px-4 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {currentYear} Santiago en Datos. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
