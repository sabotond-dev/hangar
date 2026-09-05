# The ZONA install run

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

This is the hardware checklist for Phase 7: the install flow. `TRY ON DEVICE` writes the configuration
on screen into the ZONA's memory, `PUT BACK` restores what the module had when it connected, and
`KEEP ON DEVICE` stores to flash behind a confirmation. **This runbook writes to your module.** Row A
only reads; every row after it changes what the ZONA is running, row C is the way back, and row E
makes a store permanent. Nothing before row B has ever written to a real ZONA from this site: Phase 2's
skeleton wrote the module's own strings back to it as a provable no-op, Phase 6 wrote nothing, and
every write Phase 7 has made so far landed in a scripted serial port or in a fake module that is a
function in Node. **The executor and the orchestrator never run any row of this document.** The first
real write is your click, at row B.

Web Serial cannot be automated — there is no CDP domain and no fake-device hook — so this is a
checklist for a person, not an assertion a test suite can make. Everything the machine can prove is
already green before you start: 776 unit tests, 13 sweep tests, 89 end-to-end tests across two
browsers against the production build (a scripted `navigator.serial` and a scripted ZONA that answers
off the real wire walk every one of the fourteen install states, the panel, the confirmation, the
header lock, the live region and the degrade path), a clean `svelte-check` and a production build.
What none of that can prove is that a real module does what the scripted one was told to do. The
scripted ZONA is modelled on a source reading of the firmware and on the frames Phase 2 recorded, and
it answers because it was told to. Seven things need a person, and each row below says why. Three of
them are **measurements**: whether a real ZONA answers `SERIALNUMBER/FETCH` at all, how many re-fetch
rounds the store's read-back took, and whether 0 ms pacing survived two back-to-back full-size writes.
Those three are set in bold in their rows so the number is not missed.

Phase 6's checklist (`docs/SESSION-RUNBOOK.md`, rows A to F) is still unanswered. This one does not
need it answered first, but it exercises the connect and the replug in passing; if either misbehaves,
record it under that runbook's names rather than as an install fault.

## Before you start

1. **Quit Grid Editor completely** — its tray icon, then Quit, not just closing the window. Only one
   program can hold a serial port, and Grid Editor takes it back from the tray. Have it installed,
   though: it is the last resort in the recovery order below.
2. **Know what your ZONA is doing before you connect.** Rows C and D pass by eye — the pad goes back to
   what it was doing — so look at it first. The factory configuration is dim and static, which makes
   the comparison easy rather than hard: after a `PUT BACK` the pad goes quiet again.
3. **Stay on one page of the module for the whole run.** The copy HANGAR takes is of the active page,
   and a page change on the ZONA clears a memory-only try-on (the `PLAYING NOW` block says so). Do not
   change page on the module between rows.
4. **Have a second Grid module for row G** — any type other than ZONA. Row G is optional and it is
   the one row to skip if you have none.
5. **Chrome, Edge, or desktop Firefox 151 or newer.** On Firefox a site-permission prompt appears
   _before_ the port chooser; it looks like an extension install and it is not, it is how Firefox
   gates this API.
6. **Rows A to F run in one tab until row F says otherwise.** The one thing that must not happen
   between row E's store and row E's final `PUT BACK` is closing the tab: `PUT BACK` stores as well as
   restores only when a keep happened in this page load, and a fresh tab does not know about the keep.
   See the recovery order if it happens anyway.
7. **Do not pull the cable during a store.** Row E says why.

Two warnings the earlier runbooks did not need:

- **This checklist writes to your module.** Row A takes the snapshot; every row after it changes what
  the ZONA is running. Row C is the way back and row E makes a store permanent. Have Grid Editor
  available as the last resort — it can rewrite both events on the touch element by hand.
- **While HANGAR holds the port, Grid Editor cannot open it.** The session holds the port for the whole
  visit. `DISCONNECT ZONA` is one click from the header — click the slot to open the device disclosure
  and it is the first button — and both it and `FORGET THIS ZONA` are disabled for the duration of a
  write, with `Not while HANGAR is writing to your ZONA.` beneath them. That lock lasts tens of
  milliseconds on a healthy link.

