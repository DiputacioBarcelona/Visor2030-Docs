# ETL: importadors de dades

El pipeline ETL és el sistema que obté dades de fonts externes (APIs públiques, fitxers CSV) i les emmagatzema a la base de dades com a valors d'indicador.

## Visió general

```
app:run-etl-api {indicador}
  └── RunEtlApiCommand
        └── ETLService::run($indicatorId, $context)
              └── AbstractEtlImporter::run()           [la classe que el suporta]
                    ├── import($def, $indicator, $context)
                    │     └── setMunicipalityValue / setComarcaValue / setProvinceValue
                    │           └── ValuePersister → MunicipalityValue / ComarcaValue / ProvinceValue
                    └── afterSuccess() → AggregationCalculatorService (càlcul automàtic)
```

L'`ETLService` és un **dispatcher pur**: rep una col·lecció d'importadors descoberts automàticament i, per a cada execució, busca el primer que suporta el codi d'indicador demanat.

## Arquitectura

Tots els importadors viuen a `src/Service/Etl/Importer/` i **hereten d'una classe abstracta** comuna `AbstractEtlImporter`. Cada importador declara els indicadors que sap gestionar i, gràcies al sistema d'etiquetes de serveis de Symfony (`app.etl_importer`), `ETLService` els recull sense cap registre manual.

```php
// src/Service/ETLService.php — el dispatcher complet
class ETLService
{
    public function __construct(private readonly iterable $importers) {}

    public function run(string $indicatorId, EtlContext $context): bool
    {
        $importer = $this->findImporterFor($indicatorId);
        if ($importer) {
            return $importer->run($indicatorId, $context);
        }
        throw new \Exception("Indicator $indicatorId not found");
    }
}
```

## El contracte: `AbstractEtlImporter`

Qualsevol importador implementa dos mètodes abstractes:

```php
// 1. Quins indicadors gestiona
abstract protected function getDefinitions(): array; // array<string, IndicatorDefinition>

// 2. Com es fa el fetch, parsing i persistència per a un indicador
abstract protected function import(
    IndicatorDefinition $def,
    Indicator $indicator,
    EtlContext $context
): void;
```

El mètode `run()` de la classe base s'encarrega de tot el cicle de vida comú:

- Resol o crea les files `Target` i `Indicator` a la BBDD a partir de la `IndicatorDefinition`.
- Reinicia comptadors (`created`, `updated`, `unchanged`, `skipped`).
- Crida `import()`.
- Fa `flush()` a Doctrine.
- Registra els resultats al log amb temps i comptadors.
- Captura les excepcions i les converteix en retorn `false` + log d'error.

### `IndicatorDefinition` (DTO)

Estructura les metadades d'un indicador. Tots els camps són `readonly`:

