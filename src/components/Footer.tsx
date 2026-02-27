"use client";

import Link from "next/link";
import { Instagram, Twitter, Linkedin, Mail, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-[1440px] mx-auto px-4 py-12 md:px-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
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
                href="#"
                className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Navegación
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/boletines"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  Boletines Oficiales
                </Link>
              </li>
              <li>
                <Link
                  href="/publicaciones"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  Todas las Publicaciones
                </Link>
              </li>
              <li>
                <Link
                  href="/widgets"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  Widgets e Indicadores
                </Link>
              </li>
            </ul>
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
                  contacto@santiagoendatos.gob.ar
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
          </div>

          {/* Legal / More */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">
              Legal
            </h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/privacidad"
                  className="hover:text-primary transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="hover:text-primary transition-colors"
                >
                  Términos de Uso
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="hover:text-primary transition-colors"
                >
                  Política de Cookies
                </Link>
              </li>
              <li>
                <div className="pt-4 border-t border-border">
                  <p className="text-xs italic">
                    Los datos presentados son de carácter público y se
                    actualizan periódicamente según fuentes oficiales.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Santiago en Datos. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Desarrollado con precisión técnica para{" "}
            <span className="font-bold text-foreground">
              Gobierno de Santiago
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
