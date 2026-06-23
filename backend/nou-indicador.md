# Com crear un indicador nou

Aquesta és la tasca més habitual en l'adaptació del Visor 2030. Un indicador nou segueix sempre el mateix camí: definir-lo, crear l'importador ETL que obté les dades, executar la importació i, opcionalment, calcular els valors d'agrupació.

::: tip Prerequisit
Abans de crear un importador nou, mireu si la vostra font de dades **encaixa amb un patró ja existent** (`Do`, `Dodo`, `Idescat`, `DoIdescat`...). Si és així, podeu **afegir simplement el nou indicador a la `getDefinitions()`** de l'importador existent — sovint no cal una classe nova. Vegeu la taula de patrons a [ETL: importadors de dades](./etl#els-18-importadors-actuals).
:::

## 1. Entendre la jerarquia ODS

Cada indicador pertany a una fita (*target*), que al seu torn pertany a un ODS:

```
ODS 1 (Fi de la pobresa)
  └── Fita 1.2 (Reduir la proporció de població en pobresa...)
        └── Indicador 1.2.1 (% Població amb ingressos < 60%)
        └── Indicador 1.2.2 (Renda mediana)
```

La nomenclatura del codi d'indicador és `{ods}.{fita}.{indicador}`, p. ex. `3.4.1`.

## 2. Crear (o estendre) l'importador ETL

Si l'indicador no encaixa en cap patró existent, creeu una classe nova que extengui `AbstractEtlImporter`.

### 2.1 Crear el fitxer

Crea un fitxer nou a `src/Service/Etl/Importer/`, per exemple `MyNewImporter.php`:

```php
<?php

namespace App\Service\Etl\Importer;

use App\Entity\Indicator;
use App\Service\Etl\Dto\EtlContext;
use App\Service\Etl\Dto\IndicatorDefinition;

final class MyNewImporter extends AbstractEtlImporter
{
    protected function getDefinitions(): array
    {
        return [
            '3.4.1' => new IndicatorDefinition(
                indicatorId:          '3.4.1',
                targetId:             '3.4',
                targetName:           'Reduir la mortalitat prematura per malalties no transmissibles',
                sdg:                  3,
                indicatorName:        'Taxa de mortalitat per malalties cardiovasculars',
                indicatorDescription: 'Morts per malalties cardiovasculars per 100.000 habitants',
                sign:                 false,   // false = menys és millor
                source:               'IDESCAT',
                unit:                 'per100k',
                scale:                1,
                url:                  'https://api.idescat.cat/...',
            ),
        ];
    }

    protected function import(IndicatorDefinition $def, Indicator $indicator, EtlContext $context): void
    {
        // 1. Obtenir les dades de la font externa
        $response = $this->http->request('GET', $def->url);
        $data = $response->toArray();

        // 2. Iterar i persistir
        foreach ($data as $row) {
            $municipality = $this->geo->getMunicipalityByName($row['municipi']);
            if (!$municipality) {
                continue;
            }

            $this->setMunicipalityValue(
                def:         $def,
                indicator:   $indicator,
                mun:         $municipality,
                year:        (int) $row['any'],
                value:       (float) $row['valor'],
            );
        }
    }
}
```

### 2.2 Camps de `IndicatorDefinition`

