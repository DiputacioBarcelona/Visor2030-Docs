# Pressupost

L'entitat `Budget` emmagatzema els pressupostos municipals desglossats per any i programa pressupostari. Aquesta pàgina explica **d'on vénen** aquestes dades i **com s'importen**.

## D'on vénen les dades

Les dades **no** s'introdueixen manualment ni es calculen al projecte: provenen d'un repositori GitHub de dades obertes mantingut per la comunitat:

> [`PopulateTools/gobierto-budgets-data`](https://github.com/PopulateTools/gobierto-budgets-data) — recull pressupostos municipals d'Espanya en format SQL comprimit.

El servei `BudgetImporter` (`src/Service/BudgetImporter.php`) descarrega per HTTPS dos fitxers per cada any, des de:

```
https://raw.githubusercontent.com/PopulateTools/gobierto-budgets-data/master/data/presupuestos_municipales/{year}/planned/tb_inventario.sql.gz
https://raw.githubusercontent.com/PopulateTools/gobierto-budgets-data/master/data/presupuestos_municipales/{year}/planned/tb_funcional.sql.gz
```

Cada fitxer és un volcat SQL d'INSERTs comprimit amb gzip. No s'executa cap SQL contra una BBDD remota: només es descarrega, es descomprimeix i es parseja per extreure els valors a importar.

## Les dues taules d'origen

| Taula | Què conté | Camps usats |
|-------|-----------|-------------|
| `tb_inventario` | Mapatge municipi → àrea pressupostària → funció | `codbdgel`, `code_area` |
| `tb_funcional` | Imports per partida funcional (programa pressupostari) | `id`, `idente`, `cdfgr` (codi de programa), `importe` (euros) |

`tb_inventario` serveix per **filtrar** les files vàlides. `tb_funcional` aporta els **imports**. La unió es fa per `id` / `idente`.

## El procés d'importació

L'`BudgetImporter::import($year)` segueix aquests passos:

1. **Descarrega** i descomprimeix `tb_inventario.sql.gz`.
2. **Parseja** els `INSERT` i conserva només les files amb `codbdgel` que comença per `"08"` (província de Barcelona) i `code_area = 'AA'`. Indexa el resultat per `id`.
3. **Descarrega** i descomprimeix `tb_funcional.sql.gz`.
4. **Parseja** els `INSERT` i conserva les files l'`id` de les quals existeix al diccionari d'inventari (amb `id === idente`).
5. **Agrega** els imports per `(municipi, codi_programa)`: si un municipi té diverses entrades amb el mateix `cdfgr`, se sumen.
6. **Persisteix** cada combinació com a `Budget` (mètode privat `setBudgetEntry` dins del mateix servei):
   - El codi de municipi es deriva dels 5 primers caràcters de `codbdgel`.
   - Es resol l'entitat `Municipality` per codi INE.
   - Es crea o actualitza la fila a `budget` amb `year`, `program` (`cdfgr`), `value` (`importe`), `municipality_id`.

::: warning Filtre per província de Barcelona
El filtre `codbdgel LIKE '08%'` està codificat directament a `BudgetImporter`. Si adapteu el projecte a un altre territori, cal canviar aquest prefix (o eliminar-lo) al servei.
:::

## Executar la importació

```bash
php bin/console app:import-budgets {year}
```

Exemple:

```bash
php bin/console app:import-budgets 2024
```

L'any és **obligatori**. Vegeu [Comandes CLI](./cli) per a més detall.

## L'entitat `Budget`

L'esquema està documentat a [Model de dades](./model-de-dades). Recordatori dels camps:

| Camp | Tipus | Descripció |
|------|-------|------------|
| `year` | int | Any del pressupost |
| `program` | varchar(6) | Codi de programa pressupostari (p. ex. `"130"`, `"011"`) — segueix la classificació funcional espanyola |
| `value` | float | Import en euros |
| `municipality` | FK | Municipi |

## Codis de programa i mapatge a ODS

Els codis de la columna `program` (p. ex. `130`, `134`, `162`) corresponen a la **classificació funcional** del pressupost municipal espanyol. **El backend no associa programes amb ODS**: aquest mapatge és responsabilitat del frontend, que ho fa client-side via un fitxer de pesos. Vegeu [Pressupost (frontend)](../frontend/pressupost) per a la part de visualització i agregació per ODS.
