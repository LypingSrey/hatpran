# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

HatPran ships on iPhone and Android with equal priority, using one shared HatPran look on both rather than a
different design language per OS. Each OS's native expectations (navigation and back gestures, safe areas, system
controls, accessibility settings) still apply. The web build exists but is secondary.

## Users

People who mainly lift weights. They use HatPran during a training session to track the workout as it happens:
logging each set between lifts, and adding or changing exercises, sets and values at any point mid-session.

## Product Purpose

HatPran is a workout tracker for weightlifters. It lets them record a session as they train, reuse routines as
templates, and see their personal records kept up to date without extra work. Success is a lifter finishing a
session with every set logged accurately and nothing about the app having slowed them down.

## Positioning

Simple, clean and user-friendly, with nothing messy. HatPran competes on staying out of the way during a session,
not on the number of features.

## Operating Context

- Used on a phone at the gym, in the gaps between sets, while a workout is in progress.
- A session starts empty or from a template, sets are ticked off as they are done, and the workout is finished at
  the end. Finished workouts stay editable afterwards (name, notes, date, start time, duration and sets).

## Capabilities and Constraints

- **Workouts:** live timer, volume and set count; set types normal, warmup, drop and failure. Each exercise type
  asks for the right measurements: weight and reps, reps only, weighted or assisted bodyweight, duration, distance
  and duration, or weight and distance.
- **Editing mid-session:** exercises, sets and values can be added or changed while lifting. This is a core
  requirement, not an extra.
- **Templates:** saved routines with target sets and reps, started in one tap; usage is tracked.
- **Exercise library:** 74 built-in exercises across 17 muscle groups and 20 kinds of equipment, plus the user's own
  custom exercises.
- **Personal records:** heaviest weight, most reps, best set volume, longest duration and longest distance per
  exercise, detected automatically when a workout is finished and rebuilt when history is edited. Warmups and
  unticked sets never count. Past bests can be entered by hand.
- **Profile:** profile picture, lifetime stats, recent workouts and records, and account editing.
- **Units:** weights are kilograms only.
- **Stack:** Expo (SDK 57) / React Native app with Expo Router in `frontend/`, Laravel REST API with PostgreSQL in
  `backend/`. The app must keep running in Expo Go, so only native modules bundled with Expo Go can be used.
- **Undecided:** whether to support languages other than English (such as Khmer), and what role the web build
  should play beyond being a secondary option.

## Brand Commitments

- The product name is **HatPran**.
- Simple, clean, user-friendly and uncluttered is a binding commitment from the owner.
- The owner wants it to feel modern and polished in the vein of Apple Fitness and Hevy (grouped rounded surfaces,
  bold numbers, dark-first). A paper-log look was tried and rejected as not modern.
- Appearance is the user's choice in Profile: System, Light or Dark.

## Evidence on Hand

- Feature list and setup: `README.md`, `backend/README.md`, `frontend/README.md`.
- Exercise library data: `backend/database/seeders/`.
- No real users, testimonials, usage numbers, reviews or press exist. Do not invent any.

## Product Principles

1. **The session comes first.** Every design decision is judged by whether it helps someone logging a set between
   lifts.
2. **Anything can change mid-workout.** Adding, editing and reordering during a session must be as easy as logging.
3. **Clean over complete.** When a screen gets busy, remove or hide before adding. Nothing messy.
