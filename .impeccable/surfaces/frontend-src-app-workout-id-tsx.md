---
version: 1
slug: "frontend-src-app-workout-id-tsx"
primary_target: "frontend/src/app/workout/[id].tsx"
related_targets: ["frontend/src/app","frontend/src/components"]
---

# Live workout (and the app-wide visual world)

Mode: Operate. Scope: the live workout screen as the primary surface; the same world restyles every screen.

## Brief
- Audience: weightlifters logging a session between sets, at arm's length, in bright or dim gyms.
- Task: log each set, add or change exercises and sets mid-session, finish; review history and records later.
- Owner's words: cleaner, modern, elegant, an easy-to-read font, good spacing. Avoid: crowded, flashy.
- The owner rejected the first build (Training Log, a ruled paper look) as not modern and chose to modernize it toward Apple Fitness and Hevy; a sample was approved before the rebuild.
- Appearance: System, Light or Dark, chosen in Profile; System follows the phone.
- Constraints: Expo Go only (bundled native modules), iPhone and Android equally, 44pt/48dp targets, kilograms only.

## Direction contract

THESIS: The session as a stack of calm rounded cards, one per exercise, with the numbers large and the next action always under the thumb. It refuses both hairline spreadsheets and loud neon gym dashboards.

OWN-WORLD: Grouped surfaces: white cards on #F2F3F7 in light, #15181D cards on near-black #0B0D10 in dark, 22pt radii. One blue accent for actions and the current set; green only for finished sets; gold for records. Filled rounded fields, pill buttons, no gradients or glass. Atkinson Hyperlegible Next throughout, large bold titles, tabular numerals.

STORY: The lifter resumes today's session, sees elapsed time, volume and progress at a glance, logs the circled set, ticks it green, and finishes from a button that never moves.

FIRST VIEWPORT: Back and Edit in the nav bar; the workout name as a large title with date and start time; a summary card with a large elapsed timer, volume, sets done and a green progress bar; the first exercise card with SET / KG / REPS / DONE columns, finished rows tinted green with a green check, the next set's number ringed in blue, filled inputs, an "Add set" tonal pill; Finish workout pinned in a bottom bar. Signature interaction: tapping the tick fills it green with a check (160ms ease-out, light haptic, no scale under Reduce Motion), the row tints green and the blue ring moves to the next set.

FORM: Modernized Training Log, steered by the owner toward the category's polished standard (Apple Fitness, Hevy); seed key d8c09492.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
