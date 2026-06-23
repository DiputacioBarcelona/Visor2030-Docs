# Filtres i estat global

## Filtres a l'URL: `useFilters`

L'estat de la interfície (any seleccionat, vista, municipis comparats, etc.) **viu a l'URL**, no en un store global. Això fa que cada vista sigui compartible i navegable amb el botó enrere.

El composable `useFilters()` (`src/functions/useFilters.js`) exposa cada filtre com una `computed` amb getter/setter: llegir-lo dóna el valor de l'URL; assignar-lo actualitza l'URL (sense recàrrega).

```js
const { year, view, municipi } = useFilters();

year.value;            // llegeix ?year=... (per defecte "2024")
year.value = "2022";   // actualitza l'URL a ?year=2022
```

### Tres tipus de filtre

| Helper | Origen | Exemple |
|--------|--------|---------|
| `useSingleRouteParam(name)` | Paràmetre de ruta (`/:id`) | `id`, `sdg`, `targetId`, `indicatorId` |
| `useSingleRouteFilter(name)` | Query string (`?year=`) | `year`, `view`, `factor` |
| `useMultipleRouteFilter(name)` | Query string separada per comes (`?municipi=a,b`) | `municipi`, `gr` |

`useMultipleRouteFilter` admet assignar un array, `null` (esborra el filtre) o un valor individual (el commuta dins de la llista).

### Filtres disponibles

Paràmetres de ruta: `id`, `comarcaId`, `agregacioId`, `sdg`, `targetId`, `indicatorId`.

Query string: `year` (def. `2024`), `view`, `show`, `subindicator`, `factor` (def. `1.5`), `min_weight` (def. `30`), `size`, `facet`, `comarca`, `tram`, `municipi` (múltiple), `ubicacio`, `ruralitat`, `gr` (múltiple), `scope` (def. `municipi`).

Computeds útils: `fullTargetId` (`{sdg}.{targetId}`), `fullIndicatorId` (`{sdg}.{targetId}.{indicatorId}`), `pieces`.

## Estat global: `provide` / `inject`

Les dades comunes a tota l'app es carreguen **un sol cop** a `App.vue` i es proveeixen amb `provide`. Qualsevol component les consumeix amb `inject`, sense *prop drilling*.

| Clau | Contingut | Origen |
|------|-----------|--------|
| `municipalities` | 311 municipis amb metadades i nom formatat | `getMunicipalities` (fallback: `assets/municipalities.json`) |
| `comarcas` | Comarques amb població agregada | `getComarcas` (fallback: `assets/comarcas.json`) |
| `aggregations` | Agrupacions amb nom traduït i població | `getAggregations` |
| `targets` | Fites *(targets)* ordenades amb indicadors imbricats | `getTargets` |
| `loadingTargets` | Estat de càrrega de les fites | — |
| `dibarometreData` | Dades de l'enquesta ciutadana (pre-carregades) | `useLoadDibarometre` |
| `dibarometreLoading` | Estat de càrrega de l'enquesta | — |

```js
// En qualsevol component fill:
const municipalities = inject("municipalities");
const targets = inject("targets");
```

A més, els layouts d'entitat (`municipi.vue`, `comarca.vue`, `agregacio.vue`) proveeixen `entity` per als seus fills, i `sdg/target.vue` proveeix `target` i els seus indicadors.

::: tip Per què a l'URL i no en un store
Mantenir els filtres a l'URL fa que l'estat sigui *bookmarkable* i compartible, i delega la "font de veritat" al router. L'estat global amb `provide/inject` es reserva per a dades de referència que no canvien durant la navegació (catàlegs de municipis, comarques, fites).
:::
