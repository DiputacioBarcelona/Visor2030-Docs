# Càlcul i format dels valors

Com s'explica al [Model de dades](./model-de-dades#el-model-de-valors-value-i-value2), les taules de valors emmagatzemen dades en brut (`value` = numerador, `value2` = denominador) i **no** el número final que es mostra. Aquesta pàgina documenta com es transforma aquesta dada en brut en el valor visible, i quants decimals s'apliquen.

## On viu aquesta lògica

La definició està **duplicada** en dos llocs que han d'estar sincronitzats:

| Capa | Fitxer | Ús |
|------|--------|-----|
| Backend | `src/Util/IndicatorCalculator.php` | Càlcul en exportacions CSV i processos interns |
| Frontend | `src/utils/indicators.js` | Càlcul del valor mostrat a la UI (mapes, gràfics, taules) |

::: warning Mantenir-los sincronitzats
Si afegiu o modifiqueu el càlcul d'un indicador, heu d'aplicar el canvi **als dos fitxers**. Una divergència fa que el CSV exportat i la UI mostrin números diferents.
:::

## Funcions de càlcul

Cada indicador té assignada una funció que rep la fila de dades (`d`, amb `d.value` i `d.value2`) i retorna el valor a mostrar. Les funcions de ràtio fan *fallback* a `value` quan no hi ha `value2`.

| Funció | Fórmula | Quan s'usa |
|--------|---------|------------|
| `simple` | `value` | El valor ja és el final (renda, índex, recompte) |
| `simplePerHundred` | `value × 100` | El valor és una fracció 0–1 que es vol en % |
| `simplePerThousand` | `value × 1000` | Fracció que es vol per mil |
| `percent` | `(value × 100) / value2` | Percentatges i "per cada 100 habitants" |
| `percentMonthly` | `(value × 12 × 100) / value2` | Percentatge a partir de dada mensual anualitzada |
| `perThousand` | `(value × 1000) / value2` | Taxes per mil habitants |
| `perTenThousand` | `(value × 10000) / value2` | Taxes per 10.000 habitants |
| `perHundredThousand` | `(value × 100000) / value2` | Taxes per 100.000 habitants |
| `perUnit` | `value / value2` | Ràtios sense escalar (p. ex. ràtio alumne/professor) |
| `diff` | `value − value2` | Diferència entre dos valors (p. ex. bretxa de gènere) |
| `diffPercent` | `((value − value2) × 100) / (value + value2)` | Diferència relativa percentual |

### Funcions de format textual

Alguns indicadors no mostren un número sinó una etiqueta. S'apliquen amb la propietat `textFormat` (a sobre del `calculation`, que sol ser `simple`):

| Funció | Mapatge |
|--------|---------|
| `baixaAlta` | `1`→LOW · `2`→MEDIUM · `3`→HIGH · `4`→VERY_HIGH |
| `siNo` | `0`→NO · `1`→SI |
| `actualitzat` | `0`→NO_ACTUALITZAT · `1`→ACTUALITZAT |

