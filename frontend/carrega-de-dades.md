# Càrrega de dades

La capa de dades té tres nivells: el composable `useLoadData` (a la vista), `data.js` (defineix els endpoints) i `apiFactory.js` (axios + caché).

```
Component Vue
  └── useLoadData("getValues", ...)        functions/useLoadData.js
        └── api.getValues(params, query)    services/data.js  (construeix la URL)
              └── createCachedAPI(...)       services/apiFactory.js  (axios + caché)
                    └── Backend /api/...  (o fitxers locals /data/*.csv)
```

## `services/apis.js` — instàncies

Es creen dues (tres) instàncies amb `createCachedAPI`:

| Instància | Base | Ús |
|-----------|------|-----|
| `api` | `{apiUrl}api` | Backend remot (JSON) |
| `localApi` | `{basePath}data` | Fitxers CSV locals (`public/data/`), parsejats amb D3 (`,`) |
| `localApiPlans` | `{basePath}data` | CSV de plans (delimitats per `;`) |

La instància `api` afegeix automàticament el token JWT (`localStorage["visor2030-token"]`) **només** a les peticions a `labels-import`.

## `apiFactory.js` — caché i deduplicació

`createCachedAPI(baseURL, parseResponseFunction, configureApi)` retorna una funció de petició que:

- **Cacheja** en memòria el resultat processat (clau `{mètode} {url}`) durant la sessió.
- **Deduplica** peticions concurrents: si dues crides demanen la mateixa URL abans que la primera resolgui, comparteixen la mateixa Promise (`inflight`).
- Exposa `.clearCache()` per invalidar la caché.

Signatura de la funció retornada:

```js
cachedAPI(url, processFunction?, method = "get", useCache = true, postData?)
```

## `services/data.js` — definició d'endpoints

Conté el mapa `urls` (path de cada recurs) i un mètode per endpoint. Cada mètode construeix la query string i crida la instància corresponent.

```js
const urls = {
  municipalities: "/municipalities?order[municipality_name]=asc",
  values: "/municipality_values",
  comarcaValues: "/comarca_values",
  aggregationValues: "/aggregation_values",
  targets: "/targets",
  synthetic: "/synthetic-sdg",
  labels: "/labels-hierarchy?language=",
  postLabels: "/labels-import?language=ca",
  weights: "/pesos.csv",   // local
  // ...
};
```

### `queryParamsToString` — mapatge de paràmetres

Aquesta funció converteix els paràmetres de ruta en filtres de l'API, **remapejant** els noms i combinant els codis jeràrquics:

```js
// id          → municipality.municipality_code
// comarcaId   → comarca.comarca_code
// agregacioId → aggregation.slug
// indicatorId → indicator.indicator_id

// A més, combina sdg + targetId + indicatorId:
//   sdg=3, targetId=4, indicatorId=1  →  indicator.indicator_id=3.4.1
```

Per afegir una crida nova: afegiu una entrada a `urls` i un mètode `getXxx()` a l'objecte exportat.

## `useLoadData` — el composable

Signatura:

```js
useLoadData(
  endpoint = "getData",   // nom del mètode a data.js
  initialValue = [],      // valor inicial de `data`
  resetData = true,       // reinicia `data` abans de cada càrrega
  params = ref(null),     // paràmetres reactius (si no, usa route.params)
  loadOnMount = true,     // carrega automàticament en muntar
  useWatchers = true,     // recarrega quan canvien route.params/query
  customWatch = ref(null) // ref addicional que dispara recàrrega
)
// retorna { data, loading, error, loadData }
```

Comportament clau:

- Si algun paràmetre és `null` explícit (p. ex. un filtre encara no resolt), **omet** la càrrega.
- L'estat `loading` s'activa només si la petició triga més de 200 ms (evita parpellejos).
- Hi ha **recàrrega selectiva** segons l'endpoint: p. ex. `getMunicipalities` no es recarrega mai (dades globals), `getBudgets` només quan canvia l'`id` o el `year`, `getTargets` no es recarrega.

Exemple d'ús:

```js
const { data: values, loading } = useLoadData("getValues");
// Es recarrega automàticament en canviar els paràmetres de la ruta
```

## Dades locals (CSV)

Alguns fitxers viuen a `public/data/` i es carreguen sense passar pel backend, via `localApi`:

| Fitxer | Contingut |
|--------|-----------|
| `pesos.csv` | Pesos dels indicadors |
| `llistat_plans.csv` | Llistat de plans estratègics |
| `plans_municipals.csv`, `plans_comarcals.csv` | Plans per àmbit |
| `municipalities_2020.csv`, `municipalities_2024.csv` | Enquesta Dibàrometre |
