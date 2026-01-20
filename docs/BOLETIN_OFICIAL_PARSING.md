# Boletín Oficial - Guía de Estructura y Parsing

Este documento describe la estructura del Boletín Oficial de Santiago del Estero, sus metadatos, secciones y las reglas para separar correctamente las entradas (actos administrativos).

---

## 1. Estructura General del Boletín

Un Boletín Oficial típico tiene la siguiente jerarquía:

```
BOLETÍN OFICIAL
├── Metadatos del Boletín
│   ├── Número de edición
│   ├── Fecha de publicación
│   ├── Año
│   ├── raw_text (texto extraído del PDF)
│   └── archivo_binario (PDF original)
│
├── Sección 1 (ej: "Sección Administrativa")
│   ├── Entrada 1 (Decreto, Resolución, etc.)
│   ├── Entrada 2
│   └── ...
│
├── Sección 2 (ej: "Sección Judicial")
│   ├── Entrada 1 (Edicto, Aviso, etc.)
│   └── ...
│
└── Sección N (ej: "Avisos Varios")
    └── ...
```

---

## 2. Metadatos del Boletín

| Campo                | Tipo         | Descripción                                                |
| -------------------- | ------------ | ---------------------------------------------------------- |
| `numero_edicion`     | Number       | Número secuencial del boletín.                             |
| `fecha_publicacion`  | Date         | Fecha de publicación del boletín.                          |
| `anio`               | Number       | Año de publicación.                                        |
| `cantidad_paginas`   | Number       | Cantidad de páginas del PDF.                               |
| `recaudacion_diaria` | Number       | Recaudación diaria del momento.                            |
| `raw_text`           | Textarea     | Texto extraído del PDF del boletín.                        |
| `archivo_binario`    | Relationship | Referencia a `media` (PDF almacenado en Supabase Storage). |
| `slug`               | Text         | Identificador URL-friendly (auto-generado desde fecha).    |

---

## 3. Secciones Comunes

### Secciones Típicas del Boletín

| Nombre de Sección          | Contenido Típico                                          |
| -------------------------- | --------------------------------------------------------- |
| **Sección Administrativa** | Decretos, Resoluciones, Disposiciones del Poder Ejecutivo |
| **Sección Judicial**       | Edictos judiciales, citaciones, notificaciones            |
| **Avisos Varios**          | Licitaciones, concursos, avisos públicos                  |
| **Legislatura**            | Leyes, proyectos de ley                                   |
| **Municipalidades**        | Ordenanzas y resoluciones municipales                     |
| **Entes Autárquicos**      | Resoluciones de organismos descentralizados               |

### Metadatos de Sección

| Campo           | Descripción                                |
| --------------- | ------------------------------------------ |
| `nombre`        | Nombre de la sección                       |
| `pagina_inicio` | Página donde comienza la sección en el PDF |
| `contenido`     | Texto completo de la sección               |

---

## 4. Tipos de Entradas (Actos Administrativos)

### Lista de Tipos Válidos

- **Decreto**: Acto del Poder Ejecutivo Provincial
- **Resolución**: Decisión de un ministro o funcionario
- **Disposición**: Acto de autoridad inferior
- **Ley**: Norma sancionada por la Legislatura
- **Edicto**: Notificación judicial pública
- **Aviso**: Comunicación pública general
- **Licitación**: Convocatoria para contratación pública
- **Concurso**: Convocatoria para selección de personal u otros
- **Ordenanza**: Norma municipal
- **Acta**: Documento que registra una reunión o acuerdo

---

## 5. Patrones de Identificación de Entradas

### 5.1 Patrones de INICIO de Entrada

Las entradas comienzan típicamente con:

1. **Palabras Clave en Mayúsculas**:

   ```
   DECRETO N° 1234
   RESOLUCION N° 567
   EDICTO
   LEY N° 7890
   DISPOSICION N° 111
   ```

2. **Códigos Formales**:

   ```
   DECRETO-2025-1234-E-GDESDE-GSDE
   RESOL-2025-567-E-GDESDE-JGM
   ```

3. **Encabezados de Juzgado** (para Edictos):

   ```
   Juez Civil y Comercial de [Ciudad]
   Juzgado de Primera Instancia
   ```

