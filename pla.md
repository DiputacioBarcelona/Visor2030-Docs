# Pla de documentació — Visor 2030

> **Estat**: en desenvolupament  
> **Idioma**: tot en català  
> **Eina**: VitePress 1.x

Aquest document detalla totes les seccions que cal escriure, el seu contingut esperat i les fonts d'on extreure la informació. Les seccions es desenvoluparan una a una.

---

## Estructura del lloc de documentació

```
visor2030-documentacio/
├── index.md                        ✅ Pàgina d'inici (hero + features)
├── CLAUDE.md                       ✅ Context per a Claude Code
├── pla.md                          ✅ Aquest document
├── .vitepress/
│   └── config.mts                  ✅ Configuració VitePress (nav + sidebar)
├── backend/
│   ├── index.md                    ✅ Introducció al backend
│   ├── estructura.md               ✅ Estructura de fitxers
│   ├── installacio.md              ✅ Instal·lació i configuració
│   ├── model-de-dades.md           ✅ Esquema de la BBDD
│   ├── calcul-indicadors.md        ✅ Càlcul i format dels valors
│   ├── nou-indicador.md            ✅ Com crear un indicador nou ★
│   ├── etl.md                      ✅ ETL: importadors de dades
│   ├── agrupacions.md              ✅ Agrupacions (Aggregations)
│   ├── pressupost.md               ⬜ Pressupost (Budget) — d'on surt i com s'importa
│   ├── ods-sinteticos.md           ✅ ODS sintètics
│   ├── cli.md                      ✅ Comandes CLI
│   └── api.md                      ✅ API i endpoints
└── frontend/
    ├── index.md                    ✅ Introducció al frontend
    ├── estructura.md               ✅ Estructura de fitxers
    ├── installacio.md              ✅ Instal·lació i configuració
    ├── rutes.md                    ✅ Rutes i pàgines
    ├── carrega-de-dades.md         ✅ Càrrega de dades (data.js + useLoadData)
    ├── filtres-estat-global.md     ✅ Filtres i estat global
    ├── textos.md                   ✅ Textos i etiquetes (OTText)
    ├── components-grafics.md       ✅ Components gràfics
    ├── mapa.md                     ✅ El mapa de Barcelona
    ├── pressupost.md               ⬜ Pressupost al frontend (programes + ODS)
    ├── plans-estrategics.md        ⬜ Plans estratègics (CSV local)
    ├── valoracio-ciutadana.md      ⬜ Valoració ciutadana (Dibaròmetre)
    └── components-ui.md            ✅ Components UI bàsics
```

## Seccions afegides en aquesta iteració

### `backend/pressupost.md`

Explicar com s'importen les dades de pressupostos municipals:

- **Font**: repositori GitHub `PopulateTools/gobierto-budgets-data` (dades obertes). El servei `SqlImporter` descarrega per HTTPS els fitxers `tb_inventario.sql.gz` i `tb_funcional.sql.gz` del directori `data/presupuestos_municipales/{year}/planned/`.
- **Procés**: descomprimeix amb gzip → parseja els `INSERT` → filtra municipis de la província de Barcelona (`codbdgel` que comença per "08") → agrupa imports per `(municipi, programa)` → desa a `budget`.
- **Detalls de les dues taules**:
  - `tb_inventario`: relació municipi-àrea-funció. S'utilitza per filtrar files vàlides (`code_area = 'AA'`).
  - `tb_funcional`: import per partida funcional. Camps clau: `id`, `idente`, `cdfgr` (codi de programa), `importe`.
- **Comanda**: `app:import-sql {year}` (vegeu [CLI](./cli)).
- **Entitat `Budget`**: ja documentada a `model-de-dades.md`.

### `frontend/pressupost.md`

Documentar les dues vistes de pressupost del frontend i el mapatge programa → ODS:

