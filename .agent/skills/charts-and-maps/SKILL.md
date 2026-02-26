# Statistical Charts and Maps Skill

This skill provides instructions and examples for rendering statistical maps and charts for Argentina and its provinces, specifically Santiago del Estero.

## Maps

### Argentina Provinces Map

Used to display data aggregated by province.

- **GeoJSON**: `/public/argentina-provinces.json`
- **Projection**: `geoMercator`
- **Center**: `[-64, -38]`
- **Scale**: `1000`

### Santiago del Estero Departments Map

Used to display data aggregated by department within the province of Santiago del Estero.

- **GeoJSON**: `/public/santiago-del-estero-departments.json`
- **Projection**: `geoMercator`
- **Center**: `[-63.5, -28]`
- **Scale**: `5000`

## Components

The main component for rendering charts and maps is `ChartRenderer`.

### Supported Chart Types

- `bar_chart`: Horizontal bar chart.
- `column_chart`: Vertical bar chart.
- `pie_chart`: Pie chart.
- `donut_chart`: Donut chart.
- `line_chart`: Line chart.
- `area_chart`: Area chart.
- `map_argentina`: Statistical map of Argentina.
- `map_santiago`: Statistical map of Santiago del Estero departments.

## Data Structure

Charts expect data in the following format:

```json
[
  { "name": "Santiago del Estero", "value": 100 },
  { "name": "Tucumán", "value": 80 }
]
```

## Example Usage

```tsx
<ChartRenderer
  type="map_santiago"
  data={departmentData}
  columns={[
    { id: "departamento", header: "Departamento" },
    { id: "valor", header: "Población" },
  ]}
  config={{
    eje_principal: "departamento",
    eje_valores: "valor",
  }}
/>
```
