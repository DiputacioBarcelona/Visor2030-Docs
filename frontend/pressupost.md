# Pressupost

El frontend mostra les dades pressupostàries d'un municipi en **dues vistes** complementàries: la vista per **programes** (al resum del municipi) i la vista per **ODS** (dins de la fitxa d'un ODS).

L'origen de les dades (descàrrega del repositori `gobierto-budgets-data` i import a la BBDD) està documentat a [Pressupost (backend)](../backend/pressupost).

## Pàgines

| Ruta | Pàgina | Què mostra |
|------|--------|-----------|
| `/municipis/:id/programes` | `pages/municipi/programs.vue` | Pressupost desglossat per programa pressupostari (codi funcional espanyol) |
| `/municipis/:id/:sdg/pressupost/:targetId?` | `pages/municipi/sdg/budget.vue` | Pressupost agregat per fita d'un ODS concret |

## Origen de les dades al client

Els pressupostos s'obtenen del backend via API Platform:

```
GET /api/budgets?municipality.municipality_code={ine}&year={any}
```

El composable `useBudgetData` (`src/functions/useBudgetData.js`) embolcalla `useLoadData("getBudgets", ...)` i aplica les transformacions necessàries (filtratge per any, càlcul de percentatges, etc.).

## Mapatge programa → ODS

Els codis de programa pressupostari (p. ex. `130`, `134`, `162`) **no** porten una correspondència nativa amb els ODS: el visor en defineix una pròpia a través d'un fitxer de pesos local, **carregat al client**:

```
public/data/pesos.csv
```

S'accedeix via `localApi` amb el mètode `getWeights()` (vegeu [Càrrega de dades](./carrega-de-dades)).

### Format de `pesos.csv`

Capçalera real del fitxer:

```
Grup,Nom,ODS_1,ODS_2_1,ODS_2_2,ODS_2_3,ODS_2_4,Pes_ODS_1,Pes_ODS_2_1,Pes_ODS_2_2,Pes_ODS_2_3,Pes_ODS_2_4
```

| Columna | Significat |
|---------|------------|
| `Grup` | Codi de programa pressupostari (la clau que coincideix amb `budget.program`) |
| `Nom` | Descripció del programa |
| `ODS_1` ... `ODS_2_4` | Fins a **5 fites ODS** associades, en format `{ods}.{fita}` (p. ex. `"16.7"`) |
| `Pes_ODS_1` ... `Pes_ODS_2_4` | Pes (0–1) per a cada fita; **la suma per cada programa val 1** |

Exemple de fila:

```csv
130,Administración general de la seguridad y protección civil.,16.7,5.2,11.5,16.1,,0.5,0.214285714,0.214285714,0.071428571,,1.0
```

Interpretació: del pressupost del programa `130`, un 50 % es considera adscrit a la fita 16.7, un 21,4 % a la 5.2, etc.

::: tip Per què al frontend i no al backend
Aquest mapatge és una decisió **temàtica** que pot variar segons el criteri de cada entitat. Mantenir-lo en un CSV editable a `public/data/` permet ajustar-lo sense redesplegar el backend ni tocar la base de dades.
:::

## Càlcul al client

A `useBudgetData.js`, per a un ODS concret:

1. Es filtren les files de `pesos.csv` on alguna de les columnes `ODS_x` comença per `"{sdg}."`.
2. Es construeix un índex `indexedWeightData[program][sdg] = { value, target_ids... }`.
3. Per a cada `Budget` del municipi i any seleccionats: `aportació_per_fita = budget.value × (pes / 100)`.
4. Es sumen aportacions per fita i es retornen les estructures per als gràfics.

## UI

### Vista per programes (`programs.vue`)

- **TreeMap** jeràrquic per dígits del codi de programa.
- **Taula** amb columnes: id de programa, nom, pressupost.
- **Selector d'any** (2010–2024 segons disponibilitat).

### Vista per ODS (`budget.vue`)

- **BarChart** amb el pressupost agregat per fita dins de l'ODS seleccionat.
- **LineChart** amb l'evolució del pressupost al llarg dels anys.
- Selector de fita o sub-fita.
- *Tooltip* amb el desglossament per programes que contribueixen a la xifra.