- **Pàgines**: `pages/municipi/programs.vue` (vista general per programa al resum del municipi) i `pages/municipi/sdg/budget.vue` (vista dins d'un ODS).
- **Origen de dades**: endpoint `/api/budgets` (`useBudgetData` + `useLoadData("getBudgets")`).
- **Mapatge programa → ODS**: fitxer local `public/data/pesos.csv`. Cada programa pressupostari pot tenir fins a 5 fites ODS associades amb un pes (sumatori = 1).
- **Format de `pesos.csv`**: columnes `Grup`, `Nom`, `ODS_1..ODS_2_4`, `Pes_ODS_1..Pes_ODS_2_4`.
- **Càlcul al client**: per a cada ODS, es filtren els pesos i s'aplica `budget_value × (pes / 100)` per agregar pressupost per fita.
- **UI**: TreeMap + taula a `programs.vue`; BarChart + LineChart a `budget.vue`.

### `frontend/plans-estrategics.md`

Documentar el sistema de plans estratègics, totalment basat en CSV locals:

- **Pàgina**: `pages/municipi/sdg/plans.vue`.
- **Fitxers a `public/data/`**:
  - `llistat_plans.csv` (mestre, 61 columnes)
  - `plans_municipals.csv`, `plans_intermunicipals.csv`, `plans_comarcals.csv` (per àmbit, delimitats per `;`)
- **Columnes clau**: `NOM`, `Nom complet`, `Any central`, `Període`, `Tipologia`, `ESCALA` (M/I/C), `Municipi`, `Municipis Escala I`, `Comarca`, **39 columnes de tema** (`ODS1 - Economia social i solidària`, ...), `Total`, **17 columnes de resum** (`ODS1` a `ODS17`).
- **Càrrega**: `localApiPlans` (delimitador `;`, vegeu [Càrrega de dades](./carrega-de-dades)). El mètode `getMunicipalityPlans()` retorna els tres fitxers combinats.
- **Filtratge** (`usePlansData`): un pla s'inclou si la seva ESCALA i camps de Municipi/Comarca coincideixen amb el municipi actiu. Els plans comarcals es pondren per 0.5.
- **Convencions**: valors en percentatge separats per coma (`"2,02 %"`); ESCALA: M=municipal, I=intermunicipal, C=comarcal, B=barri.
- **UI**: agregat consolidat + un desplegable per pla amb el detall per tema.

### `frontend/valoracio-ciutadana.md`

Documentar la integració amb la plataforma externa Dibaròmetre:

- **Pàgina**: `pages/municipi/sdg/valoration.vue`.
- **Font**: projecte Dibaròmetre — diversos CSV exposats com a fulls de càlcul públics de Google Sheets (`docs.google.com/.../pub?output=csv`). La URL principal de respostes és dinàmica (`window.dibarometre_url`).
- **Endpoints (`services/dataDibarometre.js`)**: dades de respostes, definició de l'enquesta (preguntes), diccionari d'opcions de resposta, metadades de municipis (tram, comarca), dates per municipi.
- **Estructura de respostes**: array d'objectes amb `id` codificat (`{qid}_{aid}_{munId}_{version}`), nombres de respostes totals i segmentats per gènere i tram d'edat.
- **Mapatge ODS → pregunta**: fitxer `public/data/sdg_dibarometre.csv` (columnes `ODS`, `ODS descripció`, `Dibaròmetre`, `question_text`, `question_id`, `answer_id` opcional).
- **Càrrega global**: `useLoadDibarometre()` es crida una sola vegada a `App.vue` i les dades es proveeixen amb `provide('dibarometreData')` (l'API és lenta, per això es precarrega).
- **UI**: selector d'any (limitat als anys amb dades del municipi), un *disclosure* per pregunta amb el gràfic adequat (`BarChartHeatMapCard`, `StackedBarChartCard`, `BarChartCard`), comparativa amb comarca/tram/província/any anterior i desglossament per gènere/edat.
- **Particularitats**: Barcelona (codi 08019) està exclosa; el tram d'un municipi pot canviar entre versions de l'enquesta i això inhabilita la comparativa amb l'any anterior.

Llegenda: ✅ fet · ⬜ pendent

---

## Canvis als README.md dels repositoris

### `visor2030-backend/README.md`

**Eliminar:**
- Instruccions de desplegament a Heroku
- URL i credencials d'entorns específics de la Diputació de Barcelona (dev.visor2030.diba.cat, etc.)
- La secció "DIBA StarterKit Manual" amb scripts de build FTP
- Instruccions d'autenticació VUS específiques de DIBA
- Qualsevol menció d'OneTandem

**Mantenir / reescriure:**
- Descripció general del projecte (neutral)
- Requisits (PHP 8.2+, Composer, Symfony CLI, MySQL 8)
- Instal·lació bàsica (clone → composer install → configurar .env → migrate → seed)
- Comandes principals
- Apuntar a la documentació completa per a la resta

**Format final:**
```markdown
# Visor 2030 — Backend

API REST per a la visualització d'indicadors ODS de municipis catalans.

## Tecnologia
Symfony 6.4 · API Platform 4 · MySQL 8 · PHP 8.2+

## Instal·lació ràpida
[4-5 passos bàsics]

## Documentació completa
https://[url-documentacio]

## Llicència
MIT
```

### `visor2030-frontend/README.md`

**Eliminar:**
- Instruccions de "Template Usage" (crear repo des de template d'OneTandem)
- Instruccions de Netlify deployment específiques
- "GitHub + Slack integration" d'OneTandem
- Instruccions d'embedding específiques ("For OneTandem:", "For Clients:")
- Qualsevol menció d'OneTandem

**Mantenir / reescriure:**
- Descripció general
- Requisits (Node 20+)
- Instal·lació bàsica (clone → npm install → configurar .env → npm run dev)
- Scripts disponibles
- Apuntar a la documentació completa

---

## SECCIÓ: Backend

### `backend/index.md` — Introducció al backend

**Contingut:**
- Descripció general: API REST que exposa dades d'indicadors ODS per a municipis catalans
- Stack tecnològic: Symfony 6.4, API Platform 4, Doctrine ORM, MySQL 8
- Cas d'ús actual: Diputació de Barcelona (311 municipis, província de Barcelona)
- Com s'organitza la documentació d'aquesta secció
- Diagrama de flux bàsic: petició HTTP → API Platform → Doctrine → MySQL

**Font:** CLAUDE.md del backend, README.md actual

---

### `backend/estructura.md` — Estructura de fitxers

**Contingut:**
- Arbre de directoris comentat (nivell `src/`)
- Taula per capa: on va cada cosa

```
src/
├── Entity/          Entitats Doctrine (model de dades)
├── Repository/      Consultes a la BBDD
├── Service/         Lògica de negoci; ETL source adapters
│   └── Etl/         Nou sistema ETL (AbstractEtlImporter + importadors)
│   └── Aggregation/ Estratègies de càlcul d'agrupacions
├── Controller/      Endpoints personalitzats
│   ├── Back/        Backoffice (admin)
│   └── Front/       Vistes Twig (login, home)
├── Command/         Comandes de consola (app:*)
├── Dto/             Data Transfer Objects
├── Filter/          Filtres personalitzats per a API Platform
├── ApiResource/     Definicions de recursos API Platform
├── Security/        Autenticació JWT + SSO VUS
└── Util/            Utilitats generals
```

- Descripció breu de cada carpeta
- On s'afegeix codi nou depenent de la tasca

**Font:** exploració del repositori backend

---

### `backend/installacio.md` — Instal·lació i configuració

**Contingut:**
1. Requisits (PHP 8.2+, Composer 2, Symfony CLI, MySQL 8)
2. Clonar el repositori
3. `composer install`
4. Configurar `.env.local` (DATABASE_URL, JWT_PASSPHRASE, CORS_ALLOW_ORIGIN)
5. Generar claus JWT (`php bin/console lexik:jwt:generate-keypair`)
6. `php bin/console doctrine:database:create`
7. `php bin/console doctrine:migrations:migrate`
8. Carregar dades inicials (`php bin/console app:load-initial-data`)
9. Iniciar servidor (`symfony server:start`)

**Nota important:** Mencionar que `app:load-initial-data` carrega les dades de municipis, comarques, etc. des de l'API d'IDESCAT i que requereix connexió a internet.

**Configuració per entorns de test:**
- `.env.test.local` amb base de dades `_test` suffix
- `php bin/phpunit` per executar els tests

**Font:** README.md backend, CLAUDE.md backend

---

### `backend/model-de-dades.md` — Model de dades (esquema BBDD)

**Contingut:**
Explicar cada taula (entitat Doctrine) amb: nom, descripció, camps principals, relacions.

#### Taules principals

| Entitat | Taula | Descripció |
|---------|-------|------------|
| `Indicator` | `indicator` | Definicions dels indicadors ODS. Camps: `code` (p. ex. "1.2.1"), `name`, `source`, `unit`, `formula`, `etl_service`, `etl_params` |
| `Target` | `target` | Fites ODS *(targets)* (p. ex. "1.2"). Camps: `code`, `name`. Relació: té molts `Indicator` |
| `Label` | `label` | Jerarquia d'etiquetes per organitzar indicadors. Relació arbre amb `parent` |
| `Municipality` | `municipality` | Municipis (311 de la província de Barcelona). Camps: `ine_code`, `municipality_name`, `comarca_id`, `province_id` |
| `MunicipalityValue` | `municipality_value` | Valors d'indicador per municipi i any. Camps: `municipality_id`, `indicator_id`, `year`, `value`, `subindicator` |
| `Comarca` | `comarca` | Comarques de Catalunya. Camps: `code`, `comarca_name` |
| `ComarcaValue` | `comarca_value` | Valors agregats per comarca. Mateixa estructura que `MunicipalityValue` |
| `Province` | `province` | Províncies. Camps: `code`, `province_name` |
| `ProvinceValue` | `province_value` | Valors agregats per província |
| `Aggregation` | `aggregation` | Agrupacions personalitzades (ruralitat, ubicació, AMB, etc.). Camps: `slug`, `name`, `group_type` |
| `AggregationValue` | `aggregation_value` | Valors pre-calculats per agrupació. Camps: `aggregation_id`, `indicator_id`, `year`, `value` |
| `Population` | `population` | Sèrie temporal de població per municipi. Camps: `municipality_id`, `year`, `value` |
| `Budget` | `budget` | Pressupostos per indicador i any. Camps: `municipality_id`, `indicator_id`, `year`, `amount` |
| `User` | `user` | Usuaris de l'aplicació (backoffice + API). Camps: `email`, `roles`, `password` |

**Diagrama de relacions clau:**
```
Target (1) → (N) Indicator
Municipality (N) ↔ (M) Aggregation
Municipality (1) → (N) MunicipalityValue
Indicator (1) → (N) MunicipalityValue
```

**Com generar el diagrama complet:**
```bash
php bin/console doctrine:generate:diagram
```
(requereix `jawira/doctrine-diagram-bundle`)

**Font:** `src/Entity/`, migracions Doctrine

---

### `backend/nou-indicador.md` — Com crear un indicador nou ★

**Contingut:**

Aquesta és la secció més important de la documentació del backend. Cal cobrir el procés complet pas a pas.

#### Pas 1: Entendre l'estructura d'un indicador

Explicar la nomenclatura `{ods}.{target}.{indicator}` (p. ex. `3.4.1`), la diferència entre ODS, fita (*target*) i indicador. Explicar els camps de l'entitat `Indicator`:

- `code`: codi únic (p. ex. "3.4.1")
- `name`: nom descriptiu
- `unit`: unitat de mesura (%, habitants, €, ...)
- `source`: font de dades (IDESCAT, INE, DIBA, CSV...)
- `etl_service`: quin servei ETL processa aquest indicador
- `etl_params`: paràmetres que rep el servei ETL (codi variable, URL, ...)
- `formula`: fórmula de càlcul si cal combinar dades
- `aggregation_strategy`: estratègia per calcular valors d'agrupació (`ratio`, `population_weighted`, `average`)

#### Pas 2: Crear la configuració a la base de dades

Explicar que els indicadors es defineixen com a registres de la taula `indicator`. Mostrar un INSERT d'exemple. Explicar que també cal vincular-los a un `Target` i afegir etiquetes (`Label`).

#### Pas 3: Triar o crear un ETL importer

Explicar que l'`ETLService` és el dispatcher central. En funció del valor `etl_service` de l'indicador, crida un servei diferent.

**Opcions disponibles:**
- `IneImporter` (recomanat per a dades del INE) — extén `AbstractEtlImporter`
- `IDESCATService` — per a dades d'IDESCAT
- `DIBAService` — per a dades del portal de dades de DIBA
- Serveis CSV (`CSVFileService`, etc.) — per a fitxers CSV manuals

**Crear un importer nou (arquitectura nova):**

```php
// src/Service/Etl/MyNewImporter.php
class MyNewImporter extends AbstractEtlImporter
{
    public function import(EtlContext $context): void
    {
        // 1. Obtenir dades de la font externa
        // 2. Iterar per municipis
        // 3. Persistir MunicipalityValue
    }
}
```

Mostrar l'estructura de `EtlContext` (indicador, any, scope) i `AbstractEtlImporter` (mètodes helper per persistir valors).

**⚠️ Nota sobre el filtre de Barcelona:**
Molts importadors filtren dades per `codi_provincia = '08'` (Barcelona). Si s'adapta el projecte per a un altre territori, cal actualitzar aquest filtre als importadors rellevants.

#### Pas 4: Executar el ETL

```bash
php bin/console app:run-etl-api {codi_indicador}
# Exemple:
php bin/console app:run-etl-api 3.4.1
```

#### Pas 5: Calcular valors d'agrupació

Després d'importar valors municipals, cal calcular els valors agregats per comarques, agrupacions, etc.:

```bash
php bin/console app:calculate-aggregation-values 3.4.1
```

#### Pas 6: Verificar les dades

Explicar com fer una petició a l'API per comprovar que les dades s'han importat correctament:

```
GET /api/municipality_values?indicator.code=3.4.1&year=2023
```

#### Pas 7: Afegir textos al frontend

Explicar que el frontend carrega noms i descripcions d'indicadors des de l'endpoint `/api/labels-import`. Es poden editar des del mode `?mode=edit` del frontend.

**Font:** `src/Service/ETLService.php`, `src/Service/Etl/AbstractEtlImporter.php`, `src/Service/Etl/IneImporter.php`, `src/Command/RunEtlApiCommand.php`

---

### `backend/etl.md` — ETL: importadors de dades

**Contingut:**

#### Arquitectura general

Diagrama del flux ETL:
```
app:run-etl-api {codi}
  → RunEtlApiCommand
    → ETLService::run($indicator)
      → ETLHelperService (determina quin importer cridar)
        → [IneImporter | IDESCATService | DIBAService | CSVFileService | ...]
          → Persisteix MunicipalityValue / ComarcaValue / ProvinceValue
```

#### Arquitectura nova (src/Service/Etl/)

Explicar `AbstractEtlImporter`:
- Mètode abstracte `import(EtlContext $context)`
- Mètodes helper heretats: `persistValue()`, `findMunicipality()`, etc.
- `EtlContext`: conté l'indicador, l'any d'importació i l'`ImportScope` (MUNICIPALITY, COMARCA, PROVINCE, AGGREGATION)

Exemple d'`IneImporter`: com fa servir l'API de l'INE, com mapeja codis INE a municipis del visor.

#### Serveis ETL llegats (src/Service/)

Llista comentada dels serveis existents:
- `IDESCATService` — dades de l'IDESCAT (Institut d'Estadística de Catalunya)
- `DIBAService` — dades del portal OpenData de la Diputació de Barcelona
- `ACAService` — Agència Catalana de l'Aigua
- `PAESService` — Plans d'Acció per a l'Energia Sostenible
- `EDUCSVService` — dades d'educació des de CSV
- `CSVFileService` i variants específiques — importadors de CSV manuals per indicadors concrets
- `ARCGISService` — dades de serveis ArcGIS
- Serveis compostos (`DIBAIDESCATService`, etc.) — combinen dues fonts

#### ⚠️ Filtre per província de Barcelona

Explicar que molts d'aquests serveis inclouen un filtre per codi de municipi `08xxx` (província de Barcelona). Per adaptar a un altre territori cal revisar i modificar aquest filtre en cada servei que s'utilitzi.

#### Afegir un importer nou

Guia ràpida amb l'herència de `AbstractEtlImporter` i el registre a l'`ETLService`.

**Font:** `src/Service/ETLService.php`, `src/Service/Etl/`, tots els `*Service.php`

---

### `backend/agrupacions.md` — Agrupacions (Aggregations)

**Contingut:**

#### Què són les agrupacions

El visor permet visualitzar indicadors no només per municipis individuals, sinó per **agrupacions** de municipis: per ruralitat, per ubicació geogràfica, per pertinença a la RMB/AMB, etc. Les agrupacions permeten comparar un municipi amb la mitjana del seu grup.

#### Tipus d'agrupació existents

L'entitat `Aggregation` unifica:
- **Ruralitat** (`ruralitat`): rural, periurbà, urbà, metropolità
- **Ubicació** (`ubicacio`): litoral, prelitoral, interior, etc.
- **Regions territorials** (`territorial_region`): RMB, AMB, etc.
- **Industrial** (`is_industrial`): municipis industrials
- **AMB** (`is_in_amb`): Àrea Metropolitana de Barcelona
- **RMB** (`is_in_rmb`): Regió Metropolitana de Barcelona

Cada `Aggregation` té una relació molts-a-molts amb `Municipality`.

#### Com es calculen els valors d'agrupació

La comanda `app:calculate-aggregation-values` fa servir el patró Strategy per calcular valors agregats. Cada indicador pot tenir una estratègia diferent:

| Estratègia | Classe | Quan usar-la |
|------------|--------|--------------|
| `ratio` | `RatioAggregationStrategy` | Indicadors de taxa: `(suma_num / suma_den) × escala` |
| `population_weighted` | `PopulationWeightedStrategy` | Indicadors per càpita o percentuals |
| `average` | `AverageStrategy` | Quan el valor és ja una mitjana |
| `beaches` | `NumberOfBeachesWeightedStrategy` | Especial per a indicadors de platges |

L'estratègia es defineix a la configuració de l'indicador.

#### Comanda

```bash
# Tots els indicadors
php bin/console app:calculate-aggregation-values

# Indicador específic
php bin/console app:calculate-aggregation-values 1.2.1

# Només per un target (comarca, agrupació, etc.)
php bin/console app:calculate-aggregation-values --target=aggregation

# Només per un grup concret
php bin/console app:calculate-aggregation-values --group=rural
```

**Font:** `src/Service/Aggregation/`, `src/Command/CalculateAggregationValuesCommand.php`, `src/Entity/Aggregation.php`

---

### `backend/ods-sinteticos.md` — ODS sintètics

**Contingut:**

#### Concepte

Cada ODS (1–17) té associats una sèrie d'indicadors. L'**ODS sintètic** d'un municipi és un valor únic que resumeix el compliment d'aquell ODS, calculat com una **mitjana ponderada** dels indicadors disponibles.

#### Com es calcula

Explicar el flux:
1. El frontend crida `GET /api/synthetic-sdg?municipality_id=X&year=Y`
2. `SyntheticSdgController` → `SyntheticSdgService` calcula la puntuació
3. Es carreguen els pesos dels indicadors des del fitxer `public/data/pesos.csv` del frontend
4. Per a cada indicador amb valor, es normalitza el valor (0–100) i s'aplica el pes
5. El resultat és un valor de 0–100 per a cada ODS

#### Endpoint

```
GET /api/synthetic-sdg
  ?municipality_id={id}
  &year={any}
  &scope={municipality|comarca|aggregation}
```

Retorna un objecte `{ ods_1: 72.4, ods_2: 45.1, ... }`.

**Font:** `src/Controller/SyntheticSdgController.php`, `src/Service/` (servei relacionat)

---

### `backend/cli.md` — Comandes CLI

**Contingut:**

Documentació exhaustiva de totes les comandes `app:*`:

#### `app:load-initial-data`

```bash
php bin/console app:load-initial-data [opcions]
```

Carrega les dades geogràfiques bàsiques (municipis, comarques, províncies) i les agrupacions territorials. Flags disponibles:

| Flag | Descripció |
|------|------------|
| `--municipalities` | Municipis, comarques i províncies |
| `--population` | Sèrie temporal de població |
| `--ubicacio` | Agrupació per ubicació geogràfica |
| `--ruralitat` | Agrupació per ruralitat |
| `--territory` | Regions territorials + AMB/RMB |
| `--industrial` | Agrupació industrial |

**Nota:** Requereix connexió a internet (IDESCAT, INE). Cal executar-lo una vegada en la instal·lació inicial.

#### `app:run-etl-api`

```bash
php bin/console app:run-etl-api [codi_indicador]
```

Executa la importació ETL. Si no s'especifica indicador, importa tots. Usa `ini_set('memory_limit', '1024M')` — seguir aquesta convenció en noves comandes.

#### `app:import-population`

```bash
php bin/console app:import-population
```

Importa la sèrie temporal de població des de l'API Transparència Catalunya. S'executa periòdicament quan surten dades noves (anualment).

#### `app:import-sql`

```bash
php bin/console app:import-sql [any]
```

Importa dades de pressupostos per al year especificat. Raquireeix fitxers SQL al directori esperat.

#### `app:calculate-aggregation-values`

```bash
php bin/console app:calculate-aggregation-values [codi] [opcions]
```

Veure secció [Agrupacions](./agrupacions.md) per a la documentació completa.

#### `app:export-csv`

```bash
php bin/console app:export-csv
```

Exporta totes les dades d'indicadors en format CSV al directori `var/`.

**Font:** `src/Command/`

---

### `backend/api.md` — API i endpoints

**Contingut:**

#### Documentació interactiva automàtica

API Platform genera automàticament una interfície Swagger/OpenAPI accessible a:

```
https://{domini}/api
```

Tots els endpoints de les entitats marcades amb `#[ApiResource]` queden documentats allà: llistats, filtres disponibles, formats de resposta.

#### Endpoints principals

Llistar els recursos disponibles amb el seu path i descripció:

| Recurs | Path | Descripció |
|--------|------|------------|
| Municipis | `GET /api/municipalities` | Llista de tots els municipis |
| Valors municipis | `GET /api/municipality_values` | Valors d'indicador per municipi |
| Comarques | `GET /api/comarcas` | Llista de comarques |
| Valors comarques | `GET /api/comarca_values` | Valors per comarca |
| Agrupacions | `GET /api/aggregations` | Agrupacions disponibles |
| Valors agrupacions | `GET /api/aggregation_values` | Valors per agrupació |
| Indicadors | `GET /api/indicators` | Definicions d'indicadors |
| Fites | `GET /api/targets` | Fites ODS *(targets)* (amb indicadors imbricats) |
| Pressupostos | `GET /api/budgets` | Dades de pressupost |
| Etiquetes | `GET /api/labels-import` | Textos i etiquetes de la UI |
| ODS sintètics | `GET /api/synthetic-sdg` | Puntuació sintètica per ODS |

#### Filtres

API Platform exposa automàticament els filtres declarats amb `#[ApiFilter]` a les entitats. Exemples habituals:

```
GET /api/municipality_values?indicator.code=1.2.1&year=2023
GET /api/municipality_values?municipality.ine_code=080193
GET /api/municipalities?order[municipality_name]=asc
```

#### Autenticació

Els endpoints de lectura no requereixen autenticació. Els endpoints d'escriptura (p. ex. `POST /api/labels-import`) requereixen token JWT:

```
Authorization: Bearer {token}
```

Obtenir token: `POST /api/login_check` amb `{ username, password }`.

---

## SECCIÓ: Frontend

### `frontend/index.md` — Introducció al frontend

**Contingut:**
- Descripció: SPA Vue 3 per visualitzar indicadors ODS per a municipis catalans
- Stack: Vue 3, Vite 5, Vue Router 4, Tailwind CSS 3, D3.js 7
- Funcionalitats principals: mapa interactiu, gràfics (linechart, beeswarm, rose), comparativa entre entitats, exportació CSV/SVG

---

### `frontend/estructura.md` — Estructura de fitxers

**Contingut:**
Arbre de directoris comentat:

```
src/
├── App.vue              Arrel de l'app; proveeix (provide) dades globals
├── main.js              Punt d'entrada; inicialitza i18n, router, plugins
├── config.js            URL base de l'API
├── routes.js            Definicions de rutes manuals (usat per Vue Router)
├── components/          Components reutilitzables (50+)
│   ├── OT*.vue          Components de disseny propi (OTText, OTSelect, ...)
│   ├── *Chart.vue       Components de visualització (LineChart, BeeswarmChart, ...)
│   ├── BarcelonaMap.vue  Mapa interactiu SVG
│   └── ...
├── pages/               Pàgines (file-based routing via unplugin-vue-router)
│   ├── index.vue        Pàgina d'inici
│   ├── municipi.vue     Layout de municipi (injecta `entity`)
│   ├── municipi/        Subpàgines de municipi
│   ├── comarca.vue      Layout de comarca
│   ├── comarca/         Subpàgines de comarca
│   ├── agregacio.vue    Layout d'agrupació
│   └── agregacio/       Subpàgines d'agrupació
├── functions/           Composables (useLoadData, useFilters, ...)
├── services/            Capa de dades (data.js, apiFactory.js, apis.js)
├── utils/               Utilitats pures (helpers, colors, constants)
├── locales/             Fitxers JSON d'i18n (ca.json, es.json, en.json)
└── assets/              Dades estàtiques (municipalities.json, comarcas.json, sdgs.json)
```

---

### `frontend/installacio.md` — Instal·lació

**Contingut:**
1. Requisits: Node 20+, npm 10+
2. `git clone` + `npm install`
3. Configurar `.env` (VITE_API_URL apuntant al backend)
4. `npm run dev`
5. Scripts disponibles: `dev`, `build`, `build-prod`, `preview`

---

### `frontend/rutes.md` — Rutes i pàgines

**Contingut:**
Explicar l'arbre de rutes complet, agrupat per context:

#### Sistema de routing

El frontend usa `unplugin-vue-router` per generar automàticament rutes a partir de l'estructura de fitxers de `src/pages/`. A més, les rutes es poden definir manualment a `src/routes.js`.

Cada ruta té un prefix `/:locale?` opcional per suportar URLs amb idioma explícit (`/ca/municipis/...`).

#### Arbre de rutes

```
/                        → pages/index.vue       Pàgina d'inici
/analisi                 → pages/analisi.vue     Anàlisi comparativa
/metodologia             → pages/metodologia.vue Metodologia
/sobre-el-visor          → pages/about.vue       Sobre el visor
/ods/:sdg                → pages/ods.vue         Fitxa d'un ODS

/municipis/:id           → pages/municipi.vue    [layout de municipi]
  /municipis/:id/          → municipi/index.vue  Resum del municipi
  /municipis/:id/:sdg      → municipi/sdg/...    ODS del municipi
    /:targetId/:indicatorId → indicadors/...     Indicador concret
    /pressupost/:targetId   → pressupost.vue     Pressupost
    /plans-estrategics      → plans.vue          Plans estratègics
    /valoracio-ciutadana    → valoracio.vue       Valoració ciutadana

/comarques/:comarcaId    → pages/comarca.vue     [layout de comarca]
  (estructura similar a municipi)

/agregacions/:agregacioId → pages/agregacio.vue  [layout d'agrupació]
  (estructura similar a municipi)
```

#### Navegació entre entitats

El component `NavBar.vue` injecta `municipalities` i `comarcas` (dades globals) per renderitzar el selector de navegació entre entitats.

---

### `frontend/carrega-de-dades.md` — Càrrega de dades

**Contingut:**

#### Arquitectura de la capa de dades

Diagrama del flux:

```
Component Vue
  → useLoadData("getValues", { params })
    → services/data.js     defineix la URL i els query params
      → services/apiFactory.js  gestiona caché + axios
        → services/apis.js       instancia axios per a /api/ o /data/
          → Backend API (o fitxers CSV locals)
```

#### `services/data.js`

Fitxer central on es defineixen tots els endpoints i com mapegar paràmetres de ruta/query a URL de l'API. Exporta funcions com `getMunicipalities()`, `getValues()`, `getLabels()`, etc.

Per afegir una crida nova: afegir una entrada a `data.js` amb el nom de la funció, la URL i el mapping de paràmetres.

#### `services/apiFactory.js`

Crea una instància axios amb caché en memòria. Si es fa la mateixa petició dues vegades, retorna el resultat cachecat. `clearCache()` neteja la caché.

#### `services/apis.js`

Defineix dues instàncies:
- `api` — per al backend remot (URL configurable via `VITE_API_URL` o `window.api_url`)
- `localApi` — per als fitxers CSV locals a `public/data/`

#### `useLoadData(functionName, params)`

Composable genèric per a qualsevol petició de dades. Retorna `{ data, loading, error }`. Es torna a carregar automàticament quan canvien els paràmetres (reactius).

```javascript
const { data: values, loading } = useLoadData('getValues', {
  municipalityId: computed(() => route.params.id),
  indicatorCode: computed(() => route.params.indicatorId),
})
```

#### Dades locals (CSV)

Alguns fitxers de dades estan inclosos a `public/data/` i es carreguen en local sense passar pel backend:
- `pesos.csv` — pesos dels indicadors per al càlcul d'ODS sintètics
- `plans_municipals.csv`, `plans_comarcals.csv` — plans estratègics
- `llistat_plans.csv` — llistat de plans
- Enquestes Dibarometre (`municipalities_2020.csv`, `municipalities_2024.csv`)

---

### `frontend/filtres-estat-global.md` — Filtres i estat global

**Contingut:**

#### `useFilters()`

Composable que llegeix els paràmetres de ruta i de query string i els exposa com a refs reactives. Quan es modifica un filtre, actualitza automàticament la URL (sense recàrrega de pàgina).

```javascript
const { year, view, selectedMunicipalities } = useFilters()
// Canviar un filtre actualitza ?year=... a la URL
year.value = 2022
```

#### Estat global amb `provide` / `inject`

`App.vue` carrega un cop les dades globals i les proveeix a tot l'arbre de components:

| Clau inject | Tipus | Contingut |
|-------------|-------|-----------|
| `municipalities` | `Ref<Municipality[]>` | 311 municipis amb metadades |
| `comarcas` | `Ref<Comarca[]>` | 14 comarques |
| `aggregations` | `Ref<Aggregation[]>` | Agrupacions disponibles |
| `targets` | `Ref<Target[]>` | 105 fites ODS *(targets)* amb indicadors imbricats |
| `loadingTargets` | `Ref<boolean>` | Estat de càrrega de les fites |
| `dibarometreData` | `Ref<...>` | Dades de l'enquesta ciutadana |

Ús en qualsevol component fill:

```javascript
const municipalities = inject('municipalities')
const targets = inject('targets')
```

Addicionalment, els layouts (`municipi.vue`, `comarca.vue`, `agregacio.vue`) proveeixen `entity` i `target` per als seus fills.

---

### `frontend/textos.md` — Textos i etiquetes (OTText)

**Contingut:**

#### Sistema d'etiquetes

Tots els textos de la UI s'emmagatzemen com a claus d'i18n. Hi ha tres idiomes: català (`ca`), castellà (`es`) i anglès (`en`). Per defecte, s'usa el català.

#### Càrrega de textos (dos nivells)

1. **Fitxers JSON locals** (`src/locales/ca.json`, etc.) — textos base inclosos al bundle. ~150KB per idioma.
2. **Override via API** — en carregar l'app, es fa `GET /api/labels-import?language=ca` i els textos obtinguts sobreescriuen els locals. Això permet editar textos sense redesplegar el frontend.

#### `OTText`

Component que renderitza un text per clau:

```vue
<OTText value="HOMEPAGE.TITLE" />
<OTText value="SDGS.1.TARGETS.1.INDICATORS.1.TITLE" :markdown="true" />
```

Propietats:
- `value`: clau d'i18n (amb notació de punt)
- `options`: variables d'interpolació
- `markdown`: renderitza com a Markdown (via `OTMarkdown`)
- `mdClass`: classes Tailwind per al wrapper del markdown

#### Mode d'edició

Afegint `?mode=edit` a la URL, el component `OTText` mostra un textarea editable al voltant de cada text. En guardar, fa `POST /api/labels-import` amb el nou valor (requereix token JWT). Els canvis es reflecteixen immediatament a la UI.

#### `useLoadLabels()`

Composable que s'executa automàticament en muntar `App.vue`. Crida `/api/labels-import` i fusiona les etiquetes dins l'instància `i18n`.

---

### `frontend/components-grafics.md` — Components gràfics

**Contingut:**

Per a cada component, indicar: fitxer, propietats principals, format de les dades d'entrada.

#### `LineChart.vue`

Gràfic de línies temporal. Usat per mostrar l'evolució d'un indicador al llarg dels anys.

**Props:**
- `data: Array<{ year: number, value: number }>` — sèrie temporal
- `color: string` — color de la línia
- `scale: 'linear' | 'log'` — escala de l'eix Y
- `showXAxis / showYAxis: boolean`
- `dotRadius: number`

#### `BeeswarmChart.vue`

Diagrama de punts forçat (beeswarm). Mostra la distribució de tots els municipis per un indicador, destacant el municipi seleccionat.

**Props:**
- `data: Array<{ id, value, label, highlighted }>` — un punt per municipi
- `radius: number` — radi de cada punt
- `domain: [min, max]` — rang de l'eix
- `compareValue: number` — valor de referència (comarca, agrupació)

#### `RoseChart.vue`

Gràfic radial (tipus "rose" o "polar"). Usat per mostrar puntuació sintètica per ODS.

**Props:**
- `data: Array<{ id, value, label, color }>` — un sector per ODS
- `innerRadius: number`
- `padAngle: number`
- `labelsOutside: boolean`

#### `BarcelonaMap.vue`

Veure secció [El mapa](./mapa.md).

#### Altres gràfics

- `BarChart.vue` — barres horitzontals/verticals
- `StackedBarChart.vue` — barres apilades (p. ex. pressupost per programa)
- `ScatterPlotWithZoom.vue` — scatter plot amb zoom interactiu
- `ColumnChart.vue` — gràfic de columnes verticals
- `TreeMap.vue` — treemap jeràrquic

---

### `frontend/mapa.md` — El mapa

**Contingut:**

#### `BarcelonaMap.vue`

Mapa SVG interactiu dels 311 municipis de la província de Barcelona. Renderitzat amb D3.js i geometries en format TopoJSON.

**Props principals:**
- `data: Array<{ id, value }>` — valors per pintar (escala de color)
- `color: d3.ScaleSequential` — escala de color D3
- `hovered: string | null` — ID del municipi en hover
- `selected: string | null` — ID del municipi seleccionat
- `zoomedComarca: string | null` — codi de comarca per fer zoom

**Events emesos:**
- `@select(municipalityId)` — click sobre un municipi
- `@hover(municipalityId)` — mouseenter/mouseleave
- `@zoomComarca(comarcaId)` — click sobre una comarca per fer zoom

#### Fitxers de geometria

La geometria dels municipis s'emmagatzema en format **TopoJSON** a:

```
src/assets/municipis.json   (1.5MB — geometria + metadades dels 311 municipis)
src/assets/comarcas.json    (14 comarques — metadades)
```

**Per adaptar el mapa a un altre territori:**
1. Substituir `municipis.json` pel fitxer TopoJSON del nou territori
2. Ajustar les propietats del TopoJSON (camps `id`, `name`, etc.) o adaptar el component
3. Actualitzar `municipalities.json` amb els nous municipis i els seus camps (`ine_code`, `comarca_id`, etc.)
4. Actualitzar la projecció D3 a `BarcelonaMap.vue` si cal

**Nota:** El fitxer no és un `.geojson` estàndard sinó un **TopoJSON** (format compactat). Es converteix a GeoJSON en memòria via la llibreria `topojson-client`.

---

### `frontend/components-ui.md` — Components UI bàsics

**Contingut:**

#### `OTSelect`

Selector avançat (dropdown amb cerca, jerarquia, multi-selecció). Usat per seleccionar indicadors, municipis, etc.

**Props:**
- `options: Array<{ value, label, children? }>` — opcions (pot ser arbre)
- `modelValue` — valor seleccionat (o array si `multiple`)
- `multiple: boolean` — permet multi-selecció
- `allowSearch: boolean` — mostra camp de cerca
- `leafOnly: boolean` — només seleccionable als nodes fulla
- `preventDeselect: boolean` — impedeix deseleccionar l'opció activa

#### `OTTable`

Taula amb ordenació per columna i paginació. Props: `columns`, `rows`, `sortable`.

#### `OTModal`

Modal accessible. Props: `isOpen`. Slots: `header`, `body`, `footer`.

#### `OTToggle`

Toggle booleà (switch). Props: `modelValue`, `label`.

#### `OTTooltip`

Tooltip flotant. Props: `content`, `position`.

#### `OTMarkdown`

Renderitza Markdown a HTML. Usat internament per `OTText` quan `markdown=true`.

#### `LoadingSpinner`

Indicador de càrrega. Props: `loading`, `borderClass`, `bgColorClass`.

#### `DownloadCSVButton` / `DownloadSVGButton` / `DownloadImageButton`

Botons d'exportació. Props: `data` (per al CSV), `filename`.

#### `NavBar`

Barra de navegació superior. Injecta `municipalities` i `comarcas`. Conté el selector de territori i el canviador d'idioma.

#### `SubMenu`

Menú lateral de l'entitat seleccionada (llista d'indicadors, tabs de pressupost, etc.). S'adapta en funció de la ruta activa.

---

## Prioritat d'implementació recomanada

1. ⭐ `backend/nou-indicador.md` — la secció més valuosa per a nous usuaris
2. ⭐ `backend/estructura.md` — orientació bàsica imprescindible
3. ⭐ `frontend/carrega-de-dades.md` — explica el cor de l'arquitectura frontend
4. `backend/model-de-dades.md` — amb el diagrama de la BBDD
5. `backend/etl.md` — per a qui vol afegir fonts de dades
6. `frontend/rutes.md` — mapa mental de l'app
7. `backend/cli.md` — referència operacional
8. `frontend/components-grafics.md` i `frontend/mapa.md`
9. `frontend/textos.md` i `frontend/filtres-estat-global.md`
10. Canvis als `README.md` dels dos repositoris
11. Resta de seccions (agrupacions, ODS sintètics, API, instal·lació)
