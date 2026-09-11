# The ZONA device session run

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

This is the hardware checklist for Phase 6: the site-wide device session. It connects, identifies,
survives navigation, notices the cable, names every failure and can give the permission back.
**Nothing in this phase writes to a module.** There is no install, no write and no store anywhere on
the site today; every frame HANGAR sends is a read or a heartbeat, and the session's own suite
asserts zero writes in node and in a browser. Installing is Phase 7's and has its own runbook when it
arrives.

Web Serial cannot be automated — there is no CDP domain and no fake-device hook — so this is a
checklist for a person, not an assertion a test suite can make. Everything the machine can prove is
already green before you start: 724 unit tests, 13 sweep tests, 77 end-to-end tests across two
browsers against the production build (a scripted `navigator.serial` walks every one of the nine
named states, including the replug that hands back a different port object), a clean `svelte-check`
and a production build. What none of that can prove is that a real browser and a real cable behave
the way the scripted serial was written to behave. The scripted serial is modelled on a source
reading of the browser, so it can only show HANGAR is consistent with that reading. Six things need a
person, and each row below says why.

One of the six closes a hole Phase 2 left open. `docs/SKELETON-RUNBOOK.md` row 0 — the port-conflict
message — was never exercised, because the operator had no Grid Editor running that night.
`docs/SKELETON-RESULTS.md` names it as still open and says Phase 6 owns the failure vocabulary and
should close it. Row C is that closure.

## Before you start

1. **Quit Grid Editor completely** — its tray icon, then Quit, not just closing the window. Only one
   program can hold a serial port, and Grid Editor takes it back from the tray. The one exception is
   row C, which needs it running on purpose.
2. **Any configuration on the ZONA is fine.** Nothing here writes, so the module comes out of this
   run exactly as it went in, whatever it carries.
3. **Have a second Grid module for row D** — any type other than ZONA. Two rows want it: once beside
   the ZONA, once alone on the cable. If you have none, row D is the one row to skip.
4. **Chrome, Edge, or desktop Firefox 151 or newer.** On Firefox a site-permission prompt appears
   _before_ the port chooser; it looks like an extension install and it is not, it is how Firefox
   gates this API. Row F is about exactly that.
5. **Switching tabs does not end the session.** Unlike the Phase 2 page, the session holds the port
   for the whole visit and does not close it when the tab is hidden. Going away and coming back is
   allowed; only unplugging, `DISCONNECT ZONA`, `FORGET THIS ZONA` or closing the tab ends it.

Two warnings the skeleton runbook did not need:

- **Running this checklist consumes and revokes a real browser permission.** Row E clicks
  `FORGET THIS ZONA`, which calls the browser's own `forget()` and removes this site's entry from the
  browser's site settings for the origin you are on. That is the point of the row, and it is worth
  knowing before it happens: after row E the picker is required again on that origin.
- **While HANGAR holds the port, Grid Editor cannot open it.** The session holds it for the whole
  visit rather than for one panel, which is a deliberate change from Phase 4. `DISCONNECT ZONA` is
  one click away — open the device disclosure from the header and it is the first button — and the
  session also lets go on `FORGET THIS ZONA`, on a refused module, and when the tab closes.

Numbers the page is running with, so a surprise is recognised as one: the identify window is
1500 ms, so a port that opens and says nothing is reported as silent after a second and a half; a
connected module is treated as gone after three missed heartbeats, 750 ms, and only if the operating
system also says the port has left — silence alone leaves the header connected; the screen-reader
announcement coalesces over 500 ms, so a fast pair of transitions is spoken once; and the module
heartbeats four times a second on its own, unprompted, carrying its active page, which is where the
`page 3` in the header comes from.

## Getting the page open

Only you can do either of these. The executor never deploys and never touches the hardware.

- **`npm run preview`**, then open `http://127.0.0.1:4173/`. `127.0.0.1` is a secure context, so Web
  Serial works there with no certificate and no deploy. `npm run preview` rebuilds the site first, so
  it always serves the current commit.
- **The deployed HTTPS origin**, `https://hangar.sabotond.workers.dev/`, if you choose to deploy
  first — `npm run deploy` from this machine, on a clean tree. **Row A wants an answer for this origin
  specifically**, because a Web Serial grant is per origin and only the local one has ever been
  tested. Nothing else in the checklist needs the deployed site.

