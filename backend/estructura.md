# Estructura de fitxers

El backend segueix l'estructura estàndard d'un projecte Symfony 6, amb algunes capes addicionals per a la lògica ETL i les agrupacions.

## Arbre de directoris

```
visor2030-backend/
├── bin/
│   └── console              Punt d'entrada de les comandes Symfony
├── config/
│   ├── packages/            Configuració de cada bundle (doctrine, api_platform, security…)
│   ├── routes/              Definicions de rutes (api_platform.yaml, security.yaml…)
│   └── services.yaml        Registre de serveis (autowiring activat)
├── migrations/              Migracions Doctrine (una per cada canvi d'esquema)
├── public/
│   └── index.php            Front controller web
├── src/                     Tot el codi de l'aplicació
├── tests/
│   ├── Unit/
│   ├── Integration/
│   └── Functional/
└── var/
    ├── cache/               Caché de Symfony (s'esborra amb cache:clear)
    └── log/                 Logs de l'aplicació
```

## El directori `src/`

```
src/
├── ApiResource/             Definicions de recursos API Platform desacoblades de les entitats
├── Command/                 Comandes de consola (app:*)
├── Config/                  Classes de configuració de l'aplicació
├── Controller/
│   ├── Back/                (no s'utilitza)
│   ├── Front/               (no s'utilitza)
│   ├── AuthController.php   Endpoint d'autenticació JWT
│   ├── ETLController.php    Disparador ETL via HTTP
│   ├── CsvExportController.php
│   ├── MunicipalityValueController.php
│   ├── LabelHierarchyController.php
│   └── SyntheticSdgController.php
├── Doctrine/                Extensions de consulta Doctrine (filtres globals)
├── Dto/                     Data Transfer Objects
├── Entity/                  Entitats Doctrine ORM (model de dades)
├── Filter/                  Filtres personalitzats per a API Platform
├── OpenApi/                 Personalitzacions de la documentació OpenAPI/Swagger
├── Repository/              Repositoris Doctrine (un per entitat)
├── Security/
│   └── WebserviceVus/       Autenticadors SSO per a la xarxa DIBA (opcional)
├── Service/                 Lògica de negoci
│   ├── Etl/                 Importadors ETL i serveis auxiliars
│   │   ├── Importer/        AbstractEtlImporter + 17 importadors concrets
│   │   ├── Dto/             IndicatorDefinition, EtlContext
│   │   ├── Enum/            ImportScope
│   │   ├── Geo/             GeoRegistry (lookups de municipi/comarca/província)
│   │   ├── Indicator/       IndicatorFactory (crea Target/Indicator)
│   │   ├── Persistence/     ValuePersister (upsert de *Value)
│   │   ├── Source/          IdescatJsonClient, IdescatTableClient, DoClient
│   │   └── Util/            EtlUtils + NameGenderGuesser (helpers purs)
│   ├── Aggregation/         Estratègies de càlcul d'agrupacions
│   ├── ETLService.php       Dispatcher de l'ETL (descobreix els importadors)
│   ├── AggregationCalculatorService.php  Càlcul d'agrupacions
│   ├── CsvExportService.php Exportació CSV
│   ├── LoadMunicipalityDataService.php   Càrrega de dades inicials (municipis, etc.)
│   └── BudgetImporter.php   Importació de pressupostos
└── Util/                    Utilitats (IndicatorCalculator)
```

## On va cada cosa

Quan t'incorpores al projecte o afegiu una funcionalitat nova, aquí tens la guia ràpida:

| Tasca | On treballar |
|-------|-------------|
| Afegir un camp a una taula | `src/Entity/` + generar migració |
| Nova consulta a la BBDD | `src/Repository/` |
| Nova lògica de negoci | `src/Service/` |
| Nou endpoint API Platform | `src/Entity/` (atributs `#[ApiResource]`, `#[ApiFilter]`) |
| Nou endpoint personalitzat | `src/Controller/` |
| Nova comanda CLI | `src/Command/` |
| Nou importador ETL | `src/Service/Etl/` (extendre `AbstractEtlImporter`) |
| Nova estratègia d'agrupació | `src/Service/Aggregation/` (implementar `AggregationStrategyInterface`) |
| Canviar configuració de bundle | `config/packages/{bundle}.yaml` |

## Convencions del projecte

- **Entitats**: PHP 8 attributes per a Doctrine ORM i API Platform. No hi ha fitxers XML ni YAML de mapatge.
- **Serialització**: grups (`#[Groups(['group_name'])]`) controlen quins camps apareixen a les respostes JSON.
- **Filtres API Platform**: declarats directament a l'entitat amb `#[ApiFilter(...)]`. No cal cap controlador addicional.
- **Consultes complexes**: les consultes pesades fan servir SQL nadiu via `$em->getConnection()->executeQuery()` als repositoris.
- **Memòria en comandes**: totes les comandes ETL usen `ini_set('memory_limit', '1024M')` al constructor.
