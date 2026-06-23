# API i endpoints

El backend exposa la majoria de dades a través d'**API Platform**, que genera automàticament endpoints REST/JSON a partir de les entitats marcades amb `#[ApiResource]`. A més, hi ha alguns controladors personalitzats per a lògica que no encaixa en el patró CRUD.

## Documentació interactiva

API Platform genera una interfície Swagger/OpenAPI accessible al navegador:

```
https://{domini}/api
```

Allà es poden veure tots els endpoints, els filtres disponibles i provar les peticions en viu. És la referència sempre actualitzada.

## Endpoints d'API Platform (entitats)

Cada entitat amb `#[ApiResource]` genera endpoints automàticament. Aquesta taula resumeix les operacions i filtres principals.

| Recurs | Endpoint | Operacions | Paginació |
|--------|----------|------------|-----------|
| Municipis | `/api/municipalities` | `GET` (col·lecció + item) | No |
| Valors de municipi | `/api/municipality_values` | `GET` (col·lecció) | Sí (311/pàgina) |
| Comarques | `/api/comarcas` | `GET` (col·lecció) | — |
| Valors de comarca | `/api/comarca_values` | `GET` (col·lecció) | — |
| Províncies | `/api/provinces` | `GET` | — |
| Valors de província | `/api/province_values` | `GET` | — |
| Indicadors | `/api/indicators` | `GET`, `PATCH` | No |
| Fites *(targets)* | `/api/targets` | `GET` (col·lecció) | No |
| Agrupacions | `/api/aggregations` | `GET` (col·lecció) | No |
| Valors d'agrupació | `/api/aggregation_values` | `GET` (col·lecció) | No |
| Població | `/api/populations` | `GET` (col·lecció + item) | Sí (100/pàgina) |
| Pressupostos | `/api/budgets` | `GET` (col·lecció) | Sí (2000/pàgina) |

::: tip Serialització per grups
Els camps que apareixen a cada resposta es controlen amb grups de serialització (`#[Groups(...)]`) a les entitats. Per exemple, `/api/targets` inclou els seus indicadors imbricats gràcies al grup `target`.
:::

### Filtres habituals

Els filtres es declaren amb `#[ApiFilter(...)]` a l'entitat i es tradueixen automàticament en paràmetres de consulta.

```
# Valors d'un indicador per a un any
GET /api/municipality_values?indicator.indicator_id=1.2.1&year=2023

# Valors d'un municipi concret (codi INE)
GET /api/municipality_values?municipality.municipality_code=08019

# Municipis d'una agrupació
GET /api/municipalities?aggregations.slug=rural

# Fites d'un ODS concret
GET /api/targets?sdg=3

# Valors d'agrupació per slug i indicador
GET /api/aggregation_values?aggregation.slug=rural&indicator.indicator_id=1.2.1

# Ordenació
GET /api/municipalities?order[municipality_name]=asc
```

Filtres disponibles per recurs (els més usats):

| Recurs | Filtres `SearchFilter` | Filtres `OrderFilter` |
|--------|------------------------|------------------------|
| `municipality_values` | `municipality.id`, `municipality.municipality_code`, `municipality.municipality_code_6`, `municipality.comarca.comarca_code`, `municipality.aggregations.slug`, `indicator.indicator_id`, `indicator.target.sdg`, `year` | `year`, `value` |
| `municipalities` | `aggregations.slug` | `municipality_name`, `municipality_code_6` |
| `aggregation_values` | `aggregation`, `aggregation.slug`, `indicator`, `indicator.indicator_id`, `year` | — |
| `aggregations` | `group`, `slug` | — |
| `targets` | `sdg` | — |
| `budgets` | `municipality.*`, `program`, `year` | `program` |
| `populations` | `year`, `municipality.municipality_code` | — |

## Controladors personalitzats

Per a lògica que no és CRUD pur, hi ha controladors a `src/Controller/`.

| Endpoint | Mètode | Descripció |
|----------|--------|------------|
| `/api/synthetic-sdg` | GET | Puntuació sintètica per ODS (vegeu [ODS sintètics](./ods-sinteticos)) |
| `/api/sdg-indicators` | GET | Valors en brut per a un ODS |
| `/api/municipalities-under-weight` | GET | Entitats amb cobertura d'indicadors insuficient |
| `/api/labels-hierarchy` | GET | Etiquetes/textos de la UI (jerarquia) |
| `/api/labels-import` | POST | Desa etiquetes editades (requereix JWT) |
| `/api/etl/{indicator_id}` | POST | Dispara la importació ETL d'un indicador via HTTP |
| `/export/csv` | GET | Exporta valors a CSV |
| `/export/indicators` | GET | Exporta el catàleg d'indicadors a CSV |
| `/api/login` | POST | Autenticació JWT (retorna token) |

## Autenticació

Els endpoints de lectura són públics. Els d'escriptura (p. ex. `POST /api/labels-import`) requereixen un token JWT.

### Obtenir un token

```
POST /api/login
Content-Type: application/json

{ "username": "usuari", "password": "contrasenya" }
```

La resposta inclou un `token`. S'envia a les peticions protegides amb la capçalera:

```
Authorization: Bearer {token}
```

La configuració JWT es troba a `config/packages/lexik_jwt_authentication.yaml` i les regles d'accés a `config/packages/security.yaml`. Vegeu [Instal·lació](./installacio) per a la generació de claus.
