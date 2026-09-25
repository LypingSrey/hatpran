# HatPran API

The Laravel 13 REST API behind the HatPran app. It handles accounts, workouts, sets, templates, the exercise
library and personal records. Setup steps are in the [main README](../README.md#getting-started).

## Conventions

- Every route is under `/api` and speaks JSON. Send `Accept: application/json`.
- Sign in with `POST /api/register` or `POST /api/login` to get a token, then send it as
  `Authorization: Bearer <token>` on every other request. Tokens come from Laravel Sanctum.
- Lists are paginated: `?page=2&per_page=50` (up to 100). The response has `data` and `meta.last_page`.
- `401` means a missing or invalid token, `403` means the item belongs to another user, and `422` returns
  validation messages in `errors`, keyed by field.

## Endpoints

### Account and profile

| Method | Path | Does |
| --- | --- | --- |
| POST | `/register` | Create an account and return a token |
| POST | `/login` | Return a token for an email and password |
| POST | `/logout` | Revoke the current token |
| GET | `/user` | The signed-in user, including `avatar_url` |
| PUT | `/user` | Change name and email. A new email needs `current_password`. Limited to 6 per minute |
| PUT | `/user/password` | Change password. Signs out every other device. Limited to 6 per minute |
| POST | `/user/avatar` | Upload a profile picture (`avatar`: JPEG, PNG or WebP, up to 5 MB). Limited to 10 per minute |
| DELETE | `/user/avatar` | Remove the profile picture |
| GET | `/user/stats` | Lifetime totals: workouts, duration, sets, volume, records |

### Workouts and sets

| Method | Path | Does |
| --- | --- | --- |
| GET | `/workouts` | Your workouts, newest first. Filter with `?completed=1` or `?in_progress=1` |
| POST | `/workouts` | Start a workout, optionally with exercises and blank sets |
| GET | `/workouts/{id}` | A workout with its exercises, sets and totals |
| PUT | `/workouts/{id}` | Change name, notes, `started_at` or `completed_at`. Moving a finished workout keeps its duration |
| POST | `/workouts/{id}/complete` | Finish a workout and return any new personal records |
| DELETE | `/workouts/{id}` | Delete a workout and rebuild the affected records |
| GET | `/workout-exercises/{id}/sets` | Sets for one exercise in a workout |
| POST | `/workout-exercises/{id}/sets` | Add a set |
| GET / PUT / DELETE | `/sets/{id}` | Read, change or delete a set |
| POST | `/sets/{id}/complete` | Tick a set as done |

### Templates

| Method | Path | Does |
| --- | --- | --- |
| GET / POST | `/workout-templates` | List or create templates |
| GET / PUT / DELETE | `/workout-templates/{id}` | Read, change or delete a template |
| POST | `/workout-templates/{id}/start` | Start a workout from a template |

### Exercise library

| Method | Path | Does |
| --- | --- | --- |
| GET | `/exercises` | Built-in and your custom exercises. Filter with `search`, `muscle_group_id`, `equipment_id`, `custom_only` |
| POST | `/exercises` | Create a custom exercise |
| GET / PUT / DELETE | `/exercises/{id}` | Read, or change and delete your own custom exercise |
| GET | `/muscle-groups`, `/equipment` | Reference lists, plus `/{id}` for one item |

### Personal records

| Method | Path | Does |
| --- | --- | --- |
| GET | `/personal-records` | Your records, most recent first. Filter with `exercise_id`, `record_type` |
| GET | `/personal-records/{id}` | One record |
| GET | `/exercises/{id}/personal-records` | Your records for one exercise |
| GET / POST | `/manual-records` | List or add bests entered by hand. Filter the list with `exercise_id` |
| GET / PUT / DELETE | `/manual-records/{id}` | Read, change or delete a manual entry |

Run `php artisan route:list --path=api` for the full list with parameters.

## How personal records work

Each exercise type tracks certain records: for example, weight and reps exercises track heaviest weight, most reps
and best set volume, while duration exercises track longest duration.

- Only ticked sets in finished workouts count. Warmup sets never do.
- Finishing a workout saves any records it beats and returns them, so the app can celebrate.
- Editing, adding or deleting a set in a finished workout, or deleting or moving the workout, rebuilds that
  exercise's records from its full history.
- Manual entries (`/manual-records`) are bests the user typed in. They live in their own table, so rebuilding
  never erases them, and they compete with logged sets: the higher value wins, and on a tie the earlier one does.
  Each record's `source` says whether it came from a `workout` or a `manual` entry.

The logic is in `App\Models\PersonalRecord::recalculate()` and `App\Models\Workout::recordPersonalRecords()`.

## Database

- **Development:** PostgreSQL 17 in Docker (`compose.yaml`) on `127.0.0.1:54320`. Data persists in the
  `hatpran-pgsql` volume, and only `docker compose down -v` deletes it.
- **Tests:** a separate container (`compose.testing.yaml`) on port 54329 that is wiped on every run.
  `phpunit.xml` points tests there, so they never touch development data.
- **Profile pictures:** stored on the `public` disk under `storage/app/public/avatars`. Run
  `php artisan storage:link` once so they can be served.

## Tests

```bash
docker compose -f compose.testing.yaml up -d --wait
php artisan test
vendor/bin/pint --test   # code style
```

Feature tests live in `tests/Feature/Api`, one file per controller.
