# Comandes CLI

Totes les comandes personalitzades del projecte tenen el prefix `app:` i s'executen amb `php bin/console`. Cadascuna fixa `ini_set('memory_limit', '1024M')` perquè els processos ETL poden carregar molts registres.

## `app:load-initial-data`

Carrega les dades geogràfiques bàsiques i les agrupacions territorials. Si no s'especifica cap flag, executa **totes** les seccions.

```bash
php bin/console app:load-initial-data [opcions]
```

| Flag | Què importa |
|------|-------------|
| `--municipalities` | Municipis, comarques i províncies |
| `--population` | Sèrie temporal històrica de població |
| `--ubicacio` | Agrupació per ubicació geogràfica |
| `--ruralitat` | Agrupació per ruralitat |
| `--territory` | Regions territorials + AMB/RMB |
| `--industrial` | Agrupació industrial |

::: warning Dades de la província de Barcelona
Per defecte carrega els municipis de la província de Barcelona. Requereix connexió a internet (API d'IDESCAT). Cal executar-la un cop en la instal·lació inicial. Vegeu [Instal·lació](./installacio).
:::

## `app:run-etl-api`

Executa la importació ETL d'un indicador (o de tots). Vegeu [ETL: importadors de dades](./etl).

```bash
# Un indicador concret
php bin/console app:run-etl-api 1.2.1

# Tots els indicadors suportats
php bin/console app:run-etl-api --all
```

| Argument / opció | Descripció |
|------------------|------------|
| `indicator` (arg.) | ID de l'indicador (p. ex. `1.2.1`). Ometre'l amb `--all` |
| `--all` | Executa tots els indicadors suportats |
| `--scope` | Àmbits separats per comes: `municipality,comarca,province,aggregation` (per defecte: tots) |
| `--csv` | Ruta a un fitxer CSV (per a importadors basats en CSV) |
| `--csv2` | Segon CSV (només per a l'importador del 7.1.1) |
| `--skip-aggregation` | No executa el càlcul d'agrupacions després de la importació (per a depuració) |

Exemple amb àmbit limitat:

```bash
php bin/console app:run-etl-api 1.2.2 --scope=municipality,comarca
```

::: tip Càlcul d'agrupacions automàtic
A partir del refactor de juny de 2026, `app:run-etl-api` dispara automàticament el càlcul d'agrupacions a l'`afterSuccess()` per a cada scope on l'indicador estigui classificat a `AggregationConfig`. **Ja no cal cridar `app:calculate-aggregation-values` manualment** després d'un import normal. Vegeu [Agrupacions](./agrupacions).
:::

## `app:calculate-aggregation-values`

Calcula i persisteix els valors agregats per a agrupacions, comarques i/o províncies. Vegeu [Agrupacions](./agrupacions).

::: tip
A partir del refactor de juny de 2026 aquesta comanda és **opcional en el flux habitual**: `app:run-etl-api` ja la dispara automàticament. Manté la utilitat per a recàlculs massius (p. ex. quan s'afegeixen indicadors a `AggregationConfig`) sense haver de re-executar l'ETL.
:::

```bash
php bin/console app:calculate-aggregation-values [indicador] [opcions]
```

| Argument / opció | Descripció |
|------------------|------------|
| `indicator` (arg.) | ID concret a processar; ometre'l per processar tots els elegibles |
| `--target` | `aggregation` \| `comarca` \| `province` \| `all` (per defecte `all`) |
| `--group` | Slug d'agrupació o `comarca_code` concret |
| `--strategy` | `ratio` \| `population-weighted` |

## `app:import-population`

Importa la sèrie temporal de població des de l'API de Transparència Catalunya cap a la taula `population`. S'executa periòdicament quan apareixen dades noves (anualment).

```bash
php bin/console app:import-population
```

## `app:import-budgets`

Importa les dades de pressupostos municipals (`tb_inventario` i `tb_funcional`) per a un any concret. Les descarrega del repositori GitHub `PopulateTools/gobierto-budgets-data`. Vegeu [Pressupost](./pressupost).

```bash
php bin/console app:import-budgets 2024
```

| Argument | Descripció |
|----------|------------|
| `year` (obligatori) | Any per al qual importar les dades de pressupost |

## `app:export-csv`

Genera fitxers CSV amb les dades dels indicadors, filtrats per ODS. Si no s'indica cap ODS, genera els 17. Els fitxers es desen a `var/sdg{N}.csv`.

```bash
# Tots els ODS (1-17)
php bin/console app:export-csv

# Només un ODS
php bin/console app:export-csv 3
```

| Argument | Descripció |
|----------|------------|
| `sdg` (opcional) | ODS a exportar (1–17). Ometre'l genera tots |

## Comandes estàndard de Symfony / Doctrine

Les comandes habituals del framework també estan disponibles.

### Migracions i esquema

::: danger Cap canvi directe a la BBDD
Tots els canvis d'esquema s'han de fer **via una migració**. Vegeu [Model de dades → Evolució de l'esquema](./model-de-dades#evolucio-de-l-esquema-migracions).
:::

```bash
php bin/console doctrine:migrations:migrate         # aplica les migracions pendents
php bin/console doctrine:migrations:status          # estat (aplicades vs. pendents)
php bin/console make:migration                       # genera una migració a partir de canvis a les entitats
php bin/console doctrine:migrations:diff             # equivalent a make:migration (sintaxi clàssica)
php bin/console doctrine:schema:validate             # comprova que entitats i BBDD coincideixen
```

### Generadors (`make:`)

```bash
php bin/console make:entity                          # crea/modifica una entitat
php bin/console make:controller                      # crea un controlador
php bin/console make:command                         # crea una comanda CLI
php bin/console make:repository                      # crea un repositori per a una entitat existent
```

Vegeu la documentació del [Maker Bundle](https://symfony.com/bundles/SymfonyMakerBundle/current/index.html).

### Operacions generals

```bash
php bin/console cache:clear                          # neteja la caché
php bin/console debug:container --tag=app.etl_importer   # llista els importadors ETL detectats
php bin/console debug:router                         # llista totes les rutes
php bin/console lexik:jwt:generate-keypair           # genera les claus JWT
```

### Documentació oficial

- [Symfony — Doctrine ORM](https://symfony.com/doc/current/doctrine.html)
- [Doctrine Migrations Bundle](https://symfony.com/bundles/DoctrineMigrationsBundle/current/index.html)
- [API Platform](https://api-platform.com/docs/)
