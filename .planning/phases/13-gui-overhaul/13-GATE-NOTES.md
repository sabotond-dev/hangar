# Notes to carry into later Phase 13 briefs and the 13-20 gate

- **favicon.svg carries rx="6" / rx="5" and the retired #d6ff4e** (13-03 flagged it as a question).
  Both are settled by rule, not open: D-01/no-radius covers any shape, not only CSS, and D-16
  retired the old accent. Hand to the shell plan (13-07) or 13-18: redraw square, #DCFF71; keep
  identity.spec test 11 ("the favicon is the 9x9 mark") true. 13-20's IDENT-01 row says "the
  favicon's survival" - survival of the mark, not of its corners.
- TagChip disabled chip has no named DisabledReason (13-03) - 13-08.
- TagChip.svelte:136 `<label>` around a hidden checkbox carries a divider border - outside test 5's
  control list - 13-08.
- TryOnDevice.svelte:480 `color: #000000` where --color-on-action exists (13-03 flagged).
- Retired accent as literal tints: TagChip.svelte:127, Knob.svelte:792, Splash.svelte:66 (Splash
  dies at 13-07/13-09; Knob is 13-11's rotary; TagChip 13-08).
- --color-error-surface unused until 13-10.
- Shell link accessible name once HANGAR sits beside FOR ZONA - ledgered for 13-18.
- Transient e2e: first full run at 13-03 lost 5 webkit-phone titles at the tail with
  "Could not connect to server" (install.e2e.ts:2171, tuning-webkit.e2e.ts:295/367/424/497);
  webkit-phone alone 20/20, second full run 108/108.
- 13-01's -1 test offset (plan 890 vs tree 889) carried by 13-02, 13-03, stated never reconciled.
- 13-04 open questions: (a) the pad's dot field - plan said go, scan 8/D-09 say stay, PDF matrix has
  no dots - kept, ask at 13-07/13-09; (b) hero 40px frame bloom (--action-bloom) under section 3 -
  keep or cut, 13-07; (c) session.plugged has no reader - 13-11 or delete; (d) a third string for the
  disabled motion control or the rule stated once - 13-18.
- Splash.svelte:5,318 keeps its own grain (composition half) until 13-07.
- 13-04: SessionAnnouncer's position is gated by session.e2e.ts's live-region read and ESLint only,
  not device-ui.spec.ts - 13-05's footer/shell must keep it in document order.
- docs/TESTING.md still lists old counts - 13-20.
- Transient e2e at 13-04 run 2: nine webkit-phone "Could not connect" at the tail + install.e2e.ts:2074
  + chromium session.e2e.ts:851 (Expected 6 / Received 7) - runs 1 and 3 100/100.
- 13-05: the inspector's 380 floor cannot hold the PDF's 402px 2x2 grid with 26px insets (needs 454;
  438 at 1440). Asserted as a shortfall, floor unchanged. 13-09 decides: raise floor / reflow / narrow
  fields. USER QUESTION.
- 13-05: Device actions footer slot absent until filled; Help & shortcuts disclosure closed by default;
  lower-band collapse/drawer/sheet controls have no Bible labels (13-08/13-18).
- 13-05: e2e harness - Playwright-spawned wrangler died ~28 s in on two runs (empty ProxyController
  error); hand-started wrangler gave 99/100. Ask whether webServer should attach rather than spawn.
- 13-05: STATE metrics table has no P04 row.
- Rail is fixed 224; RAIL_FR recorded only.
- 13-06: term +1/+10 (plan +7). Questions: favorites drop sentence (13-08); rail shows kept 12 or
  PDF's 6; motion key to JSON .v2 for uniformity; starring persists pruned list or keeps dropped ids
  until told. Motion key stays bare "animated|still" with reason in schema.ts.
- 13-06: readJson requires a validator; probe() distinguishes absent/corrupt/refused.
- 13-07: hero resolved to AURORA not ARC (ARC is a Lua entry excluded from the row; would fetch the
  271 KB VM on first paint). Caption "AURORA / SHOW" vs PDF "ARC / MODULATION". USER QUESTION.
- 13-07: Quick guide -> the page's own strip; Import config -> /my-configs/; resume eyebrow case
  change; phone: surface below the words; headline 60px declared vs 62-66 measured.
- 13-07: wrangler 4.128.0 dies mid-run (empty ProxyController error) however started; e2e ran in five
  file chunks on detached servers. Recurring since 13-05. Needs a harness fix (webServer attach or
  wrangler pin) - 13-20 or a quick task.
- 13-07: vite.config.ts crawler ignores 404 at /playground, /sandbox, /my-configs - each landing plan
  removes its own (13-08, 13-13/14, 13-13).
- 13-08 landed d2f38fd/2f109a8: /c/ -> /playground/ done (D-20); FOR_LABELS provisional in
  src/lib/browse/labels.ts (13-18); allowlist 10/23; browse.e2e.ts is twelve titles; Header/Nav wrap
  below 768. Eight questions in 13-COPY-NEW.md; Favorites/Recently used as destinations vs filters
  for 13-13.
- 13-09 landed 2b8173e/68fdc0c/328ae50. Term -11 not -6. RULE-1 FINDING: shell.svelte.ts bridge was
  never reactive - no rail/inspector/connection rendered on a served build since 13-05; fixed.
  DeviceSlot handed into the connection slot provisionally (13-11 replaces). Allowlist 4 rows/7.
  Questions: rail = return set vs membership; install column shown until 13-11 or hidden; six in
  ledger. Coverflow.svelte:520 gone - 12.1-05/08's mapAxis site is the route's ledPoint().
  Research defect: PadSpinner has three consumers, kept.
- 13-10 landed dfa5bbb/2df6767/28485cc. Allowlist 2/2 (DeviceDetails, KeepConfirm - 13-11's).
  Questions: SURPRISE_ALL_HELD wording (13-19); monitor pause freezes vs buffers; timestamp is
  elapsed-since-open; MIDI knob lock button renders though holding changes nothing. midiLogOf reads
  LuaPadSim.host via private field - get midi() for 12.1's owner. TUNE-07 "SURPRISE ME" wording 13-20.
- 13-11 landed f8c1837/96b18a3/7afc6c1. Allowlist 0/0. NOT built (asked): Reset active device page
  under Device actions (D06 vs A-45); Store on ZONA action; D03-D06 as modal dialogs (KeepConfirm
  forbids trapping). Install column shown until 13-12. Six questions in ledger. S0a/S0b control is an
  enabled summary, not disabled.
- 12.1 Band 1 complete at f86711b (+1/+16). Band 2 (06..08) after 13-12-SUMMARY, before 13-14.
  12.1-08: HeroSurface.svelte:137 and playground/[id]/+page.svelte:436 each gain , "y".
  USER QUESTION: GHOST is the one demo-driven card still on x*9//128 - re-fit on Q or keep as the
  uncalibrated example? No Band 2 plan names it. Also: D-16 presets (asked, unanswered), D-04 KEEP once.
- 13-13 landed 6673a01/b0dc77d/d2ba520 (89/921, e2e 79/95). NO ROUTE WRITES A PLAYGROUND DRAFT - the
  banner/Drafts/chip read an empty store honestly; no plan owns the wiring (13-20 or a gap plan).
  Twelve questions ledgered. Workspace route has a duplicate `type Landing` (13-09's) - 13-12/13-20.
  ExportFile gained `rack` (Rule 2). Sandbox thumbnails unlit until 13-15.
- 13-12 landed 53649bc/26320fd/7fcc8e4 (90/928, e2e 80/96). Runbook row I; 12.1-08 takes J and K.
  Snapshot key stays v2 (already per-page since Phase 7) - 12.1-07 takes v3. pageActive() FETCH not
  shipped (firmware has no case). Questions: page numbering 0-3 vs Editor 1-4; unverified's third way
  out; review not modal; Apply duplicates TRY ON DEVICE for one wave; discard control placement.
  BENCH: row I (switch, apply, PUT BACK names page, switch after Apply) - the heartbeat ordering.
- 12.1 gate landed fe92508/777341e/5c256c5. 90/936, e2e 80/96. For 13-20: 13-09's ladder counted
  two tune-ui tests twice (its -11 is -9 by parts; 12.1-01's 906 baseline already held them). Real
  red found: fidelity.e2e.ts:43 from 08b (declared e2e zero, never run) - fixed by the gate.
  Gate holes: decay-idiom blind to D( and K(; a declared e2e zero is not a run; audition table ungated.
  Amendments dated 09-12. Phase 12.1: gate landed, bench pending.
- 13-14 landed e570457/0975651/ceba93e (92/945). FINDING: dearest sixteen = 922 (14 over); cap
  fifteen at those literals; sixteen fits at typed literals 881/896. Third pull-in off by default
  (255/4 holds page-next until 13-17). Research low by ~110 per row. Questions: adjacency
  instruction; schema:1 on Surface; resting phase 48; colour packing. touch-guard.ts shared scanner.
  13-15-PLAN still computes cell as y*9//128 - hand-off says N(x,y).
- 13-15 landed 90424c5/8c7b3fc/5021d24 (93/952). Re-ask did NOT fire: three slots -> every kind
  combination fits (worst 1,370/1,816); two slots -> two kinds. Rotary share 298 (D-08 est 150-200).
  Dead zone 10.13 raw = 0.71 cells; min Knob 3x3. Row L (rotary bench). 13-14's 922 finding CLOSED
  (re-pinned 882 at sixteen). BUILD-04 satisfied, 13-20 ticks. Questions: refusal line wording;
  two coarse knob placements (col 8, rows 7-8); knob start value/reset; per-size steps.
  RULE-2 FINDING: 13-14's Timer was never armed (gtt(0,100) missing) - fixed.
- 13-16 landed 8fdb7b5/7cc1d94/445c185/02f275f (94/958, e2e 82/98). SLOTS=2 in the sandbox route
  and preview.ts refuses slots:3 - 13-17 flips both. Draft wiring can serve Playground drafts (one
  write/read fn with PlaygroundRecord) - still unwired (13-13 q5). Sandbox thumbnails can light via
  preview.ts, table not wired. Six questions ledgered. [draftId]: prerender false, 404 fallback.
- 13-17 landed 6e4f13b/6599c9f/cbac25d/a0b787a (94/961, e2e 83/99). Five strings on the wire:
  255/6, 255/0, 255/4, 0/6, 0/0; snapshot v4. Runbook A-M. USER QUESTION 1: a TRY of a Lua entry
  writes page-next into 255/4 (harmless, same as default) - OK? Also: "the utility script" wording;
  Store/PUT BACK placement; over line naming the last element; copy opens fresh surface.
  13-18 finds install-copy.ts at five and SNAPSHOTTING_BODY/identifiedBody at three.
- 13-18 landed 24a3c30/bc239fc (94/961, +0/+0). Pages numbered from one. Hand-off to 13-20 by
  batch row: J.13 (install column removal - eighteen e2e titles click its primary), I.6.5 (reset's
  s16 confirmation, A-45 retired), I.3.12, I.8.1-7 (transport.ts wording), E.14, E.15, F.4, G.31,
  G.34, G.36, H.20, H.21, J.1, J.19, J.23, J.25, J.30, J.40. Hand-off to 13-19: tune/copy.ts, 27
  names, F.1, F.11, F.17, J.10.
- 13-19 landed 82d710d/7df9d5d/7f22c00 (94/961 +0/+0). Eighteen names re-cased (eight presets
  already sentence case); 65 literals / 24 files; ids proved unmoved (twelve reds on an id re-case).
  J.10 (?feels= codec) handed to 13-20. Three requirement rows: TUNE-07, SHARE-02, TUNE-06.
  Questions: SURPRISE_ALL_HELD second sentence; "setting" vs "parameter"; Snapshot link vs Shareable
  link; lock 52px; ~90 prose/test-title lines still reading EUCLID.
