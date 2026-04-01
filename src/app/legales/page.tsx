import { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Aviso Legal | Santiago en Datos",
  description: "Aviso legal de Santiago en Datos. Toda la información es de carácter público.",
};

export default function LegalesPage() {
  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        title="Aviso Legal"
        description="Términos de uso y condiciones legales de la plataforma"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Naturaleza de la Información
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-foreground">Santiago en Datos</strong> es una iniciativa 
              privada dedicada a la visualización, análisis y difusión de <strong className="text-foreground">información 
              de carácter exclusivamente público</strong>. Todos los datos presentados en esta 
              plataforma provienen de fuentes oficiales del Estado y están disponibles para 
              consulta pública sin restricciones.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              No generamos información propietaria ni privada. Nuestro trabajo consiste en 
              organizar, visualizar y contextualizar datos que ya son públicos, facilitando 
              su comprensión y acceso a la ciudadanía.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Fuentes y Responsabilidad
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Los datos publicados provienen de:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
              <li>Boletín Oficial de la Provincia de Santiago del Estero</li>
              <li>Informes oficiales de ministerios y organismos estatales</li>
              <li>Bases de datos públicas del INDEC</li>
              <li>Información económica del BCRA y Ministerio de Economía</li>
              <li>Otras fuentes gubernamentales de acceso público</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Santiago en Datos no se hace responsable por la precisión de los datos 
              originales publicados por las entidades estatales. Nuestro compromiso es 
              presentar la información fielmente tal como aparece en las fuentes oficiales, 
              señalando siempre el origen de cada dato.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Uso de la Información
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Toda la información contenida en este sitio puede ser:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
              <li>Consultada libremente por cualquier persona</li>
              <li>Compartida y difundida con la debida atribución</li>
              <li>Utilizada para investigación, periodismo y análisis</li>
              <li>Citada en trabajos académicos y publicaciones</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Al tratarse de datos públicos gubernamentales, no existe restricción alguna 
              para su reproducción, siempre que se cite la fuente original correspondiente.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Propiedad Intelectual
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              El contenido original de Santiago en Datos —incluyendo diseños, visualizaciones 
              propias, código fuente y textos explicativos— está protegido por derechos de 
              autor. Sin embargo, los datos subyacentes son de dominio público o propiedad 
              de las entidades estatales que los generan.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Las visualizaciones y análisis que producimos pueden ser compartidos con 
              atribución a Santiago en Datos. El código de la plataforma puede estar 
              disponible bajo licencias de código abierto cuando se indique explícitamente.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Limitación de Responsabilidad
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Santiago en Datos:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
              <li>No garantiza la disponibilidad ininterrumpida del servicio</li>
              <li>No se responsabiliza por decisiones tomadas basándose en la información presentada</li>
              <li>Puede contener errores de transcripción que serán corregidos cuando se detecten</li>
              <li>No tiene vínculo institucional formal con el gobierno provincial o nacional</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Para fines legales oficiales, siempre se debe consultar la documentación 
              primaria en las fuentes originales (Boletín Oficial, resoluciones publicadas, etc.).
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Independencia Editorial
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Santiago en Datos es un proyecto independiente. No recibimos financiamiento 
              gubernamental ni estamos afiliados a partidos políticos. Nuestra única 
              finalidad es contribuir a la transparencia y el acceso a la información 
              pública en la provincia de Santiago del Estero.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Contacto Legal
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Para consultas legales o reportar inexactitudes en los datos, contactanos a:{" "}
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
