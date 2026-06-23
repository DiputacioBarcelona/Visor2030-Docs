# Agrupacions

Les agrupacions permeten visualitzar i comparar indicadors no només per a un municipi individual, sinó per a **conjunts de municipis** que comparteixen una característica. Aquesta pàgina cobreix com el sistema calcula els valors agregats per a **tres scopes**: agrupacions territorials (rural, AMB, RMB...), **comarques** i **província**.

## El model unificat

A partir del refactor de juny de 2026, **tot el càlcul d'agrupacions —incloses les comarques i la província— passa per un sol sistema**: l'`AggregationCalculatorService` amb el seu patró Strategy.

`AggregationConfig` (`src/Config/AggregationConfig.php`) és **la font única de veritat** que classifica cada indicador i scope amb la seva estratègia. Per a cada combinació `(indicador, scope, estratègia)` hi ha una entrada explícita a una constant.

```
AggregationCalculatorService
  ├── calculateForAggregation($id)   ← AggregationConfig::getAllEligibleIndicators()
  ├── calculateForComarca($id)       ← AggregationConfig::getAllEligibleComarcaIndicators()
  └── calculateForProvince($id)      ← AggregationConfig::getAllEligibleProvinceIndicators()
```

L'antic mecanisme de "derivar comarca i província a mà des dels valors municipals" (`importComarquesFromMunicipalities` / `importProvincesFromComarques`) **ja no existeix**. Tot passa pel `Strategy` corresponent (Ratio / PopulationWeighted / Average / BeachesWeighted / CoastalWeighted), que escriu directament a les taules `comarca_value`, `province_value` i `aggregation_value`.

## Què és una agrupació

L'entitat `Aggregation` representa un grup de municipis. Cada `Aggregation` té:
- `slug` — identificador únic (`"rural"`, `"litoral"`, `"amb"`, ...)
- `group` — categoria a la qual pertany (`"ruralitat"`, `"ubicacio"`, `"territory"`, ...)
- `name` — nom descriptiu

Els municipis s'associen a les agrupacions via la taula pivot `municipality_aggregation` (relació molts-a-molts).

| Grup (`group`) | Exemples de `slug` | Descripció |
|---|---|---|
| `ruralitat` | `rural`, `periurba`, `urba`, `metropolita` | Classificació per grau d'urbanització |
| `ubicacio` | `litoral`, `prelitoral`, `interior`, ... | Classificació per posició geogràfica |
| `territory` | `rmb`, `amb`, ... | Regions metropolitanes i territorials |
| `industrial` | `industrial` | Municipis amb activitat industrial destacada |

Aquestes agrupacions es carreguen amb `app:load-initial-data`.

**Les comarques i la província** no són entitats `Aggregation`: tenen taula pròpia (`Comarca`, `Province`) i taules de valors pròpies (`ComarcaValue`, `ProvinceValue`). Però des del punt de vista del càlcul d'agregats, segueixen el **mateix sistema** que les agrupacions.

## Estratègies de càlcul

Cada indicador té assignada una **estratègia** segons com s'ha d'agregar. Les cinc estratègies actuals viuen a `src/Service/Aggregation/`:

| Estratègia | Classe | Fórmula |
|---|---|---|
| **Ràtio** | `RatioAggregationStrategy` | `SUM(value) / SUM(value2)` (el factor d'escala l'aplica el frontend) |
| **Ponderat per població** | `PopulationWeightedStrategy` | `SUM(value × poblacio) / SUM(poblacio)` per any |
| **Ponderat per platges** | `NumberOfBeachesWeightedStrategy` | Especial per a `14.1.1` |
| **Ponderat per km de costa** | `CoastalAggregationStrategy` | Especial per a `14.2.1` |
| **Mitjana simple** | `AverageStrategy` | `AVG(value)` per any (opcionalment arrodonit) |

Totes implementen `AggregationStrategyInterface`:

```php
interface AggregationStrategyInterface
{
    public function supports(Indicator $indicator): bool;
    public function calculate(Indicator $indicator, GroupContext $group): array;
}
```

La **ràtio** s'usa per a indicadors expressats com a fracció (p. ex. "X persones de cada Y"). Necessita que l'importador hagi guardat el numerador a `value` i el denominador a `value2`.

La **ponderació per població** s'usa per a percentatges i taxes per càpita, on la suma ponderada per habitants dóna la taxa correcta del conjunt del grup.

La **ponderació per km de costa** (`CoastalAggregationStrategy`) és anàloga a la de població però fent servir els quilòmetres de litoral de cada municipi com a pes: `SUM(value × km_costa) / SUM(km_costa)` per any. S'utilitza per a `14.2.1` (preservació marina costanera). Els quilòmetres de costa per municipi es carreguen del CSV `public/uploads/km_costa_municipis_cat.csv` (la columna `CODIMUNI` és el codi INE de 6 dígits, casat contra `municipality.municipality_code_6`). Els municipis absents del CSV (és a dir, sense litoral) **queden exclosos** del càlcul ponderat — no contribueixen al numerador ni al denominador.

## Classificar un indicador a `AggregationConfig`

`AggregationConfig` exposa **tres famílies de constants paral·leles**, una per scope:

