# Phase 13 — the copy ledger (emptied 2026-09-12 by plan 13-18)

Created 2026-09-11 by plan 13-01 as the queue every wave appended its invented strings and its
questions to. **Emptied by 13-18 task 02 on 2026-09-12**: the whole queue — 153 rows across twelve
tables and 70 questions — was put to the user in one batch, `13-18-BATCH.md` (262 rows, seven columns,
every proposal with the state it names and the fact it must carry), and the user answered
**"approve"** — recorded as **13-CONTEXT.md D-23**: every proposal as written, every section-J answer
as proposed, the six transfer-uncertainty lines kept six, pages numbered from one.

The batch is the record now. This file keeps only the register (below, unchanged) and the account
of where each row went.

## The register (D-05), in full

The Bible's copy — the PDF's five screens and §16's eleven rows — is the reference for tone and vibe.
Every string written for HANGAR from this phase on follows it:

- **Sentence case, short, second person.** _Make ZONA your own._ _Find a gesture you love. Build a
  surface that works the way you do._ _Pick up where you left off._
- **Names the action and its result together.** _Applied to Page 2. Store on ZONA to keep it after
  power-off._ _Discover configurations. Try one. Make it yours._
- **Plain about state, never coy.** _Preview only. Connect ZONA when you're ready._ _Changes not
  applied._ _Stored on ZONA · Page 2._ _The device stopped responding. Your draft is safe; device state
  could not be verified._
- **Reassuring where the stakes are real, in one clause.** _Reset Page 2 to its firmware default? Your
  browser draft will remain available._
- **Uppercase only for short section labels and breadcrumbs** — `PLAYGROUND / CONFIGURATIONS`,
  `YOUR LIBRARY`, `SELECTED ELEMENT / FADER` — never for sentences, headlines or instructions.
  Headlines are large, sentence-case and warm; the eyebrow above them is the small uppercase line.
- **Verbs on buttons, plainly:** _Explore_, _Apply to ZONA_, _Save copy_, _Share snapshot_, _Resume
  draft_, _New surface_, _Connect ZONA_.
- **Non-negotiables that carry over regardless of tone:** real apostrophes (_you're_, _you've_), never
  a straight-quote contraction; no exclamation marks; no emoji; no uppercase paragraphs. The three copy
  specs' other rules — no "Error", no browser engine named, no control label paraphrased in prose —
  carry over too.

The **facts** Phase 10's strings carried survive in the new words: RAM versus flash, the snapshot, the
firmware default, the promise that nothing writes without a click — and a fifth from Phase 12.1, that a
store carries the page's own scripts. Phase 10's measured-length honesty caps (`HONESTY_CAP`,
`PUT_BACK_CAP`, `KEEP_CAP`, `CLEAR_CAP`) are **retired by name** in `install-copy.ts`'s header and
`install-copy.spec.ts` test 3 (13-18, 2026-09-12).

## Where every row went

The batch's section letters are the index; each row's number is in `13-18-BATCH.md`.