| Camp | Tipus | Descripció |
|------|-------|------------|
| `indicatorId` | string | Codi de l'indicador (`"3.4.1"`) |
| `targetId` | string | Codi de la fita (*target*) (`"3.4"`) |
| `targetName` | string | Nom de la fita |
| `sdg` | int | Número de l'ODS (1–17) |
| `indicatorName` | string | Nom intern de l'indicador |
| `indicatorDescription` | string | Descripció interna |
| `sign` | bool | `true` = més alt és millor; `false` = menys és millor |
| `source` | string | Etiqueta de la font (`"INE"`, `"IDESCAT"`, `"DIBA"`, ...) |
| `unit` | string | Unitat interna de referència (el text mostrat al frontend s'edita via etiquetes) |
| `scale` | int\|float | Factor d'escala heretat. **No s'utilitza al backend** (l'escalat el fa el frontend); per defecte `1` |
| `url` | string\|null | URL de l'API de la font |
| `urlProv` | string\|null | URL alternativa per a dades a nivell de província (opcional) |
| `urlComarca` | string\|null | URL alternativa per a dades a nivell de comarca (opcional) |

### 2.3 Registre automàtic

Symfony registra automàticament qualsevol classe que extengui `AbstractEtlImporter` gràcies al sistema de serveis amb etiqueta `app.etl_importer` (configurat a `config/services.yaml`). **No cal afegir res més**: un cop el fitxer existeix, l'`ETLService` el detectarà.

### 2.4 Mètodes d'escriptura disponibles

L'`AbstractEtlImporter` ofereix tres mètodes per persistir valors:

```php
// Valor per a un municipi
$this->setMunicipalityValue($def, $indicator, $municipality, $year, $value, $value2, $subindicator);

// Valor per a una comarca
$this->setComarcaValue($def, $indicator, $comarca, $year, $value, $value2, $subindicator);

// Valor per a la província
$this->setProvinceValue($def, $indicator, $province, $year, $value, $value2, $subindicator);
```

`$value2` i `$subindicator` són opcionals (`null` per defecte). `$value2` s'usa per emmagatzemar el denominador en indicadors de ràtio (p. ex. total de població). `$subindicator` s'usa quan un indicador té diverses sub-categories per any (p. ex. per sexe).

### 2.5 Helpers disponibles dins de l'importador

A més dels mètodes d'escriptura, `AbstractEtlImporter` ofereix uns quants helpers directament:

```php
// Resol un municipi normalitzant codis (gestiona el quirk del zero inicial: "8XXXX" → "0XXXX")
$this->getMunicipalityByCode($rawCode);

// Comprovació explícita d'scope (útil per saltar fetches HTTP cars)
$this->shouldImport(ImportScope::Comarca);
```

::: tip Comarca i província: no cal derivar a mà
Si l'indicador té un càlcul ben definit per a comarca o província, **no l'has d'escriure a mà des de l'importador**: només cal afegir-lo a `AggregationConfig` (vegeu el pas 5) i el càlcul es disparara automàticament a `afterSuccess()` un cop l'`import()` ha acabat.

L'importador només ha d'escriure dades **directament del seu origen**. Per exemple, `IdescatTableImporter` escriu valors de comarca quan IDESCAT ofereix una taula específica per comarca: en aquest cas l'indicador queda *exclòs* de la llista comarcal d'`AggregationConfig` perquè la dada ja és autoritativa.
:::

Els **serveis auxiliars** especialitzats també estan disponibles via atributs protegits. Aquí els exemples més habituals:

```php
// Lookups d'entitats geogràfiques (GeoRegistry)
$this->geo->getMunicipalityByName('Barcelona');
$this->geo->getMunicipalityByCode('08019');
$this->geo->getComarcaByCode('01');
$this->geo->getProvince();
$this->geo->getAllComarques();

// Dades de Transparència Catalunya (DoClient)
$this->do->getYears($urlInfo);
$this->do->getMunicipalityPopulationByYear(2022);         // [codi_mun => habitants]
$this->do->getComarcaPopulationByYear(2022);
$this->do->getProvincePopulationByYear(2022);

// API JSON d'IDESCAT (IdescatJsonClient)
$this->idescatJson->getYears($urlMetadata);
$this->idescatJson->getMunicipalityPopulationByAges($year, 'Y016_064');
$this->idescatJson->getAffiliatesByYear($year, 'total', 'mun');

// Endpoints tabulars d'IDESCAT (IdescatTableClient)
$this->idescatTable->getYears($url);
$this->idescatTable->getValues($url);                     // [codiMun => fila]

// Constants i utilitats pures (EtlUtils)
EtlUtils::toFloat('12,34');                               // 12.34
EtlUtils::BCN_MUNICIPALITY_FILTER;                        // 311 codis (per a &mun=…)
EtlUtils::BCN_COMARCA_FILTER;                             // 13 codis (per a &com=…)
```

Per a la llista completa de mètodes de cada servei, vegeu [ETL: serveis auxiliars](./etl-serveis-auxiliars).

::: warning Filtre per província de Barcelona
Els lookups de `GeoRegistry` retornen `null` per a qualsevol municipi fora de la base de dades carregada. A la instància actual (Diputació de Barcelona), això significa que queden exclosos automàticament els municipis de fora de la província 08. Si adapteu el projecte a un altre territori, cal revisar quins municipis s'han carregat prèviament amb `app:load-initial-data` i actualitzar les constants `BCN_MUNICIPALITY_FILTER` i `BCN_COMARCA_FILTER` a `EtlUtils`.
:::

## 3. Verificar que l'importador és detectat

Comprova que el nou importer apareix a la llista de suportats:

```bash
php bin/console debug:container --tag=app.etl_importer
```

## 4. Classificar l'indicador a `AggregationConfig`

Abans d'executar l'ETL, decidiu **per a quins scopes** (`aggregation`, `comarca`, `province`) i amb **quina estratègia** s'ha d'agregar l'indicador. Editeu `src/Config/AggregationConfig.php` i afegiu el codi a la(es) llista(es) corresponent(s).

Per a l'indicador d'exemple `3.4.1` (`percent`, ràtio numerador/denominador):

```php
public const RATIO_INDICATORS = [
    // ... indicadors existents ...
    '3.4.1',  // afegit
];

// Si també ha de tenir valor a nivell de comarca:
public const COMARCA_RATIO_INDICATORS = [
    // ... ...
    '3.4.1',
];

// I a nivell de província:
public const PROVINCE_RATIO_INDICATORS = [
    // ... ...
    '3.4.1',
];
```

::: warning Cal afegir-lo a cada scope explícitament
Les tres llistes (`*_INDICATORS`, `COMARCA_*`, `PROVINCE_*`) són **independents**. Si només afegiu el codi a `RATIO_INDICATORS`, només es calcularan els valors d'**agrupació** (rural, AMB, etc.); els valors de comarca i província **no s'ompliran** fins que el codi també sigui a les llistes corresponents.

L'excepció són els indicadors per als quals l'importador ja escriu valors de comarca o província **directament des de la font** (p. ex. `IdescatTableImporter`): en aquests casos cal deixar-los **fora** de `COMARCA_*` / `PROVINCE_*` perquè la dada autoritativa no sigui sobreescrita pel càlcul.
:::

Si l'estratègia no és RATIO, useu la llista corresponent: `POPULATION_WEIGHTED_INDICATORS`, `AVERAGE_INDICATORS` o `BEACHES_WEIGHTED_INDICATORS` (vegeu [Agrupacions](./agrupacions) per a les fórmules).

## 5. Executar el ETL

```bash
php bin/console app:run-etl-api 3.4.1
```

L'execució fa **tres passos en una sola comanda**:
1. Crida `import()` de l'importador → escriu `MunicipalityValue` (i `ComarcaValue` / `ProvinceValue` si la font els proveeix directament).
2. Fa `flush()` a la BBDD.
3. Crida `AggregationCalculatorService` per a cada scope on l'indicador estigui classificat (vegeu el pas 4) i actualitza les taules d'agrupació.

Si voleu inspeccionar només els valors municipals abans d'agregar (depuració), passeu `--skip-aggregation`:

```bash
php bin/console app:run-etl-api 3.4.1 --skip-aggregation
```

El sistema fa log de cada execució. Si hi ha errors, apareixeran al log (`var/log/dev.log`) i a la consola.

## 6. Verificar via API

Comprova que les dades s'han importat correctament:

```
GET /api/municipality_values?indicator.indicator_id=3.4.1&year=2022
```

## 7. Afegir textos al frontend

El nom, la descripció i la unitat de mesura que veuen els usuaris **no provenen dels camps `name`/`description`/`unit` de la taula `indicator`**: són etiquetes de llengua i s'emmagatzemen al projecte **`visor2030-frontend`**.

El visor té tres idiomes (català, castellà i anglès), un fitxer JSON per idioma:

```
visor2030-frontend/src/locales/
├── ca.json    (per defecte)
├── es.json
└── en.json
```

Per a cada indicador cal afegir les claus a la jerarquia `SDGS.{ods}.TARGETS.{fita}.INDICATORS.{indicador}.*` en **els tres fitxers**. Per a l'indicador `3.4.1` seria:

```json
{
  "SDGS": {
    "3": {
      "TARGETS": {
        "3.4": {
          "INDICATORS": {
            "3.4.1": {
              "NAME": "Taxa de mortalitat per malalties cardiovasculars",
              "DESCRIPTION": "Morts per malalties cardiovasculars per 100.000 habitants",
              "UNIT": "morts / 100.000 hab."
            }
          }
        }
      }
    }
  }
}
```

Vegeu [Textos i etiquetes (frontend)](../frontend/textos) per a més detalls sobre el sistema d'i18n.
