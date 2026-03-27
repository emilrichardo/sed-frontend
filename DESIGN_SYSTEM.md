# Santiago en Datos — Design System

Guía de estilos para uso en NotebookLM, infografías y materiales visuales.

---

## Identidad Visual

- **Proyecto:** Santiago en Datos
- **Estilo:** Editorial periodístico. Minimalista, sobrio, con tipografía serif para títulos.
- **Color identitario:** Rojo Santiago `#c95b4a` — presente en todos los acentos, botones y marcadores.

---

## Tipografía

| Rol | Fuente | Fallback |
|-----|--------|----------|
| Títulos (h1–h6) | Tiempos Headline (serif) | Georgia, ui-serif |
| Cuerpo de texto | Inter (sans-serif) | ui-sans-serif, system-ui |
| Datos / monoespaciado | Source Code Pro | monospace |

- Los títulos usan `font-weight: 600–900`, `letter-spacing: tight`
- El cuerpo usa `font-weight: 400–500`, `letter-spacing: normal`
- `-webkit-font-smoothing: antialiased` activo globalmente

---

## Colores Base

### Modo Light (por defecto)

| Token | Hex / Valor | Descripción |
|-------|-------------|-------------|
| `background` | `#ffffff` | Fondo de página |
| `foreground` | `#262624` | Texto principal (casi negro) |
| `primary` | `#c95b4a` | Rojo Santiago — acento principal |
| `primary-foreground` | `#ffffff` | Texto sobre primario |
| `card` | `#ffffff` | Fondo de tarjetas |
| `secondary` | `#f5f5f4` | Fondo secundario / chips |
| `muted` | `#f5f5f4` | Fondo neutro suave |
| `muted-foreground` | `#666666` | Texto secundario / subtítulos |
| `border` | `#e5e5e5` | Bordes de contenedores |
| `input` | `#e5e5e5` | Bordes de inputs |
| `ring` | `#262624` | Anillo de foco |

### Modo Dark

| Token | Hex | Descripción |
|-------|-----|-------------|
| `background` | `#161614` | Fondo oscuro (carbón cálido) |
| `foreground` | `~#f2f2f0` | Texto principal (off-white) |
| `primary` | `#c95b4a` | Mismo rojo (no cambia) |
| `card` | `#1e1e1c` | Tarjetas (ligeramente más claro) |
| `secondary` | `#2a2a28` | Fondo secundario |
| `muted` | `#2a2a28` | Fondo neutro |
| `muted-foreground` | `~#a3a3a0` | Texto secundario |
| `border` | `#303030` | Bordes sutiles |
| `input` | `#303030` | Inputs |
| `ring` | `#525250` | Foco suave |
| `sidebar` | `#1a1a18` | Sidebar más oscuro |

---

## Paletas de Gráficos

### `default` — Colores identitarios (5 colores)
Paleta principal. Tonos terrosos y apagados con el rojo Santiago como ancla.

| # | Hex | Descripción |
|---|-----|-------------|
| 1 | `#c95b4a` | Rojo Santiago (primario) |
| 2 | `#4d5f7a` | Azul pizarra |
| 3 | `#b08f51` | Dorado / ocre |
| 4 | `#518765` | Verde pino |
| 5 | `#8a597a` | Malva / violeta suave |

### `slate` — Monocromático (5 tonos grises)

| # | Hex | Descripción |
|---|-----|-------------|
| 1 | `#262624` | Casi negro |
| 2 | `#3d3d3a` | Gris oscuro |
| 3 | `#64748b` | Gris medio (slate-500) |
| 4 | `#94a3b8` | Gris claro (slate-400) |
| 5 | `#cbd5e1` | Gris muy claro (slate-200) |

### `semaphore` — Semáforo (3 colores)
Para indicadores de estado: positivo / neutro / negativo.

| # | Hex | Descripción |
|---|-----|-------------|
| 1 | `#16a34a` | Verde (positivo) |
| 2 | `#ca8a04` | Ámbar (advertencia) |
| 3 | `#c95b4a` | Rojo (negativo) |

### `multicolor` — Multicolor (10 colores)
Sin rojo — reservado para identidad Santiago del Estero.

