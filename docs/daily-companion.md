# Daily practice companion · 18 October 2026

The elixir now represents today's learning, and a small draggable companion is
mounted once outside the route tree. It appears over lessons, practice, reading,
vocabulary and progress, including session routes. The progress hero and the
companion share one query and one SVG vessel. Lifetime vocabulary counts remain
available separately in the skills view.

## Domain and API

`italianoApp/src/analytics/domain/daily_goal.py` defines two explicit target
policies over the same activity projection. The useful-day minimum remains five
answers OR three sentence attempts OR one reading completion OR 300 recorded
seconds. The **elixir goal** is twenty answers OR eight sentence attempts OR
three reading completions OR 900 seconds in completed sessions. A reading
completion can be a reread; it is not a count of unique texts. This is a habit
indicator, not mastery or correctness. Alternatives use the maximum fraction,
not a sum of overlapping activities. The fraction caps at one, while raw counts
continue increasing. UI reads target values from the API. `day_qualified` is a
separate response field: a streak can be maintained with a partially full elixir.

For the reported 9 answers, 3 sentences and 3 recorded minutes, the fractions
are 45%, 37.5%, 0%, and 20%. The elixir is 45%; the useful-day minimum is met.

`GET /api/v1/progress/daily-goal` uses the injected clock and existing profile-
scoped activity repository. It queries only since Kyiv midnight and returns
`date`, `timezone`, `generated_at`, `resets_at`, `fraction`, `complete`,
`day_qualified`, `criteria`.
No migration or new learning records are needed: persisted learning events are
already the source of truth. The next midnight is calculated as a local calendar
boundary, including daylight-saving transitions. There is no daily reset write;
a new date selects a new day's existing events.

## UI lifecycle

`DailyPracticeProvider` owns the profile-keyed query. A successful write through
our API client emits a profile-tagged invalidation signal; this also covers
speech calls that do not use React Query mutations. The provider coalesces writes,
refreshes on navigation/window focus, checks other-device changes every minute
while visible, and schedules a refresh for the server's next midnight. Browser
clock/timezone cannot select the learning date. Errors display unknown state,
not a fabricated zero or stale full vessel.

The portal survives route changes. It supports dragging by the grip, keyboard
arrows, resize bounds, fold/unfold, details and quiet mode. Fold/quiet preferences
are local to each learner profile; position lasts for the current visit. It stays
below the navigation/modal layer. A completed elixir glows for that day; a short
celebration runs only on an observed incomplete→complete transition for the same
date/profile. Opening an already-completed day does not pretend to unlock it.
The next day starts a new elixir; historical activity remains in progress.

Reduced-motion and quiet mode stop continuous animation. The details panel is
nonmodal, has a close button and Escape support, and fits within mobile viewport.

## Validation

- 643 backend unit tests passed, including separate elixir/streak policies,
  all four alternatives, the reported 45% case and API status, partial progress,
  non-additivity, saturation, Kyiv rollover, winter time and no carry-over.
- Ruff for analytics and new tests; Mypy for 13 analytics source files passed.
- Eight UI model tests: existing evidence safeguards, honest accuracy,
  celebration gating and reachable drag bounds. Production build passes.
- Browser: 40%→100% celebrates once; navigation retains state; a new server day
  resets both hero/companion; folded state persists across routes; arrows move
  the widget; quiet mode stops waves. Mobile details at 390 CSS px fit without
  document overflow. These state transitions use an isolated read-only fixture,
  which rejects writes and does not insert practice in the user's profile.
- Loss of fixture API connectivity displays an unknown value and a retry action.
- Working app additionally verified with actual daily data. No QA learning
  records were added.
