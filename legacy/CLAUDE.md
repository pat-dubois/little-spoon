# Little Spoon — project instructions

Read `NEXT.md` first for current state. Read `docs/legacy-audit.md` before touching any formula.

## Hard rules for this app

- **No patient data ever persists.** No localStorage, cookies, IndexedDB, analytics, or server calls carrying inputs. The app lives on hospital devices. This is the whole point.
- **No network at runtime.** Fonts, data tables, and code ship with the app. It must work offline once loaded.
- **Formulas come from cited primary sources** (Health Canada, WHO, IOM). Every constant in code links to a source and has a test. Never type reference values from memory.
- **Never commit `_private/`.** It holds transcripts of Pat and Crystal.
- `legacy/` is read-only reference.

## Design

Use the taste skills in `.claude/skills/` when designing or building UI. Brand rules in `docs/brand/`. The app must work one-handed on a phone and be readable on a hospital desktop. Minimum 44 px touch targets, no `user-scalable=no`, honour `prefers-reduced-motion`.

## Working style

Pat is not a developer. Run everything yourself, verify in the browser, and report what passed and what is unverified. Keep `NEXT.md` current at the end of every session.
