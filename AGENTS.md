# Little Spoon project map

## Start here

1. Read `README.md` and the latest `pulse.jsonl` receipts for current state. `pulse.html` is Pat's visual starting point.
2. Read `CONTEXT.md` before changing clinical or project terms.
3. Inspect Git status and the relevant GitHub issue before changing files. The accepted rebuild is settled; future features start when Pat asks.

## Sources of truth

- Code, tests and pinned reference data define implemented behavior. `docs/` holds the source checks and their limits.
- GitHub Issues holds work; `pulse-tickets.json` is a dated, generated snapshot, not a live tracker.
- `pulse.jsonl` is append-only session evidence. Record verified facts and explicitly unknown details. Never rewrite or delete previous receipts.
- `pulse.html` is generated from those receipts and the ticket snapshot. Do not maintain its status by hand.
- `NEXT.md` is historical session material. Preserve it; current work goes into tickets and Pulse, not another NEXT handoff.

## Update Pulse

Use the small repository-local CLI, not a presumed global Tili service:

```text
node scripts/pulse.mjs snapshot
node scripts/pulse.mjs append /absolute/path/to/verified-session.json
node scripts/pulse.mjs render
```

Receipts use the version-1 Tili bootstrap fields. Little Spoon adds `project_state` for the board and optional `deployment` and `git` evidence. The first receipt is a verified closeout of prior work, not invented historical sessions. Put `Pulse-Session: <session_id>` in the corresponding conventional commit. Do not include patient entries, transcripts or secrets.

## Verification and preservation

For calculation changes, check primary sources and run the applicable clinical and browser checks. `npm run build` performs the TypeScript check and emits the offline app. For a Pulse or documentation-only change, validate its data, rendering and links; do not claim a new clinical validation or rebuild an unchanged app just for a status update.

Keep original legacy snapshots, ignored research evidence, review sheets, reference provenance and software licences. Preserve the documented infant-age and AnthroCalc qualifications unless new evidence resolves them. Crystal's successful use and Pat's acceptance do not invent answers to those specific source questions.

## Hosting

The live calculator is `https://little-spoon.patdubois.chatgpt.site`. The latest receipt containing `deployment` has the exact existing Sites identifiers and tested build checksum. Its local source checkout is `artifacts/sites/little-spoon/`; reuse it and its project ID. Only the two validated app HTML files belong in the hosted output. The project board and review sheet are separate. Sites publication requires the Sites skills; keep the existing audience unless Pat requests a change.

GitHub `main` is the settled source. Its workflow runs checks and uploads build evidence; it does not publish the app. Local previews are temporary and are not required by the hosted calculator.