| # | Hex | Descripción |
|---|-----|-------------|
| 1 | `#2563eb` | Azul |
| 2 | `#16a34a` | Verde |
| 3 | `#ea580c` | Naranja |
| 4 | `#9333ea` | Púrpura |
| 5 | `#0891b2` | Cyan |
| 6 | `#ca8a04` | Ámbar |
| 7 | `#db2777` | Rosa |
| 8 | `#0d9488` | Teal |
| 9 | `#b45309` | Marrón |
| 10 | `#6d28d9` | Índigo |

### `heatmap` — Degradé rojo (5 tonos)
Para mapas de calor y coropletas.

| # | Hex | Descripción |
|---|-----|-------------|
| 1 | `#fee2e2` | Rojo muy suave |
| 2 | `#fca5a5` | Rojo suave |
| 3 | `#ef4444` | Rojo medio |
| 4 | `#b91c1c` | Rojo oscuro |
| 5 | `#7f1d1d` | Rojo muy oscuro |

### Colores especiales de gráficos

| Token | Hex | Uso |
|-------|-----|-----|
| Santiago Red | `#c95b4a` | Serie principal / destacado |
| Bar default | `#64748b` | Barras sin serie asignada |
| Positivo waterfall | `#16a34a` | Variación positiva |
| Negativo waterfall | `#c95b4a` | Variación negativa |

---

## Botones

### Estilos base (siempre presentes)
```
font-medium, tracking-normal, rounded-md, text-sm
transition-colors, focus-visible:ring-1
```

### Variantes

| Variante | Fondo | Texto | Hover |
|----------|-------|-------|-------|
| `default` | `#c95b4a` | `#ffffff` | 90% opacidad |
| `destructive` | `#c95b4a` | `#ffffff` | 90% opacidad |
| `outline` | transparente | foreground | bg-accent |
| `secondary` | `#f5f5f4` | foreground | 80% opacidad |
| `ghost` | transparente | foreground | bg-accent |
| `link` | transparente | `#c95b4a` | subrayado |

### Tamaños

| Size | Alto | Padding |
|------|------|---------|
| `sm` | 32px | px-3 |
| `default` | 36px | px-4 |
| `lg` | 40px | px-8 |
| `icon` | 36×36px | — |

---

## Tarjetas

```
border border-border
bg-card
rounded-xl        ← radio más grande que botones
shadow-sm
hover:shadow-md
overflow-hidden
```

---

## Bordes y Radio

| Token | Valor | px |
|-------|-------|----|
| `radius-sm` | 0.25rem | 4px |
| `radius-md` | 0.375rem | 6px |
| `radius-lg` | 0.5rem | 8px (base) |
| `radius-xl` | 0.625rem | 10px |
| tarjetas | `rounded-xl` | ~12px |
| pills / chips | `rounded-full` | — |

---

## Sombras

| Token | Valor |
|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| `shadow` | `0 1px 3px rgba(0,0,0,0.1)` |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.1)` |

---

## Badges / Chips de categorías

```
px-2.5 py-0.5
text-xs font-bold uppercase tracking-normal
border
```

- Primario: `bg-primary text-white border-primary` → fondo rojo
- Secundario: `bg-muted text-muted-foreground border-transparent` → gris neutro
- Pills: `rounded-full`
- Cuadrados: sin radius extra

---

## Grilla y Espaciado

- Contenedor máximo: `max-w-7xl` (1280px)
- Padding horizontal: `px-4` mobile / `px-8` desktop
- Separación de secciones: `py-8` – `py-12`
- Gap entre tarjetas: `gap-3` – `gap-6`
- Grilla: 1 col mobile → 2–3 cols tablet → 12 cols desktop

---

## Reglas de uso en infografías

1. **Fondo claro:** `#ffffff` con texto `#262624`
2. **Fondo oscuro:** `#161614` con texto `#f2f2f0`
3. **Acento único:** siempre `#c95b4a` para el elemento más importante
4. **Máximo 5 colores** por gráfico (usar paleta `default`)
5. **Positivo/negativo:** verde `#16a34a` / rojo `#c95b4a`
6. **Títulos:** serif (Georgia como fallback si no hay Tiempos)
7. **Datos numéricos:** monoespaciado (Source Code Pro o similar)
8. **No usar rojo puro `#ff0000`** — siempre el rojo Santiago `#c95b4a`
