# Backend

> Documentació en preparació. Veure [pla.md](../pla.md) per a l'estat complet.

El backend del Visor 2030 és una **API REST** construïda amb Symfony 6.4 i API Platform 4 que exposa dades d'indicadors ODS per a municipis catalans.

## Tecnologia

- **Symfony 6.4** — framework PHP
- **API Platform 4** — generació automàtica d'endpoints REST/JSON
- **Doctrine ORM** — mapatge objecte-relacional amb MySQL 8
- **JWT** — autenticació sense estat

## Seccions

- [Estructura de fitxers](./estructura)
- [Instal·lació](./installacio)
- [Model de dades](./model-de-dades)
- [Càlcul i format dels valors](./calcul-indicadors)
- [ETL: importadors de dades](./etl)
- [ETL: serveis auxiliars](./etl-serveis-auxiliars)
- [Com crear un indicador nou](./nou-indicador) ⭐
- [Agrupacions](./agrupacions)
- [Pressupost](./pressupost)
- [ODS sintètics](./ods-sinteticos)
- [Comandes CLI](./cli)
- [API i endpoints](./api)
