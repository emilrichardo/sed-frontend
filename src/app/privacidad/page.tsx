import { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Política de Privacidad | Santiago en Datos",
  description: "Política de privacidad de Santiago en Datos. Toda la información es de carácter público.",
};

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        title="Política de Privacidad"
        description="Compromiso con la transparencia y el acceso público a la información"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Información Pública por Defecto
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-foreground">Santiago en Datos</strong> es una plataforma de visualización 
              y análisis de <strong className="text-foreground">datos públicos</strong>. Toda la información 
              presentada en este sitio web proviene de fuentes oficiales públicas del gobierno de la 
              provincia de Santiago del Estero y del Estado Nacional Argentino.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              En ningún momento recolectamos, almacenamos ni procesamos información personal de carácter 
              privado. Los datos que visualizamos son exclusivamente de interés público: estadísticas 
              gubernamentales, indicadores económicos, datos demográficos, y cualquier otra información 
              que las entidades estatales pongan a disposición de la ciudadanía.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Fuentes de Datos
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Los datos presentados provienen de las siguientes fuentes públicas:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Boletín Oficial de la Provincia de Santiago del Estero</li>
              <li>Ministerios y organismos provinciales</li>
              <li>Instituto Nacional de Estadística y Censos (INDEC)</li>
              <li>Banco Central de la República Argentina (BCRA)</li>
              <li>Ministerio de Economía de la Nación</li>
              <li>Otras fuentes oficiales públicas</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Datos de Navegación
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Al igual que la mayoría de los sitios web, podemos recopilar información técnica 
              no personal como:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Tipo de navegador y sistema operativo</li>
              <li>Páginas visitadas y tiempo de permanencia</li>
              <li>Dirección IP (anonimizada)</li>
              <li>Estadísticas de uso agregadas</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Esta información se utiliza exclusivamente para mejorar la experiencia del usuario 
              y optimizar el rendimiento de la plataforma. No se utiliza para identificar 
              individualmente a los visitantes.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Cookies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies técnicas esenciales para el funcionamiento del sitio. 
              No empleamos cookies de rastreo publicitario ni compartimos datos con 
              terceros con fines comerciales. Puedes configurar tu navegador para 
              rechazar las cookies, aunque esto podría afectar algunas funcionalidades.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Enlaces a Sitios Externos
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Nuestro sitio puede contener enlaces a sitios web gubernamentales y de 
              organismos oficiales. No nos hacemos responsables por las políticas de 
              privacidad de estos sitios externos. Te recomendamos revisar las políticas 
              de privacidad de cada sitio que visites.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Transparencia Total
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Comprometidos con la transparencia gubernamental, ponemos a disposición 
              toda nuestra metodología de recopilación y procesamiento de datos. Si tienes 
              dudas sobre el origen o tratamiento de algún dato específico, no dudes en
              <a href="mailto:contacto@santiagoendatos.com" className="text-primary hover:underline"> contactarnos</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Contacto
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Para cualquier consulta sobre esta política de privacidad, puedes escribirnos a:{" "}
              <a 
                href="mailto:contacto@santiagoendatos.com" 
                className="text-primary hover:underline"
              >
                contacto@santiagoendatos.com
              </a>
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Última actualización: Abril 2026
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
