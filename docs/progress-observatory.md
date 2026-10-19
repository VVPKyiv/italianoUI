# Progress observatory · 18 October 2026

The overview now combines a practice elixir, an interactive daily activity pulse,
a reading shelf and a constellation of six evidence-based milestones. Existing
skills, delayed-review history, topic results and recommendations are retained.

## Boundaries and semantics

- `features/progress/progressVisuals.ts` derives presentation state from the
  existing progress and curriculum API contracts; React components render it.
  Components do not fetch or write learning records. No new dependencies.
- The elixir now uses **daily practice**, shared with the global floating
  companion. It resets on a new Kyiv learning date. Lifetime words in practice
  remain a separate count. See `daily-companion.md` for domain rules, API,
  lifecycle and validation. The earlier 25/50/100-word filling scheme was removed.
- Milestone thresholds are UI presentation policy, not authored lesson content
  or learning rules. They do not award DB achievements, XP, CEFR levels or
  change the backend's evidence criteria. Badges are calculated from current
  records, without invented award dates or “just unlocked” notifications.
- Independent and delayed-confirmation badges require recall evidence
  (`spoken_recall` / `written_recall`) or the corresponding curriculum result.
  Recognition is insufficient. Word counts from different modes are never
  added because the same word can appear in both.
- The rhythm badge uses the **longest** streak, so ending a current streak
  does not remove that milestone. Missing curriculum data stays unknown.
- The pulse uses real daily attempts/minutes across the API's 30-day window.
  Zero days remain zero. Only positive local maxima glow. Accuracy is weighted
  by answers; no answers displays a dash. Lines connect daily observations;
  no smoothing or synthetic points. The shelf represents the first ten unique
  reading completions, with exact completed/catalogue counts shown separately.

## Interaction and accessibility

- Hover or tap to select a chart day; arrows, Home and End work on the slider.
  Large previous/next buttons and an expandable data table provide alternatives.
- Answer/minute modes use the same dates. Selected-date details expose the actual
  daily data. Axis dates remain HTML text instead of shrinking inside SVG.
- Achievement buttons expose achieved/locked status and reveal their conditions.
- Effects switch stops waves, bubbles, orbit, peaks and spark animation.
  `prefers-reduced-motion` also disables those animations and transitions.
  Preference is local to the page visit. Decorative SVG is hidden from AT.
- Existing Inter typography tokens apply; headings are 24/22 px desktop/mobile.

## Verification

- `npm run test:progress`: eight tests for unknown course data, recognition/
  recall separation, delayed confirmation, duplicate word modes, historical
  streaks, weighted activity accuracy, celebration gating and drag bounds.
- `npm run build` and `git diff --check` pass. Vite reports the existing main
  bundle size warning; no charting or animation package was added.
- Browser at 1280 and 390 CSS px: no document overflow; chart mode, day
  selection, keyboard Home/End/arrows, achievement conditions, motion switch,
  history and skills tabs verified. Mobile data table expands without page
  overflow. No browser console errors. No training attempts were created.
