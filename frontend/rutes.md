# Rutes i pàgines

## Sistema de routing

Les rutes es defineixen **manualment** a `src/routes.js` i es registren al router a `src/main.js`. El router usa **mode hash** (`createWebHashHistory`), de manera que les URL tenen el format `https://domini/#/municipis/08019`.

Totes les rutes pengen d'un prefix opcional d'idioma `/:locale?`. Un *middleware* (`router.beforeEach` a `main.js`) valida el `locale` i el sincronitza amb i18n; si no és vàlid, usa el per defecte (`ca`).

## Arbre de rutes

```
/:locale?                                    → template.vue (layout arrel)
  /                          home             → index.vue
  /analisi                   analisi          → analisi.vue
  /metodologia               metodologia      → metodologia.vue
  /sobre-el-visor            about            → about.vue
  /avis-legal                legal            → avis-legal.vue
  /ods/:sdg                  sdg              → ods.vue

  /comarques/:comarcaId                       → comarca.vue [layout]
    (buit)                   comarca          → comarca/index.vue
    /:sdg                    comarca-sdg      → sdg/sdg-layout.vue
      /indicadors            comarca-sdg-targets   → sdg/targets.vue
        /:targetId           comarca-target        → sdg/target.vue
          /:indicatorId      comarca-indicator     → comarca/sdg/indicator.vue

  /agregacions/:agregacioId                   → agregacio.vue [layout]
    (estructura idèntica a comarca: agregacio, agregacio-sdg, agregacio-target, agregacio-indicator)

  /municipis/:id                              → municipi.vue [layout]
    (buit)                   municipi         → municipi/index.vue
    /programes               municipi-programs → municipi/programs.vue
    /:sdg                    municipi-sdg     → sdg/sdg-layout.vue
      /indicadors            municipi-sdg-targets  → sdg/targets.vue
        /:targetId           municipi-target       → sdg/target.vue
          /:indicatorId      municipi-indicator    → municipi/sdg/indicator.vue
      /pressupost/:targetId? municipi-sdg-budget   → municipi/sdg/budget.vue
      /plans-estrategics     municipi-sdg-plans    → municipi/sdg/plans.vue
      /valoracio-ciutadana   municipi-sdg-valoration → municipi/sdg/valoration.vue

/:path(.*)                   (404)            → [...404].vue
```

## Les tres entitats: municipi, comarca, agrupació

El visor representa tres tipus d'entitat geogràfica, cadascuna amb la mateixa estructura de subpàgines (resum → ODS → fita → indicador):

| Entitat | Prefix de ruta | Paràmetre | Layout |
|---------|----------------|-----------|--------|
| Municipi | `/municipis/:id` | `id` = codi INE | `municipi.vue` |
| Comarca | `/comarques/:comarcaId` | `comarcaId` = codi de comarca | `comarca.vue` |
| Agrupació | `/agregacions/:agregacioId` | `agregacioId` = slug | `agregacio.vue` |

Els layouts (`municipi.vue`, etc.) carreguen l'entitat i la proveeixen als seus fills amb `provide('entity', ...)`. Els municipis tenen subpàgines addicionals (pressupost, plans estratègics, valoració ciutadana) que les altres entitats no tenen.

## Paràmetres i mapatge a l'API

Els paràmetres de ruta es transformen en filtres de l'API a `src/services/data.js`. Per exemple:

| Paràmetre de ruta | Filtre a l'API |
|-------------------|----------------|
| `id` (municipi) | `municipality.municipality_code` |
| `comarcaId` | `comarca.comarca_code` |
| `agregacioId` | `aggregation.slug` |
| `indicatorId` | `indicator.indicator_id` |

El codi complet d'un indicador es reconstrueix combinant `sdg`, `targetId` i `indicatorId` (p. ex. `3` + `4` + `1` → `3.4.1`). Vegeu [Càrrega de dades](./carrega-de-dades).

## Navegació

El component `NavBar.vue` injecta `municipalities` i `comarcas` (dades globals) per oferir el selector de navegació entre entitats.
