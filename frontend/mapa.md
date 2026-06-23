# El mapa

`BarcelonaMap.vue` és el mapa SVG interactiu dels municipis. Renderitza geometries en format **TopoJSON** amb D3.

::: warning Mapa de la província de Barcelona
La geometria que s'inclou és la dels 311 municipis de la província de Barcelona. Per adaptar el visor a un altre territori cal substituir el fitxer de geometria (vegeu més avall).
:::

## Fitxers de geometria

La geometria viu en un únic fitxer TopoJSON empaquetat:

```
src/assets/municipis.json     Geometria TopoJSON dels municipis (~1,5 MB)
```

El component el converteix a GeoJSON en memòria amb `topojson-client`:

```js
import municipis from "@/assets/municipis.json";
import * as topojson from "topojson-client";

this.featureCollection = topojson.feature(municipis, municipis.objects.municipis);
```

Les comarques per al zoom s'obtenen agrupant geometries amb `topojson.merge`. La projecció és `d3.geoIdentity().reflectY(true)` — és a dir, **el TopoJSON ja ve en coordenades pre-projectades** i el mapa només l'escala i el centra (no aplica cap projecció geogràfica tipus Mercator).

## Props

| Prop | Tipus | Descripció |
|------|-------|------------|
| `data` | Object | Valors per municipi (objecte clau→`{ value }`) per pintar l'escala de color |
| `color` | Object \| Function | `{ min, max }` (gradient) o una escala D3 personalitzada |
| `selected` | String \| Number | Municipi seleccionat |
| `hovered` | String | Municipi en *hover* |
| `noDataColor` | String | Color per a municipis sense dada (def. `#DDDEDD`) |
| `highlighted` | String \| Number | Municipi destacat |
| `highlightColor` | String | Color del destacat |
| `scope` | String | `"municipi"`, `"comarca"`... (nivell de zoom) |
| `zoomedComarca` | Boolean | Si està fent zoom a una comarca |
| `extent` | Array | `[min, max]` per fixar el domini de l'escala |
| `accessor` | Function | Com extreure l'identificador d'una *feature* (def. `d.properties.MUNICIPI`) |

## Events emesos

```
@select(id)        click sobre un municipi
@hover(id)         entrada/sortida del ratolí
@comarcaClick      click sobre una comarca
@zoomComarca       petició de zoom a una comarca
@zoom              canvi de zoom
```

## Adaptar el mapa a un altre territori

1. Substituïu `src/assets/municipis.json` pel TopoJSON del nou territori (amb coordenades pre-projectades, o ajusteu la projecció a `BarcelonaMap.vue`).
2. Assegureu-vos que l'objecte TopoJSON s'anomeni `municipis` o actualitzeu `municipis.objects.municipis` al component.
3. Comproveu que la propietat identificadora de cada *feature* coincideix amb l'`accessor` (per defecte `MUNICIPI`).
4. Actualitzeu `src/assets/municipalities.json` i `src/utils/comarques.js` amb els municipis i comarques del nou àmbit.
