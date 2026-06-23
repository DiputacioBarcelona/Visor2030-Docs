# Components UI bàsics

Components reutilitzables amb prefix `OT` (i alguns altres) que conformen la interfície. Estan a `src/components/`.

## OTSelect

Selector avançat (desplegable amb cerca, jerarquia i multi-selecció). S'usa per triar indicadors, municipis, etc. Construït sobre Headless UI.

Props habituals: `options` (poden ser un arbre amb `children`), `modelValue`, `multiple`, `allowSearch`, `leafOnly` (només seleccionables els nodes fulla), `preventDeselect`.

Variants relacionades: `OTSelectODS.vue` (selector específic d'ODS/fita/indicador), `SearchSelect.vue`, `TreeSelectItem.vue`.

## OTText / OTMarkdown

`OTText` renderitza textos i18n amb mode d'edició; `OTMarkdown` renderitza Markdown a HTML (via `@markdoc/markdoc`). Vegeu [Textos i etiquetes](./textos).

## Altres components

| Component | Ús |
|-----------|-----|
| `OTModal.vue` | Diàleg modal. Props: `isOpen`; slots `header`, `body`, `footer` |
| `OTTable.vue` | Taula amb ordenació i paginació |
| `OTPagination.vue` | Selector de pàgina |
| `OTToggle.vue` | Interruptor booleà |
| `OTTooltip.vue` / `InformationTooltip.vue` | Tooltips |
| `LoadingSpinner.vue` | Indicador de càrrega. Props: `loading`, `borderClass`, `bgColorClass` |
| `ButtonSwitch.vue` / `RouterSwitch.vue` | Commutadors de vista (mapa/llista/gràfic) |
| `DisclosureBtn.vue` | Botó desplegable/col·lapsable |
| `HighlightString.vue` | Text amb ressaltat del terme cercat |
| `DownloadCSVButton.vue` | Exporta dades a CSV. Props: `data`, `filename` |
| `DownloadSVGButton.vue` | Exporta un gràfic SVG |
| `DownloadImageButton.vue` | Exporta la visualització a imatge (PNG/JPG) |

## Components d'estructura

| Component | Ús |
|-----------|-----|
| `NavBar.vue` | Navegació superior; injecta `municipalities` i `comarcas` |
| `SubMenu.vue` | Menú lateral de l'entitat (llista d'indicadors, tabs...) |
| `FooterComponent.vue` | Peu de pàgina |
| `LanguageSwitcher.vue` | Canviador d'idioma (ca/es/en) |
| `MunicipalityFilterBar.vue` | Barra de filtres de municipi |
| `BreakpointMarker.vue` | Marcador de breakpoint Tailwind (només en dev) |

::: tip Auto-import de components
Gràcies a `unplugin-vue-components`, tots els components de `src/components/` s'auto-importen: es poden usar a les plantilles sense `import` explícit.
:::
