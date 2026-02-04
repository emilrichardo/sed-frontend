import React from "react";

export const RichTextParser = ({ content }: { content: any }) => {
  if (!content) return null;

  if (Array.isArray(content)) {
    return (
      <>
        {content.map((node: any, i: number) => (
          <RichTextParser key={i} content={node} />
        ))}
      </>
    );
  }

  if (content.text) {
    let text = <>{content.text}</>;
    if (content.bold) text = <strong>{text}</strong>;
    if (content.italic) text = <em>{text}</em>;
    if (content.code)
      text = (
        <code className="bg-muted px-1 py-0.5 rounded text-sm">{text}</code>
      );
    if (content.strikethrough)
      text = <span className="line-through">{text}</span>;
    if (content.underline) text = <span className="underline">{text}</span>;
    return text;
  }

  if (!content.type) return null;

  switch (content.type) {
    // Lexical Heading
    case "heading": {
      const Tag = (content.tag || "h1") as React.ElementType;
      const headingClasses = {
        h1: "text-4xl md:text-5xl font-extrabold mt-12 mb-6 tracking-tight text-foreground leading-tight",
        h2: "text-3xl font-bold mt-10 mb-4 tracking-tight text-foreground/90 border-b pb-2",
        h3: "text-2xl font-bold mt-8 mb-3 tracking-tight text-foreground/90",
        h4: "text-xl font-bold mt-6 mb-3 text-foreground/80",
        h5: "text-lg font-bold mt-6 mb-2 text-foreground/80 uppercase tracking-wide",
        h6: "text-base font-bold mt-4 mb-2 text-foreground/70 uppercase",
      };
      // fallback to h1 style if tag not found
      const className =
        headingClasses[content.tag as keyof typeof headingClasses] ||
        headingClasses.h1;

      return (
        <Tag className={className}>
          <RichTextParser content={content.children} />
        </Tag>
      );
    }

    // Lexical List
    case "list": {
      const Tag = (content.tag === "ol" ? "ol" : "ul") as React.ElementType;
      const listClasses = {
        ul: "list-disc pl-6 mb-6 space-y-2 text-lg text-foreground/90 marker:text-primary",
        ol: "list-decimal pl-6 mb-6 space-y-2 text-lg text-foreground/90 marker:font-bold marker:text-primary",
      };

      const tagKey = content.tag === "ol" ? "ol" : "ul";

      return (
        <Tag className={listClasses[tagKey]}>
          <RichTextParser content={content.children} />
        </Tag>
      );
    }

    // Lexical List Item
    case "listitem":
      return (
        <li className="mb-1 leading-relaxed pl-1">
          <RichTextParser content={content.children} />
        </li>
      );

    // Maintain backwards compatibility with explicit types if needed
    case "h1":
      return (
        <h1 className="text-4xl md:text-5xl font-extrabold mt-12 mb-6 tracking-tight text-foreground leading-tight">
          <RichTextParser content={content.children} />
        </h1>
      );
    case "h2":
      return (
        <h2 className="text-3xl font-bold mt-10 mb-4 tracking-tight text-foreground/90 border-b pb-2">
          <RichTextParser content={content.children} />
        </h2>
      );
    case "h3":
      return (
        <h3 className="text-2xl font-bold mt-8 mb-3 tracking-tight text-foreground/90">
          <RichTextParser content={content.children} />
        </h3>
      );
    case "h4":
      return (
        <h4 className="text-xl font-bold mt-6 mb-3 text-foreground/80">
          <RichTextParser content={content.children} />
        </h4>
      );
    case "h5":
      return (
        <h5 className="text-lg font-bold mt-6 mb-2 text-foreground/80 uppercase tracking-wide">
          <RichTextParser content={content.children} />
        </h5>
      );
    case "h6":
      return (
        <h6 className="text-base font-bold mt-4 mb-2 text-foreground/70 uppercase">
          <RichTextParser content={content.children} />
        </h6>
      );
    case "ul":
      return (
        <ul className="list-disc pl-6 mb-6 space-y-2 text-lg text-foreground/90 marker:text-primary">
          <RichTextParser content={content.children} />
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal pl-6 mb-6 space-y-2 text-lg text-foreground/90 marker:font-bold marker:text-primary">
          <RichTextParser content={content.children} />
        </ol>
      );
    case "li":
      return (
        <li className="mb-1">
          <RichTextParser content={content.children} />
        </li>
      );
    case "link":
      return (
        <a
          href={content.url}
          target={content.newTab ? "_blank" : undefined}
          rel={content.newTab ? "noopener noreferrer" : undefined}
          className="font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-all hover:text-primary/80"
        >
          <RichTextParser content={content.children} />
        </a>
      );
    case "upload":
      // Check if value exists and is an object (populated)
      if (!content.value || typeof content.value !== "object") return null;

      const media = content.value;
      if (!media.url) return null;

      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media.url}
            alt={media.alt || "Imagen"}
            className="w-full h-auto border border-border rounded-sm bg-muted/20"
          />
          {(media.caption || content.fields?.caption) && (
            <figcaption className="text-sm text-muted-foreground mt-3 text-center italic border-b inline-block px-4 pb-1 mx-auto">
              {media.caption || content.fields?.caption}
            </figcaption>
          )}
        </figure>
      );
    case "quote":
      return (
        <blockquote className="border-l-[6px] border-primary/20 pl-6 italic my-8 text-2xl font-serif text-foreground/80 bg-muted/10 py-4 pr-4 rounded-r-lg">
          <RichTextParser content={content.children} />
        </blockquote>
      );

    case "relationship":
      if (!content.value || typeof content.value !== "object") return null;

      const {
        titulo,
        slug,
        createdAt,
        fecha_publicacion,
        numero,
        identificador_de_acto,
        organismo,
      } = content.value;

      // Determine link type and label
      let linkHref = "#";
      let typeLabel = "Contenido Relacionado";
      let displayTitle = titulo;
      let displayDate = createdAt || fecha_publicacion;

      if (content.relationTo === "noticias") {
        linkHref = `/noticias/${slug}`;
        typeLabel = "Noticia Relacionada";
      } else if (content.relationTo === "boletines") {
        linkHref = `/boletines/${slug}`;
        typeLabel = "Boletín Relacionado";
        displayTitle = `Boletín Oficial Nº ${numero}`;
      } else if (content.relationTo === "actos-administrativos") {
        // Assuming there isn't a direct act page yet, linking to bulletin or similar?
        // Or if there is a way to view act details, use that.
        // For now, let's link to the bulletin of the act if possible, or just a placeholder
        linkHref = `/boletines/${content.value.boletin?.slug || "#"}`;
        typeLabel = "Acto Administrativo Relacionado";
        displayTitle = `${identificador_de_acto} - ${organismo}`;
      } else {
        // Generic fallback for other collections
        typeLabel = `${content.relationTo} Relacionado`;
        linkHref = `/${content.relationTo}/${slug || content.value.id}`;
      }

      return (
        <a
          href={linkHref}
          className="block my-8 p-6 border rounded-lg hover:shadow-md transition-shadow bg-card text-card-foreground group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {typeLabel}
            </span>
            <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Ver más -&gt;
            </span>
          </div>
          <h4 className="text-xl font-bold group-hover:text-primary transition-colors">
            {displayTitle || "Sin título"}
          </h4>
          {displayDate && (
            <time className="text-sm text-muted-foreground mt-2 block">
              {new Date(displayDate).toLocaleDateString("es-CL", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
        </a>
      );

    case "block":
      if (content.fields?.blockType === "table") {
        let { title, columns, rows, source_type, tabla_relacionada } =
          content.fields;

        // Handle collection-sourced tables
        if (source_type === "collection" && tabla_relacionada?.data) {
          const relatedData = tabla_relacionada.data;
          columns = relatedData.columns || [];
          rows = relatedData.rows || [];

          // Prioritize the title from the related collection
          if (tabla_relacionada.titulo) {
            title = tabla_relacionada.titulo;
          }
        } else if (content.fields.data) {
          // Handle manual tables with nested data object
          columns = content.fields.data.columns || columns;
          rows = content.fields.data.rows || rows;
        }

        return (
          <div className="my-8 overflow-hidden border rounded-lg shadow-sm">
            {title && (
              <div className="bg-muted/30 px-4 py-3 border-b">
                <h4 className="font-bold text-sm uppercase tracking-wider">
                  {title}
                </h4>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    {columns?.map((col: any) => (
                      <th
                        key={col.id}
                        className="p-3 text-left font-medium text-muted-foreground"
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows?.map((row: any, rowIndex: number) => (
                    <tr
                      key={row.id || rowIndex}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {row.cells
                        ? // Legacy cells-based format
                          row.cells.map((cell: any) => (
                            <td key={cell.id} className="p-3">
                              {cell.value}
                            </td>
                          ))
                        : // New collection-based format (keyed by column ID)
                          columns?.map((col: any) => (
                            <td key={col.id} className="p-3">
                              {row[col.id]}
                            </td>
                          ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(content.fields.tipo_visualizacion ||
              tabla_relacionada?.fuente ||
              tabla_relacionada?.actualizacion) && (
              <div className="bg-muted/10 px-4 py-3 border-t text-xs text-muted-foreground flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
                <div className="flex flex-col gap-1">
                  {content.fields.tipo_visualizacion && (
                    <div>
                      <span className="font-semibold block sm:inline mr-1">
                        Visualización:
                      </span>
                      <span className="capitalize">
                        {content.fields.tipo_visualizacion.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}
                  {tabla_relacionada?.fuente && (
                    <div>
                      <span className="font-semibold block sm:inline mr-1">
                        Fuente:
                      </span>
                      {tabla_relacionada.fuente}
                    </div>
                  )}
                </div>

                {tabla_relacionada?.actualizacion && (
                  <div className="sm:text-right mt-2 sm:mt-0">
                    <span className="font-semibold block sm:inline mr-1">
                      Actualizado:
                    </span>
                    <time dateTime={tabla_relacionada.actualizacion}>
                      {new Date(
                        tabla_relacionada.actualizacion,
                      ).toLocaleDateString("es-CL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      return null;

    // Default paragraph or other blocks with children
    default:
      if (content.children) {
        return (
          <p className="mb-6 leading-relaxed text-foreground text-lg">
            <RichTextParser content={content.children} />
          </p>
        );
      }
      return null;
  }
};
