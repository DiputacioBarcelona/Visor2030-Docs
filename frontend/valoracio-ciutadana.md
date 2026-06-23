# Valoració ciutadana

La secció de valoració ciutadana mostra com els habitants d'un municipi valoren diferents aspectes relacionats amb cada ODS. Les dades **no** vénen del backend del Visor 2030: provenen d'una plataforma **externa** anomenada **Dibaròmetre**, exposada com a CSV de Google Sheets.

## Pàgina

| Ruta | Pàgina |
|------|--------|
| `/municipis/:id/:sdg/valoracio-ciutadana` | `pages/municipi/sdg/valoration.vue` |

## Origen de les dades

El projecte **Dibaròmetre** és una enquesta ciutadana periòdica gestionada de manera independent. Publica els seus resultats com a fulls de càlcul públics a Google Drive, exposats com a CSV mitjançant l'URL de publicació estàndard:

```
https://docs.google.com/spreadsheets/d/{ID}/pub?output=csv
```

El visor consumeix aquests CSV directament des del navegador, sense intermediació del backend.

### Endpoints (`services/dataDibarometre.js`)

| Mètode | Font | Què retorna |
|--------|------|-------------|
| `getData()` | URL dinàmica (`window.dibarometre_url`) | Respostes de l'enquesta (totes les municipis) |
| `getSurvey()` | Google Sheet públic | Definició de l'enquesta (preguntes, ordre, tipus de gràfic) |
| `getDictionary()` | Google Sheet públic | Diccionari d'opcions de resposta |
| `getMunis()` | Google Sheet públic | Metadades de municipis (tram, comarca, mida) |
| `getDates()` | Google Sheet públic | Rangs de dates de l'enquesta per municipi |
| `getSdgQuestions()` | Local: `public/data/sdg_dibarometre.csv` | Mapatge ODS → pregunta |

L'URL de respostes és **dinàmica** (es defineix a `window.dibarometre_url`) perquè canvia entre versions de l'enquesta.

## Estructura de les respostes

`getData()` retorna un objecte amb:

```js
{
  modificacio: "2024-01-15 10:30:00",
  elements: [
    {
      id: "p2_4_3_m08019_2",          // {questionId}_{answerId}_{munOrTramId}_{version}
      // camps de la pregunta i la resposta:
      [IDS.QUESTION]: "p2_4",
      [IDS.ANSWER]: 3,
      [IDS.VERSION]: 2,
      [IDS.MUN_ID]: "m08019",          // "m{ine}" per municipi, "t{n}" per tram, "c{n}" per comarca
      numero_respostes_total: 450,
      numero_respostes_dona: 230,
      numero_respostes_home: 220,
      numero_respostes_18_24: 50,
      numero_respostes_25_34: 120,
      // ... segments d'edat i gènere
    },
    // ... milers de files
  ]
}
```

Cada fila representa **una combinació pregunta × resposta × entitat × versió**. Les agregacions (comarca, província, tram) ja vénen pre-calculades a la mateixa font.

## Mapatge ODS → pregunta

Fitxer local `public/data/sdg_dibarometre.csv`:

```
ODS,ODS descripció,Dibaròmetre,question_text,question_id,answer_id
```

| Columna | Descripció |
|---------|------------|
| `ODS` | Número d'ODS (1–17) |
| `ODS descripció` | Nom de l'ODS |
| `Dibaròmetre` | Tema dins del Dibaròmetre |
| `question_text` | Enunciat complet de la pregunta |
| `question_id` | Identificador de la pregunta (p. ex. `p2_4`); buit si l'ODS no té correspondència |
| `answer_id` | (Opcional) Filtra a una sola opció de resposta — útil quan només una opció és rellevant per a l'ODS |

Un mateix ODS pot tenir **diverses preguntes**; alguns ODS poden no tenir cap pregunta associada (camp buit).

## Càrrega global

L'API del Dibaròmetre és lenta, així que les dades es **precarreguen** a l'arrencada de l'app i es proveeixen globalment:

```js
// App.vue
const { data: dibarometreData, loading: dibarometreLoading } = useLoadDibarometre();
provide("dibarometreData", dibarometreData);
provide("dibarometreLoading", dibarometreLoading);
```

Qualsevol pàgina les consumeix amb `inject("dibarometreData")`. Vegeu [Filtres i estat global](./filtres-estat-global).

## Procés a la pàgina

`pages/municipi/sdg/valoration.vue` carrega en paral·lel: enquesta, diccionari, mapatge ODS, metadades de municipis. Després:

1. **Filtra** les preguntes incloses per a l'ODS actiu (`sdgQuestions` amb `ODS === sdg.value` i `question_id` no nul).
2. **Selecciona** les respostes corresponents a aquest municipi:
   - Municipis petits (`tram < 6`): es mostren agregats per tram.
   - Municipis grans (`tram ≥ 6`): es filtra per ID de municipi.
3. **Enriqueix** les opcions de resposta amb el text del diccionari i afegeix opcions amb 0 respostes per completar la sèrie.
4. **Calcula valors de comparació**: província (suma de comarques), comarca, tram, i any anterior si està disponible.

## UI

- Selector d'any (només es mostren els anys amb dades per al municipi).
- *Disclosure* per cada pregunta amb el gràfic adequat segons el camp `CHART` de l'enquesta:
  - `barchart` → `BarChartCard`
  - `heatmap` → `BarChartHeatMapCard`
  - `stacked bar` → `StackedBarChartCard`
- Comparativa visual: municipi vs. comarca vs. tram vs. província vs. any anterior.
- Desglossament demogràfic per gènere i tram d'edat.

## Particularitats

- **Barcelona ciutat** (codi INE `08019`) està **exclosa**: el Dibaròmetre no la cobreix.
- Si el **tram** d'un municipi canvia entre versions de l'enquesta (p. ex. de petit a gran), la comparativa amb l'any anterior **es deshabilita**.
- Les preguntes poden variar entre versions de l'enquesta; el selector d'any filtra a les versions disponibles per al municipi.
