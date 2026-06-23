# Textos i etiquetes

Tots els textos de la interfície són claus d'i18n. Hi ha **tres idiomes**: català (`ca`, per defecte), castellà (`es`) i anglès (`en`).

## Els fitxers JSON

Els textos viuen en tres fitxers JSON, un per idioma:

```
src/locales/
├── ca.json    (per defecte)
├── es.json
└── en.json
```

Es carreguen al bundle i es registren com a missatges inicials d'i18n a `main.js`:

```js
import { createI18n } from 'vue-i18n'
import ca from './locales/ca.json'
import es from './locales/es.json'
import en from './locales/en.json'

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'ca',
  fallbackLocale: 'ca',
  messages: { ca, es, en },
})
```

## Estructura de les claus

Les claus segueixen una jerarquia per àmbit, p. ex. els textos dels indicadors es localitzen sota `SDGS.{ods}.TARGETS.{fita}.INDICATORS.{indicador}.*`:

```json
{
  "HOMEPAGE": {
    "TITLE": "Visor 2030"
  },
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

::: tip Editar textos
Per modificar o afegir un text, **editeu directament el fitxer JSON corresponent** (`ca.json`, `es.json` i `en.json`). Cal mantenir la mateixa clau en tots tres fitxers; si un idioma no la té, vue-i18n usa el `fallbackLocale` (`ca`).
:::

## `OTText` — renderitzar un text

```vue
<OTText value="HOMEPAGE.TITLE" />
<OTText value="SDGS.3.TARGETS.3.4.INDICATORS.3.4.1.NAME" :markdown="true" />
<OTText value="GREETING" :options="{ name: 'Germinal' }" />
```

| Prop | Tipus | Descripció |
|------|-------|------------|
| `value` | String | Clau d'i18n amb notació de punt |
| `options` | Object | Variables d'interpolació per a `$t` |
| `markdown` | Boolean | Si `true`, renderitza amb `OTMarkdown` |
| `mdClass` | String | Classes Tailwind per al wrapper de markdown |

Internament fa servir `$t(value, options)`.

## Canvi d'idioma

El canvi d'idioma actualitza `i18n.locale`. El paràmetre de ruta `/:locale?` permet URL amb idioma explícit (`/es/municipis/...`); un *middleware* al router (`main.js`) el valida i el sincronitza amb i18n. Si el paràmetre no és vàlid, s'usa el per defecte (`ca`).