**Both routes ask for a password.** The Basic Auth gate runs in front of every request on the local
preview too, not only on the deployed one, so expect a sign-in prompt for the realm `HANGAR preview`
at `127.0.0.1:4173` as well. Locally the credentials come from the gitignored `.dev.vars`; on the
deployed preview they are the two Worker secrets. A prompt is the gate working, not a fault.

**Never open the built `index.html` from disk.** A `file://` URL is not a secure context, so
`navigator.serial` is simply absent and the page correctly shows its no-Web-Serial state — which
reads as a broken page and costs an hour. The tell is the header caption `Not in this browser` over
`NO ZONA` in a browser you know can talk to hardware.

## Where the control is, and what connected looks like

The device slot sits at the right-hand end of the header on every page — `/`, `/c/<id>/` and
`/browse/` — beside `BROWSE ALL`. On a phone-width window it is alone on the header's second row. At
rest it reads `NO ZONA` and becomes `CONNECT ZONA` under the pointer. Beneath the header row, in the
not-connected states, one quiet line explains the picker before you click and a second says that
HANGAR never writes on its own; the chosen panel's `TRY ON DEVICE` calls the same session action and
is not a separate connection.

Connected, the slot reads `ZONA · fw 1.5.5 · page 3` — your firmware and your active page, read from
the module's own heartbeat, live rather than frozen at connect time. The slot is then a summary:
clicking it opens the device disclosure, which holds `Firmware 1.5.5, active page 3.`, the sentence
that nothing is written without a click, `DISCONNECT ZONA`, and `FORGET THIS ZONA` with its one-line
explanation. On a rig the slot gains `· with EN16` at desktop widths and the disclosure gains
`Also on the cable: EN16.` at every width.

The page keeps the connection across `BROWSE ALL`, a card, `BACK TO BROWSE` and the wordmark. It
does **not** keep it across a reload: a reload comes back as the offer, `ZONA detected` over
`CONNECT ZONA`, with the port unopened until you click. That is deliberate — nothing opens a port
without a click — and it is the browser-side half of row A that the suite already proves.

## The checklist

Six rows. Rows A to E take about twenty minutes together; F is optional and needs a browser this
machine may not have. Each names why a machine cannot do it, so no row is busywork.

