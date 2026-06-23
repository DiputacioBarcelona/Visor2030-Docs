# Instal·lació

## Requisits

| Eina | Versió recomanada |
|------|-------------------|
| Node.js | 20+ |
| npm | 10+ |

## Passos

```bash
# 1. Clonar
git clone git@github.com:OneTandem/visor2030-frontend.git
cd visor2030-frontend

# 2. Instal·lar dependències
npm install

# 3. Configurar la URL de l'API
echo 'VITE_API_URL=http://localhost:8000/' > .env.local

# 4. Engegar el servidor de desenvolupament
npm run dev
```

El servidor de desenvolupament s'inicia amb `--host` (accessible des d'altres dispositius de la xarxa).

## Configuració de l'API

La URL del backend es resol a `src/config.js` en aquest ordre de prioritat:

```js
export const apiUrl = import.meta.env.VITE_API_URL || window.api_url || "http://localhost:8000/";
```

1. La variable d'entorn `VITE_API_URL` (recomanat per a desenvolupament; es defineix a `.env.local`)
2. La variable global `window.api_url` (útil en desplegaments incrustats)
3. Per defecte, `http://localhost:8000/`

## Scripts disponibles

| Script | Descripció |
|--------|------------|
| `npm run dev` | Servidor de desenvolupament amb HMR |
| `npm run build` | Comprovació de tipus (`vue-tsc`) + build de producció |
| `npm run build-prod` | Build de producció amb `--base=/` |
| `npm run serve` | Previsualitza el build de producció |
| `npm run build-zip` | Build de producció + genera un ZIP a `dist/` |
| `npm run process-csv` | Converteix CSV → JSON (scripts de dades) |
| `npm run process-json` | Converteix JSON → CSV |

## Stack tecnològic

- **Vue 3.4** + **Vue Router 4** + **Vue I18n 9**
- **Vite 5** com a build tool
- **Tailwind CSS 3** per als estils
- **D3.js 7** + `topojson-client` per a les visualitzacions
- `@markdoc/markdoc` per al renderitzat de Markdown
- `@headlessui/vue` i `@heroicons/vue` per a components UI accessibles
