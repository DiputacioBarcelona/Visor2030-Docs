# Components gràfics

Les visualitzacions viuen a `src/components/` i estan construïdes amb **D3.js**. Aquesta pàgina no explica la implementació interna, sinó **on són** i el **format de dades** que esperen, perquè és el que cal conèixer per reutilitzar-les.

## LineChart

`LineChart.vue` — gràfic de línies temporal (evolució d'un indicador per anys).

**Format de `data`**: array d'**arrays** (una sèrie per línia), cada sèrie amb objectes `{ name, value }`:

```js
[
  [ { name: "2015", value: 80 }, { name: "2016", value: 50 }, ... ],  // línia 1
  [ ... ],                                                            // línia 2
]
```

Props rellevants: `scale` (`"scaleLinear"`...), `color` (array de colors per línia), `defaultColor`, `highlightColor`, `highlightStrokeWidth`.

## BeeswarmChart

`BeeswarmChart.vue` — diagrama de punts forçat. Mostra la distribució de tots els municipis per a un indicador.

**Format de `data`**: array d'objectes `{ id, name, value }`:

```js
[
  { id: "08019", name: "Barcelona", value: 42.1 },
  { id: "08015", name: "Badalona", value: 38.7 },
  ...
]
```

Props rellevants: `radius` (def. 6), `padding` (def. 0.2), `axisLabel`, `horizontal` (def. `true`), `showAxis`.

## RoseChart

`RoseChart.vue` — gràfic radial (polar). S'usa per a la puntuació sintètica per ODS.

**Format de `data`**: array d'objectes `{ id, name, value, color }`:

```js
[
  { id: 1, name: "ODS 1", value: 70, color: "#bbbbbb" },
  { id: 2, name: "ODS 2", value: 79, color: "teal" },
  ...
]
```

Props rellevants: `showLabels`, `showValues`, `cornerRadius`, `padAngle`, `duration`.

## El mapa

`BarcelonaMap.vue` té la seva pròpia pàgina: vegeu [El mapa](./mapa).

## Altres visualitzacions

| Component | Ús |
|-----------|-----|
| `BarChart.vue` | Barres horitzontals/verticals |
| `StackedBarChart.vue` | Barres apilades (p. ex. pressupost per programa) |
| `ColumnChart.vue` | Columnes verticals |
| `ScatterPlotWithZoom.vue` | Dispersió amb zoom interactiu |
| `JitteredDotPlot.vue` | Punts amb *jitter* |
| `TreeMap.vue` | Treemap jeràrquic |
| `LegendColor.vue` | Llegenda d'escala de color |
| `TweeningNumber.vue` | Número animat (GSAP) |

## Exportació

Els gràfics es poden exportar amb els botons reutilitzables `DownloadCSVButton`, `DownloadSVGButton` i `DownloadImageButton` (vegeu [Components UI](./components-ui)).
