# Serveis auxiliars de l'ETL

Tots els importadors comparteixen un conjunt de **serveis auxiliars** que centralitzen les operacions repetides: la resolució de codis geogràfics, l'escriptura a la BBDD, les crides a APIs externes i el càlcul d'agrupacions.

Aquesta organització és el resultat d'un refactor que va dividir l'antic `ETLHelperService` (2.497 línies) en classes petites amb una sola responsabilitat. **L'`ETLHelperService` ja no existeix**: tot el seu contingut s'ha redistribuït en serveis especialitzats sota `src/Service/Etl/`.

```
src/Service/Etl/
├── Util/
│   ├── EtlUtils.php                 Constants + helpers purs (estàtics)
│   └── NameGenderGuesser.php        Inferència de gènere a partir del nom
├── Geo/GeoRegistry.php              Resol Municipality/Comarca/Province
├── Indicator/IndicatorFactory.php   Crea Target/Indicator des d'una IndicatorDefinition
├── Persistence/ValuePersister.php   Desa MunicipalityValue/ComarcaValue/ProvinceValue
└── Source/
    ├── IdescatJsonClient.php        API JSON d'IDESCAT
    ├── IdescatTableClient.php       Endpoints SSV (tabulars) d'IDESCAT
    └── DoClient.php                 Transparència Catalunya (Dades Obertes)
```

L'`AbstractEtlImporter` injecta aquests serveis al constructor, de manera que **qualsevol importador hi té accés directe** via `$this->geo`, `$this->values`, `$this->do`, etc.

## Vista ràpida: qui injecta què

L'`AbstractEtlImporter` rep 10 col·laboradors al constructor i els exposa als descendents com a atributs protegits:

| Atribut | Servei |
|---------|--------|
| `$this->em` | `EntityManagerInterface` |
| `$this->http` | `HttpClientInterface` |
| `$this->logger` | `LoggerInterface` |
| `$this->geo` | `GeoRegistry` |
| `$this->indicatorFactory` | `IndicatorFactory` |
| `$this->values` | `ValuePersister` |
| `$this->idescatJson` | `IdescatJsonClient` |
| `$this->idescatTable` | `IdescatTableClient` |
| `$this->do` | `DoClient` |
| `$this->aggregations` | `AggregationCalculatorService` (cridat a `afterSuccess()`) |

A continuació, el detall de cada servei.

---

## `EtlUtils` — constants i helpers purs

Classe **estàtica** sense estat. Substitueix les quatre constants `MUN_FILTER` duplicades que abans hi havia repartides pels importadors.

| Membre | Tipus | Què és |
|--------|-------|--------|
| `EtlUtils::BCN_MUNICIPALITY_FILTER` | const | Els 311 codis INE de 6 dígits dels municipis de la província de Barcelona (per a `&mun=…`) |
| `EtlUtils::BCN_COMARCA_FILTER` | const | Els 13 codis de comarques (per a `&com=…`). `IdescatImporter` hi afegeix localment el codi `43` (Moianès) |
| `EtlUtils::toFloat($value)` | mètode estàtic | Converteix `string\|int\|float\|null` a `float` interpretant la coma com a separador decimal català/castellà (`"12,34"` → `12.34`). Els `null` retornen `0.0` |

**Importadors que el fan servir directament**: `DoIdescatImporter`, `DoHermesImporter`, `IdescatImporter`, `IdescatIdescatImporter`, `IdescatTableImporter` (a través dels seus filtres `&mun=…`).

::: tip
`ValuePersister` ja crida `EtlUtils::toFloat()` internament en desar `value`/`value2`, així que el codi de l'importador rarament l'ha d'invocar per a aquest cas.
:::

---

## `GeoRegistry` — resolució d'entitats geogràfiques

Resol municipis, comarques i províncies a partir dels codis i noms heterogenis que retornen les fonts externes. **Cacheja** cada lookup durant la petició.

| Mètode | Què fa |
|--------|--------|
| `getProvince()` | Retorna la província per defecte (`province_code = '8'`, Barcelona) |
| `getProvinceByCode($code)` | Província per codi (normalitza zeros inicials) |
| `getComarcaByCode($code)` | Comarca per codi |
| `getComarcaByName($name)` | Comarca per nom, amb fallback via taula d'àlies |
| `getMunicipalityByCode($rawCode)` | Municipi per codi de 5 o 6 dígits, gestionant el *quirk* del zero inicial (`"80018"` → `"080018"`) |
| `getMunicipalityByName($name)` | Municipi per nom, amb normalització d'articles (`"Garriga, la"` → `"La Garriga"`, `"GARRIGA (LA)"` → `"La Garriga"`) i taula d'àlies per a versions truncades/mal escrites |
| `getAllComarques()` | Totes les comarques indexades per `comarca_code` |
| `getMunicipalityCodesByComarcaCode($code)` | Llista de codis de municipi d'una comarca |

