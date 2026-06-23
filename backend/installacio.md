# Instal·lació

## Requisits

| Eina | Versió mínima |
|------|---------------|
| PHP | 8.2 |
| Composer | 2.x |
| Symfony CLI | qualsevol versió recent |
| MySQL | 8.0 |

## Passos

### 1. Clonar el repositori

```bash
git clone git@github.com:OneTandem/visor2030-backend.git
cd visor2030-backend
```

### 2. Instal·lar dependències PHP

```bash
composer install
```

### 3. Configurar les variables d'entorn

Copia el fitxer d'exemple i edita'l:

```bash
cp .env .env.local
```

Variables mínimes a configurar a `.env.local`:

```dotenv
DATABASE_URL="mysql://usuari:contrasenya@127.0.0.1:3306/visor2030?serverVersion=8.0.22&charset=utf8mb4"
CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$'
JWT_PASSPHRASE=una-frase-de-pas-segura
```

### 4. Generar les claus JWT

```bash
php bin/console lexik:jwt:generate-keypair
```

Això crea `config/jwt/private.pem` i `config/jwt/public.pem`. Aquests fitxers **no s'han de cometre al repositori**.

### 5. Crear la base de dades i executar migracions

```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

### 6. Carregar dades inicials

```bash
php bin/console app:load-initial-data
```

Aquesta comanda carrega les dades geogràfiques bàsiques: municipis, comarques, províncies i agrupacions territorials. Requereix connexió a internet (crida a l'API d'IDESCAT).

::: warning Dades específiques de la Diputació de Barcelona
Per defecte, la comanda carrega els municipis de la **província de Barcelona** (codi INE `08`). Si adapteu el projecte per a un altre territori, haureu de modificar el filtre de província als serveis de càrrega de dades a `src/Service/`.
:::

La comanda accepta flags per carregar només una part de les dades. Vegeu la referència completa a la secció [Comandes CLI → app:load-initial-data](./cli#app-load-initial-data).

### 7. Iniciar el servidor de desenvolupament

```bash
symfony server:start
```

L'API estarà disponible a `https://localhost:8000/api`.

## Entorn de test

Crea un `.env.test.local` amb una base de dades diferent (el sistema afegeix el sufix `_test` automàticament per convenció de Symfony):

```dotenv
DATABASE_URL="mysql://usuari:contrasenya@127.0.0.1:3306/visor2030_test?serverVersion=8.0.22&charset=utf8mb4"
```

Executa els tests:

```bash
php bin/phpunit
php bin/phpunit tests/Unit/ServerInfoTest.php         # fitxer concret
php bin/phpunit --filter testMethods                  # mètode concret
```

## Eines de qualitat de codi

```bash
vendor/bin/php-cs-fixer fix    # aplica les regles de format (veure .php-cs-fixer.dist.php)
```