Numbers the page is running with, so a surprise is recognised as one. A configuration write waits
**250 ms** for its acknowledgement and a store **3000 ms**; a request that times out is tried at most
**three** times with **120, 240 and 360 ms** between attempts, so a dead link is reported inside about
1.3 seconds for a write and about ten for a store; a refusal from the module is never retried. If a
write is still in flight after **2000 ms** the panel adds one line, `Still writing. Your ZONA is taking
longer than it usually does.`, and nothing else moves. After a store is acknowledged HANGAR waits for
the module's next heartbeat (they come four times a second), then reads both scripts back, for up to
**three** rounds with 120 and 240 ms between them, and says `KEPT` on the first byte-identical pair.
Frames go out with **0 ms** between them; if a write ever times out with no refusal, the gap moves to
the desktop editor's **10 ms** once, for the rest of the visit, and the retry already on the screen runs
at the new pace. At connect the snapshot asks for the module's serial number (three attempts of
300 ms, about 1.3 s if nothing answers), then reads the Setup and then the Timer.

## Getting the page open

Only you can do either of these. The executor never deploys and never touches the hardware.

- **`npm run preview`**, then open `http://127.0.0.1:4173/`. `127.0.0.1` is a secure context, so Web
  Serial works there with no certificate and no deploy. `npm run preview` rebuilds the site first, so
  it always serves the current commit.
- **The deployed HTTPS origin**, `https://hangar.sabotond.workers.dev/`, if you choose to deploy
  first — `npm run deploy` from this machine, on a clean tree. Nothing in this checklist needs the
  deployed site; the local preview is enough for every row.

**Both routes ask for a password.** The Basic Auth gate runs in front of every request on the local
preview too, so expect a sign-in prompt for the realm `HANGAR preview` at `127.0.0.1:4173` as well.
Locally the credentials come from the gitignored `.dev.vars`; on the deployed preview they are the two
Worker secrets. A prompt is the gate working, not a fault.

**Never open the built `index.html` from disk.** A `file://` URL is not a secure context, so
`navigator.serial` is simply absent and the page correctly shows its no-Web-Serial state — which
reads as a broken page and costs an hour. The tell is the header caption `Not in this browser` over
`NO ZONA`, and `This browser cannot write to a ZONA. Everything else on this page works.` beneath a
disabled `TRY ON DEVICE`, in a browser you know can talk to hardware.

**Pick an animating card.** The rows below are written against `/c/aurora/`, the page the browser
suite drove, and its pad moves, so a try-on is visible from across the room. Any card whose preview
moves will do; a card that rests dark (GHOST, MORPH) passes row B on the panel's word alone, which is
half the point of the row.

**The probe, for two of the three numbers.** `http://127.0.0.1:4173/dev/install/` is a plain-text
readout of the install store, linked from nowhere. Its `Try on device` writes two one-line scripts of
its own (they print a number and light nothing), its `Put back` restores, and its `pacing escalated`
line and its `steps` list are where the exact answers to rows B and E are read. It is optional: both
rows say what the real page shows instead.

## Where the controls are, and what ready looks like

Connect from the header — the slot at the right-hand end reads `NO ZONA`, `CONNECT ZONA` under the
pointer — or from the panel's `TRY ON DEVICE`, which connects first when nothing is connected. Either
way the snapshot is taken the moment the session is connected, before any write control enables.
Connected, the slot reads `ZONA · fw 1.5.5 · page 3` — your firmware and your active page, live.

Choose a card (click the centre pad, or press `Enter` on it). The panel that opens has, top to bottom:

- **`TRY ON DEVICE`**, the one full-width accent-filled control, with one line beneath it. Before a
  session: `Connects to your ZONA, then writes this configuration into its memory. About a second, and
only in memory.` While the copy is being taken: `Reading what is on your ZONA now, so nothing you do
here is one-way.` Ready: `Writes this configuration into your ZONA’s memory in about a second. A power
cycle brings your own back.` The label reads `WRITING…` during its own write and `KEEPING…` during a
  store, and nothing on the page animates while it does.
- **The device-state block**, beneath the control. `READING ZONA` while the copy is taken, then
  `ZONA IDENTIFIED` over `Firmware 1.5.5, active page 3. Its own Setup and Timer are saved here, so PUT
BACK can undo anything you try.` Every state in this run lands here under a caption or a title; the
  table under "If something goes wrong" lists all twelve.
- **The knobs and the two 908 meters**, unchanged from Phase 5.
- **The install row**, one column: `PUT BACK` over `Restores the Setup and Timer that were on your
ZONA when you connected.`; `KEEP ON DEVICE`, borderless and unfilled, over `Available after a try-on.`
  until a try-on has settled, then `Stores this configuration in your ZONA’s own memory, so it
survives a power cycle.`; and `COPY LINK`.

