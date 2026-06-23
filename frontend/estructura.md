# Estructura de fitxers

El frontend és una SPA Vue 3 amb Vite. Tot el codi viu sota `src/`.

```
src/
├── App.vue              Component arrel. Carrega i proveeix (provide) les dades globals
├── main.js              Punt d'entrada: crea l'app, el router, i18n i el head
├── config.js            URL de l'API i base path
├── routes.js            Definició de totes les rutes (font de veritat del routing)
├── tailwind.css         Importacions de Tailwind
├── components/          Components reutilitzables (50+)
│   ├── OT*.vue          Components de disseny propi (OTText, OTSelect, OTModal...)
│   ├── *Chart.vue       Visualitzacions D3 (LineChart, BeeswarmChart, RoseChart...)
│   ├── BarcelonaMap.vue Mapa interactiu (TopoJSON + D3)
│   ├── NavBar.vue       Navegació superior
│   ├── sdg/             Components de la fitxa d'ODS (layout, targets, target)
│   ├── indicator/       Components de visualització d'indicador
│   ├── index/           Seccions de la pàgina d'inici
│   └── dibarometre/     Components de l'enquesta ciutadana
├── pages/               Components de pàgina (referenciats des de routes.js)
│   ├── index.vue        Inici
│   ├── template.vue     Layout arrel (sota /:locale?)
│   ├── municipi.vue     Layout de municipi (proveeix `entity`)
│   ├── municipi/        Subpàgines de municipi (index, programs, sdg/...)
│   ├── comarca.vue      Layout de comarca
│   ├── comarca/         Subpàgines de comarca
│   ├── agregacio.vue    Layout d'agrupació
│   ├── agregacio/       Subpàgines d'agrupació
│   ├── ods.vue          Fitxa d'un ODS
│   ├── analisi.vue      Anàlisi comparativa
│   ├── metodologia.vue  Metodologia
│   ├── about.vue        Sobre el visor
│   ├── avis-legal.vue   Avís legal
│   └── [...404].vue     Pàgina no trobada
├── functions/           Composables (useLoadData, useFilters, useLoadLabels...)
├── services/            Capa de dades (data.js, apis.js, apiFactory.js)
├── utils/               Utilitats pures (helpers, colors, comarques, ids...)
├── locales/             Textos base i18n (ca.json, es.json, en.json)
└── assets/              Dades estàtiques empaquetades
    ├── municipalities.json   Metadades dels 311 municipis (fallback)
    ├── comarcas.json         Metadades de comarques (fallback)
    ├── municipis.json        Geometria TopoJSON del mapa (~1,5 MB)
    └── sdgs.json             Metadades dels ODS
```

## On va cada cosa

| Tasca | On treballar |
|-------|-------------|
| Nova pàgina/ruta | `src/pages/` + registrar a `src/routes.js` |
| Nou component visual | `src/components/` |
| Nova crida a l'API | `src/services/data.js` (afegir mètode + entrada a `urls`) |
| Nova lògica reutilitzable | `src/functions/` (composable `useXxx`) |
| Nou filtre d'URL | `src/functions/useFilters.js` |
| Constants/colors/helpers | `src/utils/` |
| Textos base | `src/locales/*.json` (però normalment s'editen via API, vegeu [Textos](./textos)) |

## Convencions

- **Composition API** amb `<script setup>` a la majoria de components.
- **Auto-import**: `ref`, `computed`, `watch`, `provide`, `inject`, etc. estan auto-importats (via `unplugin-auto-import`); no cal importar-los explícitament. Els components de `src/components/` també s'auto-importen.
- **Àlies `@`** apunta a `src/`.
- **Tailwind CSS** per als estils; **D3.js** per a les visualitzacions.
