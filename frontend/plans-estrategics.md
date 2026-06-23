# Plans estratègics

La secció de plans estratègics mostra, per a un municipi i un ODS concrets, la presència d'aquell ODS als plans estratègics que afecten el territori. **Totes les dades són locals**: surten de fitxers CSV empaquetats amb el frontend, sense passar pel backend.

## Pàgina

| Ruta | Pàgina |
|------|--------|
| `/municipis/:id/:sdg/plans-estrategics` | `pages/municipi/sdg/plans.vue` |

## Origen de les dades

Quatre fitxers CSV a `public/data/`:

| Fitxer | Contingut | Delimitador |
|--------|-----------|-------------|
| `llistat_plans.csv` | Llistat mestre amb tots els plans | `,` |
| `plans_municipals.csv` | Plans municipals (ESCALA `M`) | `;` |
| `plans_intermunicipals.csv` | Plans intermunicipals (ESCALA `I`) | `;` |
| `plans_comarcals.csv` | Plans comarcals (ESCALA `C`) | `;` |

Es carreguen via `localApi` / `localApiPlans` (vegeu [Càrrega de dades](./carrega-de-dades)). El mètode `getMunicipalityPlans()` a `services/data.js` és el punt d'entrada des del composable `usePlansData`.

## Estructura del CSV

Tots els fitxers comparteixen la mateixa capçalera. Es divideix en tres blocs:

### Metadades del pla

| Columna | Descripció |
|---------|------------|
| `NOM` | Identificador curt del pla |
| `Nom complet` | Títol complet |
| `Any central` | Any de referència |
| `Període` | Rang d'anys (p. ex. `"2018-2023"`) |
| `Tipologia` | Tipus de pla (p. ex. `"Pla estratègic territorial"`) |
| `ESCALA` | `M` (municipal), `I` (intermunicipal), `C` (comarcal), `B` (de barri) |
| `Municipi` | Municipi principal o llista separada per `|` |
| `Municipis Escala I` | Municipis coberts per un pla intermunicipal (separats per `,`) |
| `Àmbit Intermunicipal` | Nom de l'agrupació intermunicipal, si escau |
| `Comarca` | Comarca de referència |

### Columnes per tema

Una columna per cada **subtema d'ODS** que el visor reconeix. Els noms segueixen el patró `"{ODSn} - {tema}"`, p. ex.:

```
ODS1 - Economia social i solidària
ODS2 - Agricultura i alimentació
ODS2 - Producte local
ODS3 - Salut
ODS3 - Cures
ODS3 - Economia platejada i gent gran
ODS4 - Educació
...
ODS11 - Habitatge
ODS11 - Regeneració urbana, espai públic i equipaments
...
ODS17 - Plans, pactes, acords
```

Un mateix ODS pot tenir **diversos subtemes** (l'ODS 11, p. ex., en té set). Els valors són **percentatges en text amb coma decimal** i sufix ` %` (p. ex. `"2,02 %"`).

### Resum per ODS

Després de la columna `Total` venen 17 columnes (`ODS1` ... `ODS17`) amb el valor agregat de cada ODS al pla.

## Convencions

- **Decimals**: coma (`,`), no punt. El client converteix `","` → `"."` abans del càlcul numèric.
- **Sufix de percentatge**: `" %"` (amb espai). S'elimina abans de parsejar.
- **Múltiples municipis a `Municipi`**: separats per `|`.
- **Múltiples municipis a `Municipis Escala I`**: separats per `,`.
- **ESCALA**:
  - `M` — pla municipal: aplicable si el municipi actiu apareix a `Municipi`.
  - `I` — pla intermunicipal: aplicable si el municipi actiu apareix a `Municipis Escala I`.
  - `C` — pla comarcal: aplicable si la comarca del municipi actiu coincideix amb `Comarca`. Els valors es **ponderen per 0,5** en els agregats.
  - `B` — pla de barri (tractat com a M).

## Filtratge i agregat (`usePlansData`)

`src/functions/usePlansData.js`:

1. **Filtra** els plans pertinents per al municipi actiu segons l'ESCALA i els camps de relació.
2. **Extreu** les columnes de tema corresponents a l'ODS seleccionat i el `Total`.
3. **Calcula** percentatges normalitzats: `theme_value × 100 / Total`.
4. **Construeix dos agregats**:
   - `totalAggregate` (id `0`): tots els plans combinats, ponderats per ESCALA.
   - Agregats per `Període`: agrupació temporal.
5. **Ordena** els plans per `Any central` descendent.

Retorna `{ by_plan, by_period }` cap a la pàgina.

## UI

La pàgina mostra:

- Un bloc agregat amb el valor consolidat per a l'ODS seleccionat.
- Un *disclosure* per cada pla, amb:
  - Nom i any.
  - Etiqueta de tipus (`PLA_M`, `PLA_I`, `PLA_C`).
  - Percentatge total per a l'ODS.
  - Graella amb el desglossament per subtema.
