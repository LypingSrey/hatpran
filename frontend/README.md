# HatPran frontend

React Native (Expo SDK 57 + Expo Router) app for the HatPran workout API in `~/Desktop/HatPran`.

## Run it

1. Start the Laravel API (from `~/Desktop/HatPran`), listening on all interfaces so phones/emulators can reach it:

   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```

2. Start the app (from this folder):

   ```bash
   npm install        # first time only
   npx expo start
   ```

   Then press `i` (iOS simulator), `a` (Android emulator), or `w` (web), or scan the QR code with Expo Go.

## Pointing at the API

On a phone running Expo Go, the app automatically calls the API on the same Mac that serves the
Expo bundle (`http://<mac-ip>:8000/api`), so the Laravel server must be started with `--host=0.0.0.0`.
The iOS simulator and web use `http://127.0.0.1:8000/api`; the Android emulator uses `http://10.0.2.2:8000/api`.

To force a specific server, set `EXPO_PUBLIC_API_URL`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:8000/api npx expo start
```

The login and Profile screens show which server the app is using.

## Checks

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint
```

## Structure

- `src/app/` — screens (Expo Router). `(tabs)/` holds Workouts, Templates, Exercises, Records, Profile; `workout/`, `template/`, `exercise/` hold detail and create screens.
- `src/lib/` — API client (`api.ts`), auth/session (`auth.tsx`, token in SecureStore; localStorage on web), types, formatting.
- `src/components/` — shared UI, the set-logging row, and the exercise picker.
