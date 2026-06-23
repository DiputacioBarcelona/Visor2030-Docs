# ODS sintètics

Cada ODS (1–17) té associats diversos indicadors. L'**ODS sintètic** és un valor únic de 0–100 que resumeix el compliment d'aquell objectiu per a una entitat (municipi, comarca o agrupació), calculat com una **mitjana ponderada d'indicadors normalitzats**.

A diferència de la resta de valors —que es pre-calculen i s'emmagatzemen—, els ODS sintètics es **calculen en temps real** mitjançant una única consulta SQL amb múltiples CTE. La lògica viu a `src/Controller/SyntheticSdgController.php`.

## Conceptes clau

### Pesos a la base de dades

Els pesos no provenen de cap fitxer extern: són columnes de la taula `indicator`:

- `weight` (0–100) — pes de l'indicador dins del seu ODS
- `dimension_weight` (0–100) — pes de l'indicador dins de la seva **dimensió temàtica**

Només participen en el càlcul els indicadors amb pes > 0.

### Dimensions temàtiques

A més de per ODS, els indicadors s'agrupen en quatre dimensions (els "pilars" de l'Agenda 2030):

| Dimensió | ODS inclosos |
|----------|--------------|
| `persones` | 1, 2, 3, 4, 5 |
| `planeta` | 6, 12, 13, 14, 15 |
| `prosperitat` | 7, 8, 9, 10, 11 |
| `pau` | 16, 17 |

Quan es demana el càlcul `global`, s'usa `dimension_weight` i s'agrupa per dimensió en comptes de per ODS.

## El pipeline de càlcul (8 etapes)

La consulta SQL encadena vuit CTE. Entendre-les ajuda a interpretar el resultat:

| # | Etapa | Què fa |
|---|-------|--------|
| 1 | `LatestYear` | Troba l'any més recent amb dades per a cada indicador |
| 2 | `ComputedValues` | Calcula el valor final segons `calculation` (`simple` / `ratio` / `difference`) |
| 3 | `QuartilesPerIndicator` | Assigna quartils (NTILE 4) per indicador |
| 4 | `Q1_Q3_PerIndicator` | Extreu Q1 i Q3 de cada indicador |
| 5 | `WinsorizedComputedValues` | Limita outliers a `[Q1 − k·IQR, Q3 + k·IQR]` (winsorització) |
| 6 | `IndicatorMinMax` | Min/max dels valors winsoritzats per indicador |
| 7 | `NormalizedValues` | Normalitza cada valor a 0–100 (amb inversió segons `sign`) |
| 8 | `AggregatedValues` | Mitjana ponderada per entitat i ODS/dimensió |

### Detalls rellevants

- **Winsorització IQR**: el paràmetre `factor` (k, per defecte 1.5) controla quant s'agressivament es retallen els valors extrems, evitant que un municipi atípic distorsioni l'escala 0–100.
- **Direccionalitat (`sign`)**: si `sign = 1`, més valor brut → millor puntuació; si `sign = 0`, l'escala s'inverteix (menys és millor).
- **Normalització global**: el filtre per entitat concreta s'aplica **després** de calcular min/max sobre tota la població d'entitats, de manera que la puntuació d'un municipi sempre és comparable amb la resta.
- **`calculation`**: la columna `calculation` de l'indicador determina com es combinen `value` i `value2` (vegeu [Model de valors](./model-de-dades#el-model-de-valors-value-i-value2)).

## Endpoints

### `GET /api/synthetic-sdg`

Retorna la puntuació sintètica d'una o totes les entitats.

| Paràmetre | Tipus | Descripció |
|-----------|-------|------------|
| `type` | string | `municipality` (per defecte), `comarca` o `aggregation` |
| `municipality_code` | string | Codi de 5 dígits — filtra a un municipi (si `type=municipality`) |
| `comarca_code` | string | Codi numèric — filtra a una comarca (si `type=comarca`) |
| `aggregation_slug` | string | Slug — filtra a una agrupació (si `type=aggregation`) |
| `sdg` | int | Filtra a un ODS concret (opcional) |
| `global` | bool | Si `true`, retorna també les puntuacions per dimensió (per defecte `false`) |
| `factor` | float | Multiplicador de winsorització IQR (per defecte `1.5`) |

Exemple:

```
GET /api/synthetic-sdg?type=municipality&municipality_code=08019&global=true
```

### `GET /api/sdg-indicators`

Retorna els valors **en brut** (sense normalitzar) de tots els municipis per a un ODS. Útil per a inspecció i depuració. Només suporta `type=municipality`.

| Paràmetre | Tipus | Descripció |
|-----------|-------|------------|
| `sdg` | int | **Obligatori**. Número d'ODS |

### `GET /api/municipalities-under-weight`

Retorna les entitats el pes acumulat de les quals queda per sota d'un llindar mínim: no tenen prou cobertura d'indicadors per a una puntuació fiable i convé marcar-les o excloure-les de les visualitzacions.

| Paràmetre | Tipus | Descripció |
|-----------|-------|------------|
| `type` | string | `municipality` (per defecte), `comarca`, `aggregation` |
| `sdg` | int | Filtra a un ODS (opcional) |
| `global` | bool | Si `true`, usa `dimension_weight` (per defecte `false`) |
| `min_weight` | float | Llindar mínim de pes acumulat (per defecte `30`) |