Les taules de constants `MAPPED_MUNICIPALITY_NAMES` i `MAPPED_COMARCA_NAMES` recullen els alies coneguts (variants truncades a 20 caràcters, accents perduts, denominacions oficials com `Consell Comarcal d´Osona` → `Osona`...). Cal **afegir-hi entrades noves** quan apareix un nom que no es resol.

**Importadors que en depenen**: pràcticament tots — `Ine`, `Idescat`, `IdescatTable`, `IdescatIdescat`, `Do`, `Dodo`, `Dododo`, `DoIdescat`, `Paes`, `Csv`, `Csv711`. La classe base també l'utilitza via `$this->getMunicipalityByCode()`, que és un *wrapper* per comoditat.

---

## `IndicatorFactory` — creació de fites *(targets)* i indicadors

Crea o recupera les files `Target` i `Indicator` a partir d'una `IndicatorDefinition`. **Persisteix les noves entitats però no fa flush** — el `run()` de l'`AbstractEtlImporter` controla la transacció.

| Mètode | Què fa |
|--------|--------|
| `getOrCreateTarget(IndicatorDefinition $def)` | Cerca o crea la fita pel seu `target_id`; copia `targetName` i `sdg` si és nova |
| `getOrCreateIndicator(IndicatorDefinition $def, Target $target)` | Cerca o crea l'indicador per `(indicator_id, target)`; copia els camps de la definició (nom, descripció, signe, font, URL, unitat, escala) i fixa `calculation = 'simple'` |

**Qui l'usa**: només l'`AbstractEtlImporter` (al mètode `run()`). Cap importador concret hi crida directament — la resolució de `Target`/`Indicator` és part del cicle de vida comú.

---

## `ValuePersister` — escriptura de valors

Fa l'*upsert* (cerca-i-actualitza, o crea) de `MunicipalityValue`, `ComarcaValue` i `ProvinceValue`. La clau única per cercar és `(year, indicator, geo, subindicator)`. Aplica `EtlUtils::toFloat()` als valors.

| Mètode | Camps |
|--------|-------|
| `setMunicipalityValue($year, $indicator, ?$municipality, $value, ?$value2, ?$unit, ?$subindicator)` | Si `$municipality` és `null`, no fa res |
| `setComarcaValue($year, $indicator, ?$comarca, $value, ?$value2, ?$subindicator)` | (idem per a comarca) |
| `setProvinceValue($year, $indicator, ?$province, $value, ?$value2, ?$subindicator)` | (idem per a província) |

**Qui l'usa directament**: `Csv711Importer` i `IdescatIdescatImporter` (els que escriuen amb signatures pròpies). La resta usa **les versions embolcallades** de la classe base — `$this->setMunicipalityValue($def, $indicator, $mun, $year, $value, ...)` —, que afegeixen el filtre per `ImportScope`, incrementen el comptador `created` i passen `unit` automàticament des de la `IndicatorDefinition`.

---

## `IdescatJsonClient` — API JSON d'IDESCAT

Embolcalla `api.idescat.cat/taules/v2/...?f=json` amb mètodes que retornen estructures ja indexades.

| Mètode | Què retorna |
|--------|-------------|
| `getYears($url)` | Anys disponibles a la dimensió `YEAR`. Si la font està indexada per `MONTH`, retorna el mes més recent per any (p. ex. `"2024M12"`), descendent |
| `getMonths($url)` | Índex complet de mesos, descendent |
| `getMunicipalityPopulationByAges($year, $ages, $sex='total')` | `[codiMun → poblacióTotal]` sumant la dimensió `AGE` indicada. Tria l'endpoint segons l'any: ≥ 2023 → `censph/540`; < 2014 → `pmh/1180/1063`; resta → `pmh/1180/8078` |
| `getComarcaPopulationByAges($year, $ages, $sex='total')` | Anàleg per comarca (els codis amb zero inicial es desempaqueten) |
| `getProvincePopulationByAges($year, $ages, $sex='total')` | Anàleg per a la província 08 |
| `getAffiliatesByYear($year, $sex='total', $scope='mun')` | `[codi → mitjana d'afiliats]` calculada sobre els mesos disponibles d'aquell any (típicament M03, M06, M09, M12). `$scope`: `'mun'`, `'com'` o `'prov'` |

**Importadors que el fan servir**: `IdescatImporter`, `IdescatIdescatImporter`, `IdescatTableImporter`, `DoIdescatImporter`, `Csv711Importer`. Tots els que necessiten població o afiliats com a denominador.

---

## `IdescatTableClient` — endpoints tabulars d'IDESCAT

Embolcalla els endpoints `f=ssv` (semicolon-separated values) d'IDESCAT. Aquestes respostes són una capçalera de metadades + una fila d'encapçalament + dades.

