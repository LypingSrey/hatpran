# HatPran handoff

Project: `/Users/ping/Desktop/hatpran-app` (GitHub: `LypingSrey/hatpran`). Paths below are relative to it.

Last updated 2026-09-26. Read this first in a fresh session, then `README.md` (setup), `frontend/README.md`
(devices, API URL, code layout) and `PRODUCT.md` (what the app is for).

## Where things stand

- **Branch:** `main` at `f04737e` (merge of PR #7). Working tree clean apart from the untracked `.impeccable/`
  folder (design-review notes from the redesign; not committed on purpose, decide whether to keep it).
- **PRs:** #4, #5, #6 and #7 are merged. No open PRs. Their branches (`design/training-log`,
  `feat/records-details-and-paging`, `fix/auth-limits-and-volume`, `fix/keep-session-offline`) still exist locally
  and on GitHub and can be deleted.
- **Checks on `main`:** 170 backend tests passing, Pint clean, `tsc` and `expo lint` clean.

## Run it

| Piece | Command (from) | Port |
|---|---|---|
| PostgreSQL | `docker compose up -d --wait` (`backend/`) | 54320 |
| API | `php artisan serve --host=0.0.0.0 --port=8000` (`backend/`) | 8000 |
| App | `npx expo start` (`frontend/`) | 8081 |

- **Expo Go:** scan the QR from `expo start`, or enter `exp://<mac-ip>:8081` (it was `192.168.10.20`). The phone
  must be on the same Wi-Fi; the app finds the API on the same Mac automatically.
- **Web:** http://localhost:8081
- **Test account:** `test@example.com` / `password` (from the seeder).

## Checks before committing

```bash
cd backend && php artisan test && vendor/bin/pint --test   # tests use a throwaway DB on port 54329
cd frontend && npx tsc --noEmit && npx expo lint
```

CI (`.github/workflows/ci.yml`) runs the same on every push.

## What was done last (PR #7, merged)

1. **Training Log redesign**, Privacy Policy / Terms screens (`src/app/legal/[doc].tsx`), in-app account deletion
   (`DELETE /api/user`).
2. **Motion** (150–300 ms). Shared values live in `frontend/src/lib/motion.ts`: `easeOut` curve, `enter` / `exit` /
   `reflow` layout animations, `pressScale()` for pressables, haptics helpers.
   - `Button` and `Chip` (`src/components/ui.tsx`) shrink to 97% on press; chip fill fades.
   - `SetRow` (`src/components/SetRow.tsx`): rows rise in / fade out / reflow; the up-next ring, done tint and
     input focus outline fade between sets.
   - Workout screen (`src/app/workout/[id].tsx`): progress bar eases; finish note rises in; content is wrapped in
     `LayoutAnimationConfig skipEntering skipExiting`, so rows already there on open don't animate.
   - Tabs and screen transitions stay native on purpose.
3. **Swipe to delete a set:** `ReanimatedSwipeable` in `SetRow` reveals a red Delete button; tapping it deletes
   immediately (optimistic, restored on failure). Long-pressing the set number still asks first.
4. **Set renumbering:** `ExerciseSetController::destroy` renumbers the remaining sets 1..n after a delete; the
   workout screen renumbers its local copy at once.

## Gotchas learned the hard way

- **Always `npx expo install <pkg>`**, never plain npm, so versions match SDK 57. Expo Go ships
  `react-native-reanimated` 4.5.1, `react-native-worklets` 0.10.1 and `react-native-gesture-handler` 2.32.0.
- **"Worklets version mismatch" in Expo Go** means Metro is serving stale code: restart with
  `npx expo start --clear`.
- **Reanimated CSS transitions** (`transitionProperty` etc.) can't go inside `makeStyles` (it's typed as a plain RN
  `StyleSheet`). Put them in a module-level `const` or inline. On an animated `TextInput`, write them inline;
  `as const` arrays fail its types.
- `GestureHandlerRootView` wraps the app in `src/app/_layout.tsx`; gestures silently do nothing without it.
- On web, `confirm()` dialogs use `window.confirm`, which blocks browser automation. Avoid clicking delete buttons
  there when testing with a driven browser.
- Driving the web app with synthetic pointer events needs `pointerId: 1`, `pointerType: 'mouse'`; a background
  Chrome tab throttles timers, so velocity-based gestures can't be tested that way.

## Still to do

- [ ] Replace the placeholder `CONTACT_EMAIL` (`support@hatpran.app`) in `frontend/src/app/legal/[doc].tsx`.
- [ ] Host the privacy policy at a public URL for the App Store / Play Store listings.
- [ ] Device test (from PR #7's test plan): sign up via the terms links, open both legal pages, delete an account;
      swipe feel, scrolling the log doesn't open rows, haptic on delete, set numbers close up after a delete.
- [ ] Optional: delete the four merged branches; decide on `.impeccable/`.
- [ ] Optional: the set tick animation in `SetRow` still uses core `Animated`; could move to Reanimated.

## Resuming in a new session

Start with something like: *"Read HANDOFF.md, then <task>."* Build new work on a branch off `main`, and open a
PR into `main`.