| Camp | Tipus | Descripció |
|------|-------|------------|
| `indicatorId` | string | Codi (`"3.4.1"`) |
| `targetId` | string | Codi de la fita *(target)* (`"3.4"`) |
| `targetName` | string | Nom de la fita |
| `sdg` | int | Número d'ODS (1–17) |
| `indicatorName` | string | Nom intern |
| `indicatorDescription` | string | Descripció interna |
| `sign` | bool | `true` = més alt és millor; `false` = menys és millor |
| `source` | string | Etiqueta de font (`"INE"`, `"IDESCAT"`, `"DIBA"`, ...) |
| `unit` | string | Unitat de mesura interna |
| `scale` | int\|float | Heretat (no s'usa al backend; el frontend determina l'escala) |
| `url` | ?string | URL principal |
| `urls` | ?array | URLs múltiples per a importadors amb diverses crides |
| `urlInfo` | ?string | URL del catàleg de metadades (descobriment d'anys) |
| `urlComarca` | ?string | URL alternativa per a dades de comarca |
| `urlProv` | ?string | URL alternativa per a dades de província |
| `urlsInfo` | ?array | URLs d'informació múltiples |
| `extra` | array | Camps específics per a un patró concret |

### `EtlContext` i `ImportScope`

`EtlContext` transporta l'estat de la invocació actual:

| Camp | Descripció |
|------|------------|
| `triggerType` | Com s'ha disparat (`"cli"`, `"api"`...) |
| `scopes` | Quins àmbits cal importar; `null` = tots |
| `csvFilename` / `csvFilename2` | Ruta a fitxers CSV (per a importadors basats en CSV) |

L'enum `ImportScope` defineix els àmbits possibles:

```php
ImportScope::Municipality   // valors per municipi
ImportScope::Comarca        // valors per comarca
ImportScope::Province       // valors per província
ImportScope::Aggregation    // (reservat per a futures fases)
```

Si `scopes` és `null`, s'importen tots els àmbits. Els helpers d'escriptura comproven el scope internament: una crida al mètode no inclòs simplement s'ignora.

### Mètodes d'escriptura

Hereus de `AbstractEtlImporter`, gestionen també el filtre per scope:

```php
$this->setMunicipalityValue($def, $indicator, $municipality, $year, $value, $value2, $subindicator);
$this->setComarcaValue($def, $indicator, $comarca, $year, $value, $value2, $subindicator);
$this->setProvinceValue($def, $indicator, $province, $year, $value, $value2, $subindicator);
```

### Helpers afegits a la classe base

| Mètode | Propòsit |
|--------|----------|
| `getMunicipalityByCode($rawCode)` | Resol un municipi normalitzant codis: `08001` (5d), `080018` (6d) o `80018` (5d sense zero inicial — quirk d'algunes APIs de Transparència Catalunya). Equivalent a `$this->geo->getMunicipalityByCode()`. |
| `shouldImport(ImportScope $scope)` | Test explícit (útil per saltar fetches HTTP cars quan el seu scope està exclòs). |
| `afterSuccess($def, $context)` | Ganxo post-importació. Per defecte crida `AggregationCalculatorService` per a tots els scopes en què l'indicador estigui classificat a `AggregationConfig`. Sobrescriviu-lo si cal una lògica addicional. |

### Comptadors i logs

`AbstractEtlImporter` manté `created`, `updated`, `unchanged`, `skipped`. En acabar amb èxit, el `run()` emet una línia de log:

```
ETL 3.4.1 OK [IdescatImporter] — created=311 updated=0 unchanged=0 skipped=0 in 4.21s
```

## Serveis auxiliars

Els importadors comparteixen un conjunt de **serveis auxiliars** que centralitzen les operacions repetides (resolució de codis geogràfics, escriptura a la BBDD, crides a APIs externes). L'`AbstractEtlImporter` els injecta tots i els exposa via atributs `$this->geo`, `$this->values`, `$this->do`, `$this->idescatJson`, etc.

| Servei | Atribut | Què cobreix |
|--------|---------|-------------|
| `EtlUtils` | (estàtic) | `toFloat()` i les constants `BCN_MUNICIPALITY_FILTER` / `BCN_COMARCA_FILTER` |
| `GeoRegistry` | `$this->geo` | Lookups `Municipality` / `Comarca` / `Province` per codi i nom (amb taula d'àlies i caché) |
| `IndicatorFactory` | `$this->indicatorFactory` | `getOrCreate` de `Target` i `Indicator` des d'una `IndicatorDefinition` |
| `ValuePersister` | `$this->values` | *Upsert* de `MunicipalityValue` / `ComarcaValue` / `ProvinceValue` |
| `IdescatJsonClient` | `$this->idescatJson` | API JSON d'IDESCAT: anys, mesos, població per edats, afiliats |
| `IdescatTableClient` | `$this->idescatTable` | Endpoints SSV (tabulars) d'IDESCAT |
| `DoClient` | `$this->do` | Transparència Catalunya: anys, població per municipi/comarca/província, hectàrees |
| `AggregationCalculatorService` | `$this->aggregations` | Càlcul d'agrupacions (cridat automàticament a `afterSuccess()`) |

Aquesta organització és el resultat del refactor que va eliminar `ETLHelperService` (2.497 línies), redistribuint-lo en aquests serveis especialitzats. Vegeu la pàgina dedicada [ETL: serveis auxiliars](./etl-serveis-auxiliars) per al detall de cada servei (mètodes, ús i quins importadors el fan servir).

## Càlcul automàtic d'agrupacions

A partir del refactor de juny de 2026, **les agrupacions es calculen automàticament al final de cada importació**. L'`AbstractEtlImporter::afterSuccess()` (cridat per `run()` un cop l'`import()` ha fet *flush*) consulta `AggregationConfig` i, per a cada scope (`comarca`, `province`, `aggregation`) en què l'indicador estigui classificat, executa l'estratègia d'agrupació corresponent (vegeu [Agrupacions](./agrupacions)).

Això vol dir que ja **no cal cridar `app:calculate-aggregation-values` manualment després d'un `app:run-etl-api`**: el càlcul es dispara sol amb l'estratègia adequada (`Ratio`, `PopulationWeighted`, `BeachesWeighted` o `Average`).

Per saltar-se el càlcul automàtic durant el desenvolupament (p. ex. per inspeccionar només els valors municipals abans d'agregar), passeu `--skip-aggregation`:

```bash
php bin/console app:run-etl-api 1.4.1 --skip-aggregation
```

## Els 18 importadors actuals

El nom de cada importador codifica la seva estratègia: de quina font obté les dades i quantes consultes combina. Entendre aquesta nomenclatura ajuda a saber on encaixa un indicador nou.

L'abreviatura `Do` significa **Dades Obertes de Catalunya** (plataforma Socrata). Quan es repeteix, indica quantes consultes es fan:

| Patró | Significat | Numerador (`value`) | Denominador (`value2`) |
|-------|-----------|---------------------|------------------------|
| `Do` | 1 consulta a Dades Obertes | camp de la mateixa consulta | camp de la mateixa consulta |
| `Dodo` | 2 consultes a Dades Obertes | 1a consulta | 2a consulta |
| `Dododo` | 3 consultes a Dades Obertes | 2 consultes sumades | 3a (sovint població) |
| `DoIdescat` | DO + IDESCAT | DO | IDESCAT (sovint població) |
| `DoHermes` | DO + DIBA Hermes | DO | Hermes (renda familiar) |
| `Idescat` | API IDESCAT | IDESCAT | IDESCAT |
| `IdescatIdescat` | 2 consultes IDESCAT | 1a consulta | 2a consulta |
| `DibaIdescat` | DIBA + IDESCAT | DIBA | IDESCAT |

La idea general: la **primera font** dóna el numerador i la **segona** el denominador, de manera que es pugui guardar `value` i `value2` separadament i agregar correctament (vegeu [Model de valors](./model-de-dades#el-model-de-valors-value-i-value2)).

### Per famílies

#### Font: INE

| Importador | Indicadors | Com funciona |
|------------|-----------|--------------|
| `IneImporter` | 1.1.1, 1.2.1, 1.2.2, 10.1.1, 10.1.2, 10.1.3, 10.4.1, 10.4.2 | Crida a l'API JSON de l'INE (renda, pobresa, desigualtat). |

#### Font: IDESCAT

| Importador | Indicadors | Patró |
|------------|-----------|-------|
| `IdescatImporter` | 3.4.1, 4.4.1, 4.4.2, 4.4.3, 4.4.4, 4.5.1, 8.2.1, 8.3.3, 9.2.1, 10.1.4 | API JSON d'IDESCAT. Filtra municipis per la província de Barcelona. |
| `IdescatTableImporter` | 1.3.1, 1.4.2, 2.3.2, 2.3.3, 2.3.4, 3.4.2, 5.1.1, 5.c.1, 8.3.1, 8.5.1, 8.5.2, 8.9.1 | Llegeix taules d'IDESCAT (format tabular). |
| `IdescatIdescatImporter` | 5.c.2 | **2 consultes IDESCAT**: afiliades dones (num.) + població femenina (den.) |

#### Font: Dades Obertes de Catalunya (DO)

| Importador | Indicadors | Patró |
|------------|-----------|-------|
| `DoImporter` | 2.1.1, 8.3.2, 8.3.4, 11.3.1, 11.3.2, 11.7.1, 12.5.1, 12.5.2, 15.4.1, 16.7.1, 17.1.1 | **1 consulta DO** |
| `DodoImporter` | 1.2.3, 1.5.1, 3.6.1, 4.a.1, 11.2.1, 11.4.2, 12.1.1, 12.2.1, 17.1.2, 17.17.1, 17.17.2 | **2 consultes DO** (num. + den.) |
| `DododoImporter` | 7.3.1 | **3 consultes DO** (dos consums energètics + població) |

#### Fonts combinades (DO + una altra)

| Importador | Indicadors | Patró |
|------------|-----------|-------|
| `DoIdescatImporter` | 2.3.1, 4.1.1, 4.2.1 | DO (num.) + IDESCAT població (den.) |
| `DoHermesImporter` | 11.1.1 | DO preus lloguer (num.) + Hermes/DIBA renda familiar (den.) |
| `DibaIdescatImporter` | 1.4.1 | DIBA prestacions (num.) + IDESCAT atur total (den.) |

#### Font: DIBA

| Importador | Indicadors | Patró |
|------------|-----------|-------|
| `DibaImporter` | 5.5.1 | API REST de la DIBA (càrrecs electes): compta dones (`value`) i total (`value2`) |

#### Fonts: ArcGIS i agències sectorials

| Importador | Indicadors | Patró |
|------------|-----------|-------|
| `PaesImporter` | 7.2.1 | ArcGIS d'energia (PAES). Energia renovable / total. |
| `AcaImporter` | 6.1.1, 6.4.1 | Descarrega XLSX de l'Agència Catalana de l'Aigua. 6.1.1 = preu (simple); 6.4.1 = consum/població. |
| `EduCsvImporter` | 4.1.2 | Descarrega CSV del Departament d'Educació (graduació ESO). |

#### Font: fitxers CSV locals

| Importador | Indicadors | Patró |
|------------|-----------|-------|
| `CsvImporter` | 9.1.1, 9.5.1, 9.8.1, 13.1.1, 13.2.2, 14.1.1, 14.2.1, 15.1.1, 15.1.2, 15.2.1, 16.6.1, 17.2.1 | CSV genèric pujat a `uploads/`. Columnes `codi_municipi`, `any`, `valor_final`. |
| `Csv711Importer` | 7.1.1 | **Combinat**: ArcGIS consums + CSV preus + IDESCAT renda. |
| `Csv1610Importer` | 16.10.1, 16.7.2 | CSV de transparència/participació; normalitza i fa mitjana. |

::: warning Filtre per província de Barcelona
La majoria d'importadors filtren les dades per codi de municipi `08xxx` (província de Barcelona), o descarten silenciosament els municipis que no estan a la BBDD local. Si adapteu el projecte a un altre territori, cal revisar aquest filtre a cada importador que vulgueu fer servir.
:::

## Afegir un importador nou

Per crear un importador nou només cal una classe que extengui `AbstractEtlImporter`. No cal tocar `ETLService` ni cap fitxer de configuració: l'autodescobriment via `app.etl_importer` ho fa tot.

Vegeu la guia pas a pas a [Com crear un indicador nou](./nou-indicador).