| #     | Row                                                       | Do this                                                                                                                                                                                                                                 | Passes when                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Why a machine cannot                                                                                                                                                                                                                                                                                                                                    | Pass |
| ----- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| **A** | The grant survives a browser restart (CONN-06)            | Connect once — `CONNECT ZONA`, pick the ZONA in the list, wait for `ZONA · fw …`. Quit the browser completely, every window. Reopen it and open the site. Click nothing.                                                                | On load the header reads `ZONA detected` over `CONNECT ZONA`, with no picker and no gesture, and one click connects with no list. **Record the answer for the deployed HTTPS origin specifically** — grants are per origin, and only `127.0.0.1:4173` has ever been tested (Phase 2 read `previously granted ports: 1` there).                                                                                                                                                                                                                                                                                                                    | Permission storage is the browser's own profile state. The scripted serial can only assert HANGAR's reaction to `getPorts()`, never that the browser really kept the grant across a restart, or that it keeps it for a second origin.                                                                                                                   |      |
| **B** | Unplug and replug (CONN-06, D-07)                         | Connect. Pull the USB cable out of the ZONA. Wait a few seconds. Plug it back in. Do not reload and do not click until it is back in.                                                                                                   | The unplug flips the header **at once**, before any click, to `ZONA unplugged` over `NO ZONA`; opening the slot shows `The ZONA was unplugged. Nothing was written.` and the replug offer. The replug returns the header to `ZONA detected` over `CONNECT ZONA`, and **one click reconnects with no picker**, landing back on `ZONA · fw …`. A picker or an error on that click means the replug handling is wrong.                                                                                                                                                                                                                               | The `connect` and `disconnect` events and the new-token behaviour are the browser's. After a replug the browser hands back a **different** port object, and the session adopts it by its USB identity rather than by object identity; the scripted serial is modelled on a source reading of that, so this row is what turns the reading into evidence. |      |
| **C** | Grid Editor holds the port (CONN-04)                      | Start Grid Editor and let it connect to the ZONA. Then, in HANGAR, click `CONNECT ZONA`. If the browser shows its list, pick the ZONA; on a machine that granted the port in an earlier row there is no list and the open simply fails. | The named block `Another program is holding the port` appears in the disclosure, which opens by itself with focus inside it. It names Grid Editor, and lists six steps in this order: quit Grid Editor completely from its tray icon; unplug the ZONA; wait a few seconds; plug it back in; reload this page; `Click CONNECT ZONA again`. The browser's own `Failed to open serial port.` appears nowhere. `Escape` closes the block and puts focus back on the slot. Then quit Grid Editor from its tray, follow the six steps, and confirm the reconnect. **Also report whether the copy read as helpful or as jargon.**                        | Phase 2's row 0 was never exercised — the operator had no Grid Editor running — and `docs/SKELETON-RESULTS.md` names it open. The suite proves the block against a scripted `NetworkError`; that Grid Editor is what produces that error on this operating system is the half only a person can see.                                                    |      |
| **D** | A second Grid module, and a non-ZONA (CONN-07, D-08)      | With HANGAR connected to the ZONA, attach a second Grid module beside it and wait a second. Then disconnect, unplug the ZONA, and connect again with **only** the non-ZONA module on the cable.                                         | With the rig: the slot gains `· with <TYPE>` (at desktop width) and the disclosure `Also on the cable: <TYPE>.`, the order stable as heartbeats keep arriving. With only a non-ZONA: the browser's list still **offers** it — every ESP32-S3 Grid module shares the same USB identity, so the filter cannot tell them apart and the heartbeat is the whole test — and HANGAR refuses it by name: `That module is not a ZONA`, `It reported itself as <TYPE>. HANGAR only speaks to a ZONA, so nothing was sent.`, then `Plug in a ZONA` and `Click CONNECT ZONA again`. The port is released, so Grid Editor can open it.                         | Every one of the 1,550 frames in the Phase 2 run carried `SX 0, SY 0`. The other-module path has never met real traffic and is proven only against synthetic heartbeats built by the encoder; a real EN16 saying so on the wire is the missing half.                                                                                                    |      |
| **E** | `FORGET THIS ZONA` (D-10)                                 | Connect. Click the slot to open the disclosure. Read the line beneath `FORGET THIS ZONA`, then click it. Then reload the page.                                                                                                          | The port closes at once and the slot reads `CONNECT ZONA` with no caption. After the reload the slot reads `NO ZONA` and there is **no** `ZONA detected` offer — clicking brings the browser's list up again. The grant is gone from the browser's own site settings for this origin, and Grid Editor can open the module immediately without a replug. If the button was **absent** from the disclosure, record the browser and version: it renders only where the browser supports `forget()`.                                                                                                                                                  | Revocation is browser profile state, and "Grid Editor can have it now" is an operating-system exclusivity fact. The scripted serial records that `forget()` was called after `close()`; it cannot show the browser really dropped the entry.                                                                                                            |      |
| **F** | Firefox 151+ two-step prompt _(optional)_ (CONN-03, D-04) | On a desktop Firefox 151 or newer with a **clean profile** — one that has never granted this site anything — open the site and click `CONNECT ZONA`.                                                                                    | A site-permission prompt appears **before** the port chooser on the first request; the chooser appears after it; the connection completes as in row A. **Record how long the two prompts took end to end**, and whether a second connect on the same profile skips the first prompt. If you dismiss the first prompt instead, the header should read `Did not connect` with `You closed the chooser`, and `Nothing listed?` beneath it should carry the sentence about being asked twice. Say whether the pre-click line beneath the header was enough preparation, given that the two-step sentence lives one disclosure away rather than in it. | The whole Phase 2 run was one browser, and `docs/SKELETON-RESULTS.md` names Firefox under "Open, still". There is no behavioural signal for the two-step prompt before it appears and the site reads no user agent, so the copy is unconditional and only a person on Firefox can say whether it was enough.                                            |      |