4. **Fórmulas Iniciales**:
   ```
   VISTO:
   CONSIDERANDO:
   ```

### 5.2 Patrones de CIERRE de Entrada

Una entrada FINALIZA cuando se detecta uno de estos patrones:

#### A. Metadatos de Publicación (Edictos y Avisos)

```
NG3916 - e. 26 nov. - v.28 nov. - p.100 - $1500
N / 3920 - e. 26 nov. - v. 28 nov. - p.100 - $1500
```

**Formato**: `[Código] - e. [fecha inicio] - v. [fecha fin] - p.[página] - $[precio]`

#### B. Fórmulas de Cierre Formales

```
(regístrese, dese al Boletín Oficial y cumplido archívese. - Dr. Carlos Silva Neder Sr. Elías Miguel Suárez)

(Comuníquese, publíquese y archívese. - Dr. Carlos Silva Neder Sr. Elías Miguel Suárez Arq. Aldo Rene Hid C.P.N. Atilio Chara)

(publíquese y archívese. Dr. Carlos Silva Neder Sr. Elías Miguel Suárez Arq. Aldo Rene Hid C.P.N. Atilio Chara)

(Secretaría de Salud, a sus efectos. Dr. Carlos Silva Neder Sr. Elías Miguel Suárez)

(cumplido archívese. - Dr. Carlos Silva Neder Sr. Elías Miguel Suárez)

(Comunicar, publicar y archivar. Arq. ALDO RENE HID - Ministro C.P.N. ATILIO CHARA - Ministro)

(a sus efectos. - Dr. MARCELO A. BARBUR - Ministro)
```

#### C. Firmas con Cargos

```
Dr. CARLOS SILVA NEDER - Gobernador
Sr. ELÍAS MIGUEL SUÁREZ - Vicegobernador
Arq. ALDO RENE HID - Ministro
```

---

## 6. Estructura de una Entrada

### Campos de una Entrada

| Campo                | Descripción                       | Obligatorio |
| -------------------- | --------------------------------- | ----------- |
| `identificador_acto` | Código o título formal            | ✅          |
| `tipo_acto`          | Categoría (Decreto, Edicto, etc.) | ✅          |
| `referencia`         | Título descriptivo/resumen        | ✅          |
| `texto_completo`     | Cuerpo íntegro del documento      | ✅          |
| `paginas`            | Páginas donde aparece             | ❌          |
| `jurisdiccion`       | Ámbito territorial                | ❌          |
| `lugar_fecha`        | Lugar y fecha de emisión          | ❌          |
| `firmantes`          | Nombres de quienes firman         | ❌          |

### Ejemplo de Entrada Parseada

```json
{
  "identificador_acto": "DECRETO-2025-2748-E-GDESDE-GSDE",
  "tipo_acto": "Decreto",
  "referencia": "Ayuda económica para construcción de depósito de agua potable",
  "texto_completo": "DECRETO-2025-2748-E-GDESDE-GSDE SANTIAGO DEL ESTERO...",
  "paginas": "2, 3",
  "jurisdiccion": "Provincial",
  "firmantes": "Dr. Carlos Silva Neder, Sr. Elías Miguel Suárez"
}
```

---

## 7. Reglas de Parsing

### 7.1 Reglas Generales

1. **Encabezados de Sección NO son Entradas**:
   - `MINISTERIO DE SALUD` ❌
   - `SECCION JUDICIAL` ❌
   - `PODER EJECUTIVO` ❌

2. **Fusionar Metadatos Huérfanos**:
   - Si encuentras una línea suelta de metadatos (ej: `N / 3916 - e. 26 nov...`), pertenece a la entrada anterior.

3. **Cada entrada incluye su cierre**:
   - Los metadatos de publicación (precio, fechas) son parte de la entrada que cierran.

### 7.2 Algoritmo de Segmentación

```python
# Pseudocódigo
for line in text:
    if is_entry_start(line):  # Detecta "DECRETO", "EDICTO", etc.
        if current_entry:
            save(current_entry)  # Guarda la entrada anterior
        current_entry = new Entry()

    if current_entry:
        current_entry.append(line)

    if is_entry_end(line):  # Detecta metadatos de cierre
        # La línea de cierre YA está incluida
        pass
```

### 7.3 Regex Útiles

