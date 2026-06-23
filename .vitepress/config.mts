import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  title: 'Visor 2030',
  description: 'Documentació tècnica del Visor 2030 — plataforma d\'indicadors ODS per a municipis catalans',
  lang: 'ca',
  ignoreDeadLinks: true,

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: false,

    outline: {
      label: 'En aquesta pàgina',
    },

    docFooter: {
      prev: 'Pàgina anterior',
      next: 'Pàgina següent',
    },

    darkModeSwitchLabel: 'Aparença',
    lightModeSwitchTitle: 'Canvia a mode clar',
    darkModeSwitchTitle: 'Canvia a mode fosc',
    sidebarMenuLabel: 'Menú',
    returnToTopLabel: 'Torna a dalt',
    skipToContentLabel: 'Vés al contingut',

    nav: [
      { text: 'Inici', link: '/' },
      { text: 'Backend', link: '/backend/' },
      { text: 'Frontend', link: '/frontend/' },
    ],

    sidebar: {
      '/backend/': [
        {
          text: 'Backend',
          items: [
            { text: 'Introducció', link: '/backend/' },
            { text: 'Estructura de fitxers', link: '/backend/estructura' },
            { text: 'Instal·lació', link: '/backend/installacio' },
            { text: 'Model de dades', link: '/backend/model-de-dades' },
            { text: 'Càlcul i format dels valors', link: '/backend/calcul-indicadors' },
            { text: 'ETL: importadors de dades', link: '/backend/etl' },
            { text: 'ETL: serveis auxiliars', link: '/backend/etl-serveis-auxiliars' },
            { text: 'Com crear un indicador nou', link: '/backend/nou-indicador' },
            { text: 'Agrupacions (Aggregations)', link: '/backend/agrupacions' },
            { text: 'Pressupost', link: '/backend/pressupost' },
            { text: 'ODS sintètics', link: '/backend/ods-sinteticos' },
            { text: 'Comandes CLI', link: '/backend/cli' },
            { text: 'API i endpoints', link: '/backend/api' },
          ],
        },
      ],
      '/frontend/': [
        {
          text: 'Frontend',
          items: [
            { text: 'Introducció', link: '/frontend/' },
            { text: 'Estructura de fitxers', link: '/frontend/estructura' },
            { text: 'Instal·lació', link: '/frontend/installacio' },
            { text: 'Rutes i pàgines', link: '/frontend/rutes' },
            { text: 'Càrrega de dades', link: '/frontend/carrega-de-dades' },
            { text: 'Filtres i estat global', link: '/frontend/filtres-estat-global' },
            { text: 'Textos i etiquetes', link: '/frontend/textos' },
            { text: 'Components gràfics', link: '/frontend/components-grafics' },
            { text: 'El mapa', link: '/frontend/mapa' },
            { text: 'Pressupost', link: '/frontend/pressupost' },
            { text: 'Plans estratègics', link: '/frontend/plans-estrategics' },
            { text: 'Valoració ciutadana', link: '/frontend/valoracio-ciutadana' },
            { text: 'Components UI bàsics', link: '/frontend/components-ui' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/DiputacioBarcelona/Visor2030-API' },
    ],

    footer: {
      message: 'Publicat sota llicència MIT',
      copyright: 'Diputació de Barcelona',
    },
  },
}))