| Scope | Constants |
|-------|-----------|
| Agrupacions (rural, AMB...) | `RATIO_INDICATORS`, `POPULATION_WEIGHTED_INDICATORS`, `BEACHES_WEIGHTED_INDICATORS`, `COASTAL_WEIGHTED_INDICATORS`, `AVERAGE_INDICATORS` |
| Comarca | `COMARCA_RATIO_INDICATORS`, `COMARCA_POPULATION_WEIGHTED_INDICATORS`, `COMARCA_BEACHES_WEIGHTED_INDICATORS`, `COMARCA_COASTAL_WEIGHTED_INDICATORS`, `COMARCA_AVERAGE_INDICATORS` |
| Província | `PROVINCE_RATIO_INDICATORS`, `PROVINCE_POPULATION_WEIGHTED_INDICATORS`, `PROVINCE_BEACHES_WEIGHTED_INDICATORS`, `PROVINCE_COASTAL_WEIGHTED_INDICATORS`, `PROVINCE_AVERAGE_INDICATORS` |

::: warning Cal afegir l'indicador a cada scope explícitament
Cada llista és **independent**. Afegir un indicador a `RATIO_INDICATORS` només dispararà el càlcul per a les agrupacions; els valors de comarca i província **no s'ompliran** fins que el codi també sigui a `COMARCA_RATIO_INDICATORS` i `PROVINCE_RATIO_INDICATORS`.
:::

### Excepcions: dades autoritatives de la font

Alguns importadors escriuen valors de comarca o província **directament des de la font** (p. ex. `IdescatTableImporter` quan IDESCAT ofereix una taula específica per comarca). En aquests casos cal **deixar l'indicador fora** de la llista `COMARCA_*` o `PROVINCE_*` corresponent: si hi és, l'`AggregationCalculatorService` sobreescriuria les dades autoritatives amb un càlcul derivat.

És per això que la documentació interna d'`AggregationConfig` indica explícitament: "comarca/province subsets only include indicators **not** populated directly by the importer at that scope".

### Exemple

```php
// El nou indicador 3.4.1 té numerador i denominador (ràtio)
public const RATIO_INDICATORS = [
    // ...
    '3.4.1',
];

// Volem que aparegui també als resums per comarca i província:
public const COMARCA_RATIO_INDICATORS = [
    // ...
    '3.4.1',
];
public const PROVINCE_RATIO_INDICATORS = [
    // ...
    '3.4.1',
];
```

## Quan s'executa el càlcul

Hi ha dues vies:

### 1. Automàticament al final de cada ETL

`AbstractEtlImporter::afterSuccess()` crida `AggregationCalculatorService` per a cada scope on l'indicador estigui classificat. **Aquest és el camí habitual**: un cop afegit l'indicador a `AggregationConfig` i executat `app:run-etl-api {id}`, els valors de comarca, província i agrupacions s'omplen sols.

Si voleu inspeccionar només els valors municipals abans d'agregar, useu `--skip-aggregation`:

```bash
php bin/console app:run-etl-api 3.4.1 --skip-aggregation
```

### 2. Manualment amb `app:calculate-aggregation-values`

Útil per a **recàlculs massius**: típic quan s'afegeixen indicadors nous a `AggregationConfig` i no es vol re-executar l'ETL.

```bash
# Tots els indicadors, tots els scopes
php bin/console app:calculate-aggregation-values

# Indicador específic
php bin/console app:calculate-aggregation-values 1.2.1

# Només un scope
php bin/console app:calculate-aggregation-values --target=aggregation
php bin/console app:calculate-aggregation-values --target=comarca
php bin/console app:calculate-aggregation-values --target=province

# Agrupació o comarca concreta
php bin/console app:calculate-aggregation-values --group=rural
php bin/console app:calculate-aggregation-values 1.2.1 --target=aggregation --group=rural

# Limitar a una estratègia
php bin/console app:calculate-aggregation-values --strategy=ratio
php bin/console app:calculate-aggregation-values --strategy=population-weighted
php bin/console app:calculate-aggregation-values --strategy=beaches-weighted
php bin/console app:calculate-aggregation-values --strategy=coastal-weighted
php bin/console app:calculate-aggregation-values --strategy=average
```

## Arquitectura interna

```
AggregationCalculatorService
  ├── calculateForAggregation($id, $slug = null)
  ├── calculateForComarca($id, $code = null)
  └── calculateForProvince($id, $code = null)
        ↓
        1. Comprovació: l'indicador és a la llista corresponent d'AggregationConfig?
        2. Tria l'estratègia (Ratio / PopulationWeighted / Average / BeachesWeighted / CoastalWeighted)
        3. Per a cada grup (o el filtre $slug/$code):
             a. strategy.calculate(indicator, group) → SQL agregat (sense N+1)
             b. esborra les files existents per (indicador, grup)
             c. desa les noves files a comarca_value / province_value / aggregation_value
```

## Afegir una estratègia nova

1. Crea una classe a `src/Service/Aggregation/` que implementi `AggregationStrategyInterface`.
2. Afegeix una nova constant a `AggregationConfig` (i les variants `COMARCA_*` / `PROVINCE_*` si escau) amb els codis d'indicador que la fan servir.
3. Actualitza `AggregationCalculatorService` perquè inclogui la nova estratègia a la llista de candidates.