(El text final que veu l'usuari per a cada etiqueta —p. ex. "Baixa", "Alta"— es resol via les [etiquetes de llengua](./model-de-dades).)

## Decimals

Cada indicador defineix tres valors de decimals:

| Clau | Aplica a |
|------|----------|
| `decimals` | El valor calculat/mostrat |
| `decimals1` | El numerador (`value`) quan es mostra desglossat |
| `decimals2` | El denominador (`value2`) quan es mostra desglossat |

## Mapatge complet indicador → càlcul

Aquesta taula reflecteix `src/utils/indicators.js`. La columna "Família" indica el tipus segons el [model de valors](./model-de-dades#el-model-de-valors-value-i-value2).

| Indicador | Funció | Família | decimals | decimals1 | decimals2 | Format text |
|-----------|--------|---------|:--------:|:---------:|:---------:|-------------|
| 1.1.1 | `simple` | Simple | 1 | 1 | 0 | |
| 1.2.1 | `simple` | Simple | 2 | 2 | 0 | |
| 1.2.2 | `simple` | Simple | 0 | 0 | 0 | |
| 1.2.3 | `perThousand` | Ràtio | 2 | 0 | 0 | |
| 1.3.1 | `perTenThousand` | Ràtio | 2 | 0 | 0 | |
| 1.4.1 | `percent` | Ràtio | 2 | 0 | 1 | |
| 1.4.2 | `percent` | Ràtio | 2 | 0 | 0 | |
| 1.5.1 | `perTenThousand` | Ràtio | 2 | 0 | 0 | |
| 2.1.1 | `percent` | Ràtio | 2 | 2 | 2 | |
| 2.3.1 | `percent` | Ràtio | 2 | 2 | 0 | |
| 2.3.2 | `percent` | Ràtio | 2 | 1 | 1 | |
| 2.3.3 | `percent` | Ràtio | 2 | 0 | 0 | |
| 2.3.4 | `percent` | Ràtio | 2 | 0 | 0 | |
| 3.4.1 | `percent` | Ràtio | 2 | 0 | 0 | |
| 3.4.2 | `simple` | Simple | 2 | 2 | 0 | |
| 3.6.1 | `perTenThousand` | Ràtio | 2 | 0 | 0 | |
| 4.1.1 | `percent` | Ràtio | 2 | 0 | 0 | |
| 4.1.2 | `percent` | Ràtio | 2 | 0 | 0 | |
| 4.2.1 | `percent` | Ràtio | 2 | 0 | 0 | |
| 4.4.1 | `percent` | Ràtio | 2 | 0 | 0 | |
| 4.4.2 | `percent` | Ràtio | 2 | 0 | 0 | |
| 4.4.3 | `percent` | Ràtio | 2 | 0 | 0 | |
| 4.4.4 | `percent` | Ràtio | 2 | 0 | 0 | |
| 4.5.1 | `perUnit` | Ràtio | 2 | 0 | 0 | |
| 4.a.1 | `perUnit` | Ràtio | 2 | 0 | 0 | |
| 5.1.1 | `diff` | Diferència | 2 | 2 | 2 | |
| 5.5.1 | `percent` | Ràtio | 2 | 0 | 0 | |
| 5.c.1 | `percent` | Ràtio | 2 | 1 | 1 | |
| 5.c.2 | `percent` | Ràtio | 2 | 1 | 0 | |
| 6.1.1 | `simple` | Simple | 3 | 3 | 0 | |
| 6.4.1 | `perUnit` | Ràtio | 2 | 0 | 0 | |
| 7.1.1 | `percent` | Ràtio | 2 | 2 | 2 | |
| 7.2.1 | `percent` | Ràtio | 2 | 1 | 1 | |
| 7.3.1 | `perUnit` | Ràtio | 2 | 1 | 0 | |
| 8.2.1 | `simple` | Simple | 0 | 0 | 0 | |
| 8.3.1 | `percent` | Ràtio | 2 | 0 | 0 | |
| 8.3.2 | `perThousand` | Ràtio | 2 | 0 | 0 | |
| 8.3.3 | `simple` | Simple | 1 | 1 | 0 | |
| 8.3.4 | `percent` | Ràtio | 2 | 0 | 0 | |
| 8.5.1 | `percent` | Ràtio | 2 | 1 | 0 | |
| 8.5.2 | `percent` | Ràtio | 2 | 1 | 0 | |
| 8.9.1 | `perTenThousand` | Ràtio | 2 | 0 | 0 | |
| 9.1.1 | `simplePerHundred` | Simple | 2 | 2 | 0 | |
| 9.2.1 | `percent` | Ràtio | 2 | 0 | 0 | |
| 9.5.1 | `perTenThousand` | Ràtio | 2 | 0 | 0 | |
| 9.5.2 | `percent` | Ràtio | 2 | 0 | 0 | |
| 9.c.1 | `simplePerHundred` | Simple | 2 | 2 | 0 | |
| 10.1.1 | `simple` | Simple | 1 | 1 | 0 | |
| 10.1.2 | `simple` | Simple | 1 | 1 | 0 | |
| 10.1.3 | `simple` | Simple | 1 | 1 | 0 | |
| 10.1.4 | `simple` | Simple | 0 | 0 | 0 | |
| 10.4.1 | `simple` | Simple | 2 | 2 | 0 | |
| 10.4.2 | `simple` | Simple | 2 | 2 | 0 | |
| 11.1.1 | `percentMonthly` | Ràtio | 2 | 2 | 0 | |
| 11.2.1 | `perTenThousand` | Ràtio | 2 | 0 | 0 | |
| 11.3.1 | `percent` | Ràtio | 2 | 2 | 2 | |
| 11.3.2 | `simple` | Simple | 2 | 2 | 0 | |
| 11.4.1 | `perUnit` | Ràtio | 2 | 2 | 0 | |
| 11.4.2 | `perTenThousand` | Ràtio | 2 | 0 | 0 | |
| 11.6.1 | `perThousand` | Ràtio | 2 | 2 | 0 | |
| 11.6.2 | `percent` | Ràtio | 2 | 2 | 2 | |
| 11.7.1 | `perUnit` | Ràtio | 2 | 2 | 0 | |
| 12.1.1 | `perHundredThousand` | Ràtio | 2 | 0 | 0 | |
| 12.5.1 | `percent` | Ràtio | 2 | 2 | 2 | |
| 12.5.2 | `perThousand` | Ràtio | 2 | 2 | 0 | |
| 13.1.1 | `simple` | Simple | 0 | 0 | 0 | `baixaAlta` |
| 13.2.1 | `perUnit` | Ràtio | 2 | 2 | 0 | |
| 13.2.2 | `simple` | Simple | 2 | 2 | 0 | |
| 14.1.1 | `simple` | Simple | 2 | 2 | 0 | |
| 14.2.1 | `simple` | Simple | 2 | 2 | 0 | |
| 15.1.1 | `simple` | Simple | 2 | 2 | 0 | |
| 15.1.2 | `simple` | Simple | 2 | 2 | 0 | |
| 15.2.1 | `simple` | Simple | 2 | 2 | 0 | |
| 15.4.1 | `percent` | Ràtio | 2 | 2 | 2 | |
| 16.6.1 | `simple` | Simple | 2 | 0 | 0 | |
| 16.7.1 | `percent` | Ràtio | 2 | 0 | 0 | |
| 16.7.2 | `simple` | Simple | 0 | 0 | 0 | `actualitzat` |
| 16.10.1 | `simple` | Simple | 1 | 1 | 0 | |
| 17.1.1 | `perUnit` | Ràtio | 2 | 2 | 0 | |
| 17.1.2 | `perUnit` | Ràtio | 2 | 2 | 0 | |
| 17.2.1 | `perUnit` | Ràtio | 2 | 2 | 0 | |
| 17.17.1 | `perHundredThousand` | Ràtio | 2 | 0 | 0 | |
| 17.17.2 | `perHundredThousand` | Ràtio | 2 | 0 | 0 | |

## Exemple complet

L'indicador `3.4.1` ("% de població de 65 anys o més sobre el total") es defineix com `percent`:

1. L'importador ETL emmagatzema, per a cada municipi i any:
   - `value` = població de 65+ anys (numerador)
   - `value2` = població total (denominador)
2. El frontend aplica `percent`: `(value × 100) / value2` → p. ex. `(3.200 × 100) / 16.000 = 20,00 %`
3. Es mostra amb `decimals: 2` → **20,00 %**
4. Per a una **comarca**, l'estratègia d'agrupació suma tots els `value` i tots els `value2` dels municipis del grup abans de dividir, de manera que el percentatge comarcal és correcte (i no una mitjana de percentatges).
