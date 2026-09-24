# HatPran

Workout tracker: log sets, save routines as templates, and get automatic personal records.

| Folder | What | Stack |
| --- | --- | --- |
| [`backend/`](backend) | REST API | Laravel 13, Sanctum, PostgreSQL |
| [`frontend/`](frontend) | Mobile + web app | React Native, Expo SDK 57, Expo Router |

## Quick start

**API**

```bash
cd backend
composer install
cp .env.example .env && php artisan key:generate
# set DB_PASSWORD in .env to any value, then start PostgreSQL (data persists in a Docker volume):
docker compose up -d --wait
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8000
```

The development database is PostgreSQL 17 on `127.0.0.1:54320` (database/user `hatpran`, password from `.env`),
so any SQL client can connect with `postgresql://hatpran:<DB_PASSWORD>@127.0.0.1:54320/hatpran`.

**App**

```bash
cd frontend
npm install
npx expo start   # i = iOS simulator, a = Android emulator, w = web, or scan with Expo Go
```

On a phone, the app automatically talks to the API on the Mac serving the Expo bundle. See [`frontend/README.md`](frontend/README.md).

## Tests

The API test suite runs against a separate, throwaway PostgreSQL container (port 54329) so it never touches your dev data:

```bash
cd backend
docker compose -f compose.testing.yaml up -d --wait
php artisan test
```