The header's device disclosure (click the slot) holds the identity line, the snapshot line row A reads,
`HANGAR never writes to your ZONA on its own. Nothing reaches the module without a click.`,
`DISCONNECT ZONA`, and `FORGET THIS ZONA` over `Removes this site’s permission to see your ZONA. The
copy of your own Setup and Timer stays, and you can give permission again from the picker.` The
disclosure does not open while a card is chosen: press `Escape` to close the panel first, or read it
before choosing a card.

## The checklist

Seven rows. A to F take about half an hour together; G is optional and needs a second module. Each
names why a machine cannot do it, so no row is busywork, and the three bold items are numbers to write
down.

| #     | Row                                                                    | Do this                                                                                                                                                                                                                                                                                                                                                                                                                                  | Passes when                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Why a machine cannot                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Pass |
| ----- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| **A** | The module names itself and is remembered (SAFE-04; D-19 timing 1)     | With no card chosen, connect from the header: `CONNECT ZONA`, pick the ZONA, wait for `ZONA · fw …`. Wait two seconds more. Click the slot to open the disclosure and read the line beneath the identity line. Then choose a card. Then close the tab, open the site in a new tab, connect (one click on `ZONA detected`), choose a card again.                                                                                          | The line reads the durable form: `A copy of your ZONA’s own Setup and Timer is saved in this browser, so it can be put back even in a new tab.` **Record which form you saw** — the other is `A copy of your ZONA’s own Setup and Timer is held until this tab closes, so it can be put back while you are here.`, and it means the module did not answer `SERIALNUMBER/FETCH` within three attempts. In the panel, `ZONA IDENTIFIED` reads `… Its own Setup and Timer are saved here, so PUT BACK can undo anything you try.` and `PUT BACK` is enabled with its line. After the reopen the header offers `ZONA detected` with no picker, the disclosure shows the same durable line again, and `PUT BACK` is enabled again. The session-only form is not a HANGAR fault — it is the honest degrade — but it changes what rows E and F can show, and it is the answer this row exists to get.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | The fifth outbound instruction, `SERIALNUMBER/FETCH`, is source-verified and wire-unproven: no frame of that class appears in any of the three Phase 2 captures, and the desktop editor never sends one. The scripted ZONA answers it because it was told to. Whether a real ZONA on firmware 1.5.5 answers at all is the highest-value unknown in this checklist, because everything durable hangs off it.                                                                                               |      |
| **B** | The first RAM write (SAFE-02, SAFE-08; D-19 timing 3)                  | On `/c/aurora/`, connected and `ZONA IDENTIFIED`, look at the pad, then click `TRY ON DEVICE` and start counting. This is the first write from this site to a real ZONA.                                                                                                                                                                                                                                                                 | The pad is doing the new thing within about a second and the block reads `PLAYING NOW` over `Aurora is running on your ZONA now. It lives in memory only — a power cycle brings your own configuration back. Changing page on your ZONA clears it; try it on again if that happens.` — from the two acknowledgements, not from a timer. `KEEP ON DEVICE` is now enabled with `Stores this configuration in your ZONA’s own memory, so it survives a power cycle.` **Record the wall time from the click to `PLAYING NOW`** (Phase 2 measured 15 to 22 ms per acknowledgement, so anything you can count is news), **whether the border LEDs flashed white** (the firmware's own write feedback), **whether it ever timed out**, and **whether pacing escalated**: on this page the escalation is visible only as its cause — a first click landing `Nothing reached your ZONA` or `Only one of the two scripts landed` with no refusal, and the retry then landing — so if the first click landed `PLAYING NOW` with no block in between, it never fired. For the exact reading, the probe's `pacing escalated` line reads `true` or `false` after its own `Try on device`; `Put back` there restores.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Nothing but a module can prove a write landed; a fake acknowledgement proves only that HANGAR believed one. This row is also the experiment `docs/SKELETON-RESULTS.md` § (b) named in advance: a `CONFIG/EXECUTE` is 49 bytes plus the script, up to 957 at the budget, and two of them back to back at 0 ms have never met the module's 2,048-byte receive ring, which discards a whole message silently. A timeout with no refusal here is that ring, and 10 ms pacing is the answer HANGAR tries once. |      |
| **C** | `PUT BACK` (SAFE-03)                                                   | Click `PUT BACK`. Do not touch anything else.                                                                                                                                                                                                                                                                                                                                                                                            | One click, no confirmation. The label reads `PUTTING BACK…` for an instant, then the block reads `RESTORED` over `Your own Setup and Timer are back on your ZONA’s touch element, exactly as they were when you connected.` and the pad is doing exactly what it was doing before row B. `KEEP ON DEVICE` is disabled again with `Available after a try-on.`; `TRY ON DEVICE` is live.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | The comparison is by eye against a physical module. The suite proves the snapshot's bytes went back out verbatim; only a person can say the pad is doing what it did.                                                                                                                                                                                                                                                                                                                                     |      |
| **D** | A power cycle brings the original back (SAFE-02)                       | Click `TRY ON DEVICE` again and wait for `PLAYING NOW`. Pull the USB cable out of the ZONA. Wait a few seconds. Watch the pad as you plug it back in. Then click `CONNECT ZONA` once to reconnect.                                                                                                                                                                                                                                       | The module comes up running its **own** configuration, not Aurora — which is what "in memory only" means and is the whole safety argument for the primary control. On the unplug the header flips to `ZONA unplugged` and the install controls wait for the module; on the replug it offers `ZONA detected`, one click reconnects with no picker, and the panel reads `ZONA IDENTIFIED` again with `PUT BACK` enabled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | RAM is not readable after it is gone. The scripted ZONA has a `powerCycle()` that copies flash back over RAM because the firmware source says that is what happens; a real module either does or does not.                                                                                                                                                                                                                                                                                                |      |
| **E** | `KEEP ON DEVICE` survives a power cycle (SAFE-05, D-12; D-19 timing 2) | Click `TRY ON DEVICE`, wait for `PLAYING NOW`. Click `KEEP ON DEVICE`. **Read the block that replaces it before you click anything in it.** Then click its `KEEP ON DEVICE`. Watch the pad's border. Wait for `KEPT`. Pull the cable, wait, plug it back in, watch the pad. Reconnect with one click. Then click `PUT BACK` and wait for its second line. **Do not pull the cable while the label reads `KEEPING…` or `PUTTING BACK…`.** | Before anything is sent the block reads `PERMANENT`, `This replaces the Setup and Timer scripts on your ZONA’s touch element, and it survives a power cycle.`, `PUT BACK still restores what was there when you connected.`, with `KEEP ON DEVICE` and `NOT NOW` beneath — and the row's `KEEP ON DEVICE` is gone while the block is open, never both. On the commit the primary reads `KEEPING…`, the border LEDs animate yellow-dim during the store, the pad goes dark for an instant as the module restarts, and only then the block reads `KEPT` over `Aurora is stored on your ZONA and will still be there after a power cycle.` and `HANGAR read both scripts back and they match, character for character. The pad restarts once as it loads the stored version.`; `KEEP ON DEVICE` reads `Kept on your ZONA. Turn a knob and try it on again to keep a new one.` and the `PUT BACK` line gains `, and stores them so they stay.` After the replug the pad comes up running **Aurora**. After the reconnect and `PUT BACK`, `RESTORED` gains `They are stored too, so they stay after a power cycle.` and the pad is as you found it. **Record how many re-fetch rounds the store took**: on this page it is not shown — record the time from the commit to `KEPT`, and whether `Stored, but the read-back does not match` ever appeared (that is all three rounds spent); for the exact number, repeat the keep on the probe and count the `refetch-setup` lines in its `steps` list after `store ok` (1, 2 or 3), then `Put back` there. **Caution:** the firmware writes Setup to flash before Timer, the reverse of the RAM order; a module unplugged mid-store could come back with a new Setup and an old Timer, which no state on this page names. That is why the cable stays in. | Flash is the definition of "survives", and only a power cycle tests it. The acknowledgement is sent by the firmware callback that _starts_ the module's page reload, and `CONFIG/FETCH` has no bulk guard, so how long the reload takes decides how many rounds the read-back needs — a number nobody has measured; the three-round bound is a guess with a name.                                                                                                                                         |      |
| **F** | Fresh-tab `PUT BACK` (SAFE-04)                                         | Click `TRY ON DEVICE` and wait for `PLAYING NOW` — a memory-only try-on, not a keep. Quit the browser completely, every window. Reopen it, open the site, connect (one click), choose the same card, and read the disclosure's snapshot line and the `ZONA IDENTIFIED` body. Then click `PUT BACK`.                                                                                                                                      | The pad returns to your own configuration. It can only have come from the browser's own storage: the module's memory held Aurora when this tab connected, so a copy taken at this connect would have been Aurora, and an existing record is what wins. If row A read the session-only form, this row is **expected to fail, honestly**: the disclosure reads the tab-only line, `PUT BACK` restores what was on the module when _this_ tab connected — Aurora — and the pad does not change. A power cycle then brings your own back (row D). Record that as row A's consequence, not as a new fault.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Profile state plus module state. `localStorage` surviving a browser restart is the browser's own behaviour; the record being consulted ahead of a fresh copy is proven only against a Map. Neither is simulable end to end.                                                                                                                                                                                                                                                                               |      |
| **G** | A rig (SAFE-06) _(optional)_                                           | Attach a second Grid module beside the ZONA, wait a second, and check the slot gains `· with <TYPE>`. Click `TRY ON DEVICE`, wait for `PLAYING NOW`, click `KEEP ON DEVICE`, read the block — then click `NOT NOW`. **Do not confirm it unless you are willing to store that module's current page too.** Finish with `PUT BACK`.                                                                                                        | The block carries a fourth sentence naming the module as the header spells it: `Your EN16 is on the same cable. Its current page is stored too, because the store reaches every module at once.` (or the plural for two or more). `KEEP ON DEVICE` inside the block is enabled — the action is allowed, not refused. `NOT NOW` closes the block and puts focus back on the row's `KEEP ON DEVICE`; nothing was sent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Every one of the 1,550 frames in the Phase 2 run carried `SX 0, SY 0`; the rig path has never met real traffic and is proven only against heartbeats built by the encoder and a fan-out fake that answers one store three times.                                                                                                                                                                                                                                                                          |      |

Two things to know before rows D and E, so they are not written up as faults:

- **In the unplugged state the panel's `TRY ON DEVICE` is still a live button.** If you click it
  while the cable is out it tries to open the missing port and lands in Phase 6's
  `The ZONA is not there any more` block. The header's `ZONA detected` offer is the intended way back
  after a replug, and clicking nothing until the cable is in is the row.
- **`KEPT` waits for a heartbeat.** After the store acknowledges, the module reloads its page and
  restarts its Lua VM, and HANGAR does not read the scripts back until the module's next heartbeat
  arrives. On a healthy link `KEPT` lands well under a second; if it took noticeably longer, that is
  row E's measurement, not a fault.

## If something goes wrong

The device-state block has one caption or title per state, and the name is the diagnosis. Twelve
blocks, one line each. Any one of them with the reason written down is a useful result.

| What the block says                                                                                                                                                         | What it means                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `READING ZONA` — `Taking a copy of the Setup and Timer scripts already on your ZONA’s touch element.`                                                                       | The snapshot is in flight. Every write control is disabled until it lands. Lasts tens of milliseconds on a module that answers its serial, about 1.3 s on one that does not.                                                                                                                         |
| `ZONA IDENTIFIED` — `Firmware …, active page …. Its own Setup and Timer are saved here, so PUT BACK can undo anything you try.`                                             | Ready. The copy exists, `PUT BACK` is enabled, nothing has been written.                                                                                                                                                                                                                             |
| `PLAYING NOW` — `… is running on your ZONA now. It lives in memory only — …`                                                                                                | Both acknowledgements arrived. The configuration is in RAM; a power cycle or a page change clears it. Row B's pass.                                                                                                                                                                                  |
| `RESTORED` — `Your own Setup and Timer are back on your ZONA’s touch element, exactly as they were when you connected.`                                                     | `PUT BACK` landed. A second line, `They are stored too, so they stay after a power cycle.`, appears only when a keep happened this visit and the store's read-back matched. Rows C and E.                                                                                                            |
| `KEPT` — `… is stored on your ZONA and will still be there after a power cycle.`                                                                                            | The store was acknowledged, the module heartbeat, and both scripts read back byte for byte. Row E's pass.                                                                                                                                                                                            |
| `Nothing to put back yet` — `HANGAR could not read the Setup and Timer already on your ZONA, and it will not write over something it has not copied.`                       | The snapshot failed or read empty. Nothing was written and nothing will be. `Click TRY ON DEVICE to try reading it again` re-reads first and writes only if that lands. A factory-blank page or a page that is not the module's active one produces this; record the module's page.                  |
| `Nothing reached your ZONA` — `Neither script got through. …`                                                                                                               | Both writes timed out or the first was refused. Your own configuration is still running. If there was no refusal, this is the silent-discard signature and the retry runs at 10 ms pacing — row B's third measurement. `If it happens twice, check the cable is seated at both ends`.                |
| `Only one of the two scripts landed` — `Timer reached your ZONA and Setup did not. …` (or the reverse)                                                                      | One acknowledgement arrived and the other never did. The module is running half of one configuration and half of another; the pad may sit still or misbehave. `Click TRY ON DEVICE to send both again`, or `PUT BACK`. Never seen on real hardware yet.                                              |
| `The ZONA was unplugged mid-write` — `Some of this configuration may have reached the module and some may not. Nothing was stored, …` (or the store form)                   | The cable went during a write. `Plug the ZONA back in`, `Click TRY ON DEVICE again`, `Then click PUT BACK to restore what was there when you connected`. If it went during a store, the detail says instead that HANGAR cannot say what a power cycle brings back — see row E's caution.             |
| `Your ZONA did not confirm the store` — `… is still running on your ZONA, in memory. No confirmation of the store came back, …`                                             | The `PAGESTORE` was sent and 3000 ms passed with no acknowledgement and no refusal. The firmware drops a store that arrives while a bulk flash operation is running, with no reply at all, so this is "the module was busy", not "the link is slow". `Click KEEP ON DEVICE to send the store again`. |
| `Stored, but the read-back does not match` — `Your ZONA acknowledged the store, but reading the two scripts back gave something different. HANGAR will not call that kept.` | All three re-fetch rounds ran and none matched. Unreachable on the hardware Phase 2 measured, kept so the failure is never silent. Row E's round count is **3** if you see this. `Click TRY ON DEVICE, then KEEP ON DEVICE again`, or `PUT BACK`.                                                    |
| `Put back for now, not after a power cycle` — `Your own Setup and Timer are running on your ZONA now, in memory. The store did not confirm, …`                              | `PUT BACK`'s RAM leg landed and its store leg did not confirm. The version kept earlier may come back after a power cycle. `Click PUT BACK again`.                                                                                                                                                   |

Two header states belong beside them. `ZONA unplugged` over `The ZONA was unplugged while HANGAR was
writing to it.` is the header's form of the lost block, shown only when the cable went mid-write;
otherwise the header says `The ZONA was unplugged. Nothing was written.` as in Phase 6. And a disabled
`DISCONNECT ZONA` with `Not while HANGAR is writing to your ZONA.` beneath it is the lock, not a fault;
it releases the moment the write settles.

## Recovery

If a row leaves the module running something you did not want, in this order:

1. **`PUT BACK`**, from the panel. Restores memory in one click; after a keep in this page load it
   stores too, and its line says so before you click.
2. **Power-cycle the module.** Anything a `TRY ON DEVICE` put in memory is gone, and flash comes
   back — your own configuration unless row E stored.
3. **`PUT BACK` from a fresh tab.** The copy is in this browser's storage under the module's serial
   number if row A read the durable form. This restores memory only; a fresh tab does not know a keep
   happened.
4. **Make the original permanent again after a keep, when the tab that kept is gone.** In a new tab,
   connected, with the durable copy present: `TRY ON DEVICE` (any card), `KEEP ON DEVICE` and confirm,
   then `PUT BACK`. The keep in this page load makes `PUT BACK` store as well as restore — its line
   reads `…, and stores them so they stay.` — and `RESTORED` gains its stored line. Two extra flash
   writes, and the only route without Grid Editor.
5. **Grid Editor.** Quit HANGAR's tab (or click `DISCONNECT ZONA`), open the module, and rewrite both
   events on the touch element by hand from whatever you captured before the run.

## What to hand back

- **Which rows passed**, and for any that did not, exactly what the panel showed instead — the caption
  or title, and the first line beneath it.
- **Row A's answer**: the durable form or the session-only form, and whether the reopened tab showed
  the same.
- **Row B's wall time** from the click to `PLAYING NOW`, whether the border flashed white, whether it
  ever timed out, and **whether pacing escalated** — from the page's behaviour or from the probe.
- **Row E's round count**, exact from the probe or as the time to `KEPT` from the real page; whether
  the border went yellow-dim; whether the pad came up running Aurora after the replug.
- **Row F**: whether the pad came back to your own configuration from a fresh browser.
- **Row G's module type** as the block spelled it, if you ran it.
- **Anything the page showed that this runbook did not predict** — including what a screen reader
  said at connect, if you had one running: the suite found the snapshot sentence replaces the
  connected sentence inside one announcement window, and whether that is the right sentence to hear
  is a copy question.

The results belong in a dated `## Results` heading in a results document beside this one, in the shape
of `docs/SKELETON-RESULTS.md`, or as a reply to the checkpoint that presented this checklist.