```javascript
// Detectar inicio de entrada
const ENTRY_START =
  /\b(DECRETO|RESOLUCION|EDICTO|LEY|DISPOSICION|AVISO|LICITACION|CONCURSO)\b/i;

// Detectar metadatos de publicación
const PUBLICATION_META =
  /N\s*\/?\s*\d+\s*-\s*e\.\s*\d+\s*\w+\.?\s*-\s*v\.?\s*\d+\s*\w+\.?\s*-\s*p\.?\s*\d+\s*-\s*\$\s*\d+/i;

// Detectar fórmulas de cierre
const FORMAL_CLOSURE =
  /\((?:regístrese|comuníquese|publíquese|archívese|a sus efectos)/i;
```

---

## 8. Consideraciones Especiales

### 8.1 Edictos Judiciales

Los edictos tienen un formato particular:

- Comienzan con `EDICTO` seguido del nombre del juzgado
- Contienen información sobre expedientes (`EXPTE`, `Autos Caratulados`)
- Terminan con metadatos de publicación (`NG3916 - e. 26 nov...`)

**Ejemplo**:

```
EDICTO Juez Civil y Comercial de Añatuya, Autos EXPTE N / 37.866/25
"ZANELLO ADOLFO BENITO S/SUCESION AB - INTESTATO". Cita y emplaza,
por el término de TREINTA DIAS, a herederos y acreedores del extinto
ZANELLO ADOLFO BENITO a fin de que comparezcan a hacer valer sus
derechos bajo apercibimiento ley. Secretaría, 11 de Noviembre de 2025
Dra. PAOLA A. FIORETTI - Secretaria 2 / N / 3916 - e. 26 nov. - v.28 nov. - p.100 - $1500
```

### 8.2 Decretos y Resoluciones

Estos actos tienen un formato más estructurado:

- Código identificador oficial (ej: `DECRETO-2025-2748-E-GDESDE-GSDE`)
- Lugar y fecha
- `VISTO:` + contexto
- `CONSIDERANDO:` + fundamentación
- `DECRETA:` / `RESUELVE:` + artículos
- Cierre formal con firmas

### 8.3 Licitaciones y Concursos

- Suelen tener múltiples renglones de items
- Incluyen fechas de apertura
- Terminan con datos de contacto y publicación

---

## 9. Modelo de Datos (Payload CMS)

### Colección: `boletines`

```typescript
{
  numero_edicion: number,
  fecha_publicacion: date,
  anio: number,
  cantidad_paginas: number,
  recaudacion_diaria: number,
  raw_text: textarea,           // Texto extraído del PDF
  archivo_binario: relationship, // Referencia a media (PDF)
  slug: string,                  // Auto-generado desde fecha
}
```

### Colección: `secciones-boletin`

```typescript
{
  nombre: string,
  boletin: relationship(boletines),
  orden: number,
}
```

### Colección: `entradas-internas`

```typescript
{
  identificador_acto: string,
  tipo_acto: relationship(tipo-acto),
  referencia: string,
  texto_completo: richText,
  seccion: relationship(secciones-boletin),
  jurisdiccion: relationship(jurisdicciones),
  nivel_opacidad: enum('Transparente' | 'Parcial' | 'Opaco'),
  lugar_fecha: string,
  paginas: string,
  es_homologacion: boolean,
}
```

---

## 10. Troubleshooting

### Problema: Entradas fusionadas incorrectamente

**Causa**: El modelo no detectó el patrón de cierre.
**Solución**: Verificar que los metadatos de publicación siguen el formato esperado.

### Problema: Entradas truncadas

**Causa**: Límite de tokens de salida.
**Solución**: Aumentar `num_predict` en la configuración de Ollama.

### Problema: Encabezados de sección detectados como entradas

**Causa**: Palabras en mayúsculas confundidas con títulos de actos.
**Solución**: Filtrar patrones conocidos de encabezados de sección.

---

## 11. Referencias

- Boletín Oficial de Santiago del Estero: https://boletin.sde.gob.ar
- Payload CMS Collections: `/backend/src/collections/`
- AI Parsing API: `/src/app/api/analyze-section/route.ts`
- Frontend Upload Page: `/src/app/admin/subir-boletin/page.tsx`