Two things to know before rows B and F, so they are not written up as faults:

- **In the unplugged state the chosen panel's `TRY ON DEVICE` is still a live button.** If a panel
  is open during row B and you click it while the cable is out, it tries to open the missing port and
  lands in `The ZONA is not there any more` with the cable and hub steps. That is recorded
  (Phase 6 deferred item 10) and Phase 7 rules on it; the header's replug offer is the intended way
  out, and clicking nothing until the cable is back is the row.
- **A managed Firefox may have Web Serial switched off by policy.** If the header reads
  `Not in this browser` on a Firefox you expected to work, that is the likeliest reason; the page
  cannot tell a policy from an old browser without reading the user agent, which it never does.
  Record it as such.

## If something goes wrong

The header has one named state per failure, and the name is the diagnosis. The caption under the
mark tells you the family; the title in the disclosure tells you which one. Nine states, one line
each.

| What the page says                                                | What it means                                                                                                                                                                                                                     |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Not in this browser` — `This browser cannot talk to hardware`    | No Web Serial in this context. Either the browser genuinely has none, or the page was opened over `file://`, or a managed Firefox has it switched off. The disclosure names the browsers that work and offers no button.          |
| `Needs HTTPS` — `This page needs HTTPS`                           | Web Serial exists but the page is not a secure context. Open it over HTTPS or on `127.0.0.1`. The browsers that ship Web Serial can barely produce this state; if you see it, say where.                                          |
| `Did not connect` — `You closed the chooser`                      | The list was dismissed, or it had nothing to list — the browser reports both the same way. Nothing was opened and nothing was sent. `Nothing listed?` beneath it holds the cable and hub checks, charge-only cable first.         |
| `Did not connect` — `Another program is holding the port`         | Grid Editor, almost always, including from its tray icon after its window is closed. Follow the six steps in order. This is row C's expected result and a pass, not a fault.                                                      |
| `Did not connect` — `That module is not a ZONA`                   | The port opened and a Grid module answered, but its heartbeat named another type. HANGAR closed the port. Row D's second half expects exactly this.                                                                               |
| `Did not connect` — `Nothing answered on that port`               | The port opened and no Grid module reported itself within 1.5 seconds. Usually the port belongs to something else on your machine; occasionally a module whose firmware predates the piggybacked page report.                     |
| `Did not connect` — `The ZONA is not there any more`              | The module was picked but was gone by the time the port opened. A loose or charge-only cable, or a hub that cannot power it — or row B's cable was still out when something clicked.                                              |
| `Did not connect` — `The port would not open`                     | Anything else the browser reported; the raw message is printed underneath. Copy it out. If the detail reads `HANGAR is already connecting — one moment.` with no steps, that is HANGAR's own in-flight guard and a bug to report. |
| `ZONA unplugged` — `The ZONA was unplugged. Nothing was written.` | The module left while connected. Not a failure: the session waits, and the replug offer beneath it is the way back. Row B's first half expects exactly this.                                                                      |

A run that ends in a named state with the reason written down is a useful result, not a wasted
session. The failure paths are what this phase was built around, and Phase 7 inherits every one of
them.

## What to hand back

- **Which rows passed**, and for any that did not, exactly what the header and the disclosure showed
  instead — the caption, the title and the first line of the detail.
- **Row A's answer for the deployed origin**, separately from the local one.
- **Row C's verdict on the copy**: helpful, or jargon.
- **Row D's module types**, as the header spelled them, and whether the order held still.
- **Row F's timing** for the two prompts, and whether the second connect skipped the first one.
- **Anything the page showed that this runbook did not predict.**

The results belong in a dated `## Results` heading in a results document beside this one, in the
shape of `docs/SKELETON-RESULTS.md`, or as a reply to the checkpoint that presented this checklist.

**2026-09-11, plan 13-08 (13-CONTEXT D-20, move-clean).** `/browse/` is `/playground/` and every `/c/<id>/` is `/playground/<id>/`; the old addresses no longer serve. On `/playground/` the header is the shell's (13-05) and its connection slot is reserved and empty until 13-11, so the device slot the paragraph above describes is on `/` (from 13-11) and on `/playground/<id>/` only for now.
