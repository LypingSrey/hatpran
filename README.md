# HatPran

Workout tracker: log sets, save routines as templates, and get automatic personal records.

| Folder | What | Stack |
| --- | --- | --- |
| [`backend/`](backend) | REST API | Laravel 13, Sanctum, PostgreSQL (SQLite for local dev) |
| [`frontend/`](frontend) | Mobile + web app | React Native, Expo SDK 57, Expo Router |

## Quick start

**API**

```bash
cd backend
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite && php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8000
```

**App**

```bash
cd frontend
npm install
npx expo start   # i = iOS simulator, a = Android emulator, w = web, or scan with Expo Go
```

On a phone, the app automatically talks to the API on the Mac serving the Expo bundle. See [`frontend/README.md`](frontend/README.md).

## Tests

The API test suite runs against PostgreSQL in Docker:

```bash
cd backend
docker compose -f compose.testing.yaml up -d --wait
php artisan test
```
