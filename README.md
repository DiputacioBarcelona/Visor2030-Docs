# Visor 2030 — Documentació

Documentació tècnica del projecte **Visor 2030**: una plataforma de codi obert per visualitzar i gestionar indicadors dels **Objectius de Desenvolupament Sostenible (ODS)** per a municipis catalans.

- **Visor públic**: [https://visor2030.diba.cat/](https://visor2030.diba.cat/)
- **Documentació tècnica (aquesta)**: [https://visor2030-documentacio.diba.cat/](https://visor2030-documentacio.diba.cat/)

> El projecte sencer està format per:
> - [`Visor2030-API`](https://github.com/DiputacioBarcelona/Visor2030-API) — backend (Symfony + API Platform)
> - [`Visor2030-Front`](https://github.com/DiputacioBarcelona/Visor2030-Front) — visualització pública (Vue 3 + Vite)
> - [`Visor2030-Back`](https://github.com/DiputacioBarcelona/Visor2030-Back) — backoffice
> - **aquest repo** — documentació tècnica

## Tecnologia

- **VitePress** (Vue / Vite / Mermaid)
- Documentació **en català**

## Executar la documentació en local

```bash
# 1. Clonar
git clone https://github.com/OneTandem/visor2030-documentacio.git
cd visor2030-documentacio

# 2. Instal·lar dependències
npm install

# 3. Servidor local
npm run dev
```

S'obre a `http://localhost:5173`.

## Estructura

```
visor2030-documentacio/
├── index.md                Pàgina d'inici
├── backend/                Documentació del backend
│   ├── estructura.md
│   ├── installacio.md
│   ├── model-de-dades.md
│   ├── etl.md
│   ├── etl-serveis-auxiliars.md
│   ├── nou-indicador.md      ⭐ Com crear un indicador nou
│   ├── agrupacions.md
│   ├── pressupost.md
│   ├── ods-sinteticos.md
│   ├── cli.md
│   └── api.md
├── frontend/               Documentació del frontend
│   ├── estructura.md
│   ├── installacio.md
│   ├── rutes.md
│   ├── carrega-de-dades.md
│   ├── filtres-estat-global.md
│   ├── textos.md
│   ├── components-grafics.md
│   ├── mapa.md
│   ├── pressupost.md
│   ├── plans-estrategics.md
│   ├── valoracio-ciutadana.md
│   └── components-ui.md
└── .vitepress/
    ├── config.mts          Configuració (sidebar, nav, idioma)
    └── theme/              Personalitzacions (logo, Mermaid fullscreen…)
```

## Contribuir

Tota la documentació s'escriu en **català**. Si feu canvis, executeu `npm run build` abans d'obrir un *pull request* per confirmar que no hi ha enllaços trencats.

## Llicència

[MIT](LICENSE).

## Crèdits

Desenvolupat per [OneTandem](https://onetandem.com) per a la [Diputació de Barcelona](https://www.diba.cat).