| Batch section | Rows | Landed by 13-18 task 02 (module, export) | Answered "keep" — already shipped as approved | Handed on |
| --- | --- | --- | --- | --- |
| D intro | D.1–D.5 | `src/lib/ui/intro/card.ts` `RESUME_EYEBROW` = `CONTINUE EDITING` (D.4, the PDF's page-4 eyebrow) | D.1, D.2, D.3, D.5 | — |
| E gallery | E.1–E.16 | — | E.1–E.13 (`FOR_LABELS` as shipped; the chip-versus-rail question answered no), E.16 (no sentence) | **13-20**: E.14 (the PDF's `36 configurations` while nothing narrows the grid), E.15 (the two empty-view lines) — `BrowseToolbar.svelte`, `src/routes/playground/+page.svelte` |
| F workspace | F.1–F.19 | **13-19 (2026-09-12)**: F.11 (`LINK_COPIED` = `Link copied`, `src/lib/tune/copy.ts`), F.17 (`monitorCount` = `×{n}`, `src/lib/tune/inspector-copy.ts`); F.1 answered by silence — one constant stands, no per-entry headline written | F.2, F.3, F.5–F.10, F.12–F.16, F.18, F.19 | **13-20**: F.4 (`UNKNOWN_NOTICE` → `There’s no configuration at this address. Pick one from the list.`, `src/routes/playground/[id]/+page.svelte`) |
| G Sandbox | G.1–G.48 | — | every row but three | **13-20**: G.31 and G.36 (`the most a page holds` in `DUPLICATE_AT_CAP` and `GEOMETRY_COPY.cap`), G.34 (the unreachable two-slot `overLine` — delete or keep is 13-19/13-20's) |
| H My configs | H.1–H.34 | — | every row but two | **13-20**: H.20 (`This surface has {count} elements, and a page holds at most 16.`), H.21 (`{region} doesn’t fit on the 9 × 9 surface.`) — `src/lib/store/transfer.ts` |
| I.1 footer | I.1.1–I.1.5 | — | all five | — |
| I.2 connecting | I.2.1–I.2.31 | `session-copy.ts`: `CONNECT_LABEL` (the PDF's), `CONNECTED_LABEL` (new, §9), `PREVIEW_ONLY_LABEL` (new, §9, the three no-device summaries), `NO_ZONA_LABEL` retired, `CONNECTING_LABEL`, `DISCONNECT_LABEL`, `FORGET_LABEL`, `CAPTION_UNPLUGGED` (§9), `HIDDEN_NAME_IDLE` (§16), `TWO_STEP`, `PERMISSION_DECLINED`, `SAFE_NOTE`, `REPLUG_OFFER`, `REVOKE_EXPLANATION`, `SNAPSHOT_DURABLE_LINE`, `SNAPSHOT_SESSION_LINE`, `UNPLUGGED_WHILE_CONNECTED`, `UNPLUGGED_WHILE_WRITING`, `silentBlock` step, `pageName`, `identitySentence`, `identityDescription`, `liveConnected`; `DeviceSlot.svelte` (the header's S1/S4 labels, the identity moved to Device actions, sentence case) | I.2.6, I.2.7, I.2.11, I.2.17, I.2.20–I.2.22, I.2.25, I.2.27–I.2.31 | — |
| I.3 page target, Put back | I.3.1–I.3.12 | `page-target.ts` `pageName` (from one), `install-copy.ts` `pageName`, `session-copy.ts` `pageName`; `PUT_BACK_LABEL`, `puttingBackLabel`, `PUT_BACK_NEEDS_ZONA`; `PUT_BACK_LINE` / `PUT_BACK_LINE_AFTER_KEEP` retired (`PutBack.svelte`) | I.3.4, I.3.6–I.3.11 | **13-20**: I.3.12 (`port-busy`'s second culprit and its step, `src/lib/transport/transport.ts`; the bench reproduces the raw message first) |
| I.4 the states | I.4.1–I.4.20 | `install-copy.ts`: `HONESTY_NO_SESSION`, `honestyReady`, `HONESTY_SNAPSHOTTING`, `HONESTY_INCAPABLE`, `SNAPSHOTTING_CAPTION`, `snapshottingBody`, `IDENTIFIED_CAPTION` (§9), `identifiedBody`, `writingLabel` / `keepingLabel` (§9), `STILL_WRITING_LINE`, `settledCaption` (§16), `settledBody`, `keptCaption` (§16), `keptBody`, `restoredCaption`, `restoredBody`, `RESTORED_STORED_LINE`, `clearedCaption`, `clearedBody`, `confirmCaption`, `NOT_NOW_LABEL`, `clearingLabel` | I.4.12 | — |
| I.5 the six, the lost cable | I.5.1–I.5.12 | `install-copy.ts`: the seven titles, `keptMismatchBlock`, `unconfirmedBlock`, `partialBlock`, `nothingLandedBlock`, `restoredUnconfirmedBlock`, `snapshotFailedBlock`, `lostBlock`, `STEP_OR_PUT_BACK`, `confirmReplaces`, `CONFIRM_WAY_BACK` | I.5.4 (the four pairs, "the utility script"), I.5.11 | — |
| I.6 the controls' lines | I.6.1–I.6.5 | `install-copy.ts`: `keepLineEnabled`, `KEEP_REASONS` (six reworded, the union kept), `clearLine`, `CLEAR_REASONS` (the union kept) | I.6.4 | **13-20**: I.6.5 (the reset's §16 confirmation under Device actions, A-45 retired by name in `device-ui.spec.ts` test 13 — the control's move is the column's move, J.13) |
| I.7 live region | I.7.1–I.7.5 | `install-copy.ts`: `liveSnapshotSaved`, `liveSettled` (§16), `liveRestored`, `liveKept` (§16), `liveCleared` | — | — |
| I.8 open failures | I.8.1–I.8.7 | — | the details and steps as shipped | **13-20**: the title and wording changes of I.8.1, I.8.2, I.8.3, I.8.5, I.8.6, I.8.7 in `src/lib/transport/transport.ts` (outside this plan's files; `transport.spec.ts` holds them) |
| J questions | J.1–J.43 | J.43 (one constant) | J.2–J.9, J.11, J.12, J.14–J.18, J.20–J.22, J.24, J.26–J.29, J.31–J.39, J.41, J.42 — accepted as shipped | **13-20**: J.10 (retire `?feels=`, keep the `?tag=` mapping — a codec change in `query.ts` whose `feels` field ten files read, outside 13-19's files and its `+0 / +0` term; the batch offered "13-19 or 13-20" and 13-19 hands it on, 13-19-SUMMARY.md); J.1 (the favicon, square, `#dcff71`), J.13 (the install column's duplicate `Apply to ZONA` and the column's move under Device actions — see 13-18-SUMMARY.md, deviation 1), J.19 (the Playground draft on a knob turn and `?draft=` on arrival), J.23 (the one-shot view handoff to the gallery), J.25 (a static paint for the sandbox thumbnail), J.30 (refuse a duplicate collection name; the string `A collection called {name} already exists.`), J.40 (substitute the snapshot's own utility for a landing's empty 255/4 — one line in `install.svelte.ts` `#pageUtility`, with `install.spec.ts`'s default-utility assertions re-pinned) |

**Handed to 13-19 in full, and landed 2026-09-12 (13-19-SUMMARY.md):** `src/lib/tune/copy.ts`
rewritten in the register (56 value exports → 48: the mix family's five deleted by name, the three
Phase 10 labels whose Bible lines are `inspector-copy.ts`'s retired, `tryOnBudgetReason`'s
`HONESTY_CAP` comment and the other measured caps retired by name); the catalog names re-cased
(twenty-six, not twenty-seven: the eight preset names were already sentence case and the eighteen
hand-authored ones moved), the `quiet` lines and descriptions kept in their roles; F.1 (one
constant stands), F.11 and F.17 landed; J.10 handed to 13-20 (above). Nothing else in this ledger
is 13-19's.

**Handed to 13-20 (the closing plan):** the rows marked above — every one a decided string or a decided
shape, none a question.