| Mètode | Què retorna |
|--------|-------------|
| `getYears($url)` | Primera columna de la taula com a sèrie temporal. Elimina marcadors `" (p)"` (provisional). Si els valors són `"12/YYYY"`, conserva només files de desembre i extreu `YYYY` |
| `getValues($url, $useCode5 = false)` | Array indexat per **codi de municipi** (1a columna) on cada valor és una fila clau→valor segons la capçalera. Amb `$useCode5 = true` trunca la clau als 5 primers caràcters (per a taules amb dígit de verificació) |
| `getProvinceValues($url)` | Anàleg, indexat per **any** (per a taules de la forma `any ; mètrica1 ; mètrica2 ;…`) |

**Importadors que el fan servir**: `IdescatTableImporter` (l'ús principal) i `DibaIdescatImporter` (per al denominador d'atur total).

---

## `DoClient` — Transparència Catalunya (Dades Obertes)

Embolcalla `analisi.transparenciacatalunya.cat/resource/...`. Especialitzat en població (dataset històric `x5sz-niat`) i en consultes específiques que es reutilitzen.

| Mètode | Què retorna |
|--------|-------------|
| `getYears($url)` | Extreu el camp d'any d'un *catàleg* d'un dataset. Prova en ordre `any`, `campanya`, `id_eleccio`, `by_year_data_de_posada_en_servei`, `curs`, `by_year_data_publicacio_formalitzacio`, `by_year_data_inscripcio`, `any_exercici` |
| `getMunicipalityPopulationByYear($year, $shortCode = false)` | `[codiMun → poblacióTotal]` per a tots els municipis filtrats per `codi_10 LIKE '08…'`. `$shortCode = true` retorna codis de 5 dígits |
| `getComarcaPopulationByYear($year)` | Agrega la població anterior a comarca, usant la relació comarca → municipi de la BBDD |
| `getProvincePopulationByYear($year)` | Agrega a província |
| `getMunicipalityPopulationLastYear($shortCode = false)` | Detecta l'any més recent del dataset i retorna la població d'aquell any |
| `getHectareesByYear($year)` | (Específic per a l'indicador 2.1.1) Hectàrees agrícoles per municipi separades en ecològic (`ccpae_e = S`) i convencional (`N`). Retorna `[$raw, $aggregatedByMunicipality]` |

**Importadors que el fan servir**: `Ine`, `Do`, `Dodo`, `Dododo`, `DoHermes`, `Idescat`, `IdescatTable`, `Aca`, `Csv`, `Csv711` — pràcticament qualsevol importador que necessiti població com a denominador.

---

## El cas especial de `NameGenderGuesser`

Quan `DibaImporter` (indicador 5.5.1 — % càrrecs electes dones) processa el dataset DIBA d'electes, el camp `sexe` pot ser buit per a alguns registres. En aquests casos s'infereix el gènere a partir del nom de pila usant una llista llarga de noms catalans/castellans.

Aquesta lògica vivia abans dins d'`ETLHelperService` (~390 línies) i ara és un helper estàtic dedicat:

```php
NameGenderGuesser::guess('Maria del Mar'); // 'F'
NameGenderGuesser::guess('Joan');           // 'M'
NameGenderGuesser::guess('Alex');           // null si no es pot determinar
```

Nomès l'usa `DibaImporter`; els altres importadors no l'han d'importar.

## Resum d'ús per importador

Aquesta taula et serveix de referència ràpida (✓ = usat directament; els serveis no marcats poden ser-ne dependències transitives).

| Importador | `geo` | `do` | `idescatJson` | `idescatTable` | `values` | `EtlUtils` |
|------------|:-:|:-:|:-:|:-:|:-:|:-:|
| `IneImporter` | ✓ | ✓ | | | | |
| `IdescatImporter` | ✓ | ✓ | ✓ | | | ✓ |
| `IdescatTableImporter` | ✓ | ✓ | ✓ | ✓ | | ✓ |
| `IdescatIdescatImporter` | ✓ | | ✓ | | ✓ | ✓ |
| `DoImporter` | ✓ | ✓ | | | | |
| `DodoImporter` | ✓ | ✓ | | | | |
| `DododoImporter` | ✓ | ✓ | | | | |
| `DoIdescatImporter` | ✓ | | ✓ | | | ✓ |
| `DoHermesImporter` | | ✓ | | | | ✓ |
| `DibaImporter` | | | | | | |
| `DibaIdescatImporter` | | | | ✓ | | |
| `PaesImporter` | ✓ | | | | | |
| `AcaImporter` | | ✓ | | | | |
| `EduCsvImporter` | | | | | | |
| `CsvImporter` | ✓ | ✓ | | | | |
| `Csv711Importer` | ✓ | ✓ | ✓ | | ✓ | |
| `Csv1610Importer` | | | | | | |

A més, `DibaImporter` és l'únic que usa `NameGenderGuesser` (`Util/`).
