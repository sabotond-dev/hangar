# Walking skeleton: results

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

This is the record of what a real ZONA did, and it is the document Phase 6 reads before it designs the
device session and Phase 7 reads before it designs the install. The checklist that produced it is
`docs/SKELETON-RUNBOOK.md`. The six questions below are D-08's, written down before the run so that the
answers could not be chosen after it.

Every claim here cites a committed capture and a step id or a timestamp. Where the run did not settle
something, the section says so and says what is still open; nothing here is a number that was not
measured.

**One version caveat, up front.** Every wire fact in this document is valid for
`@intechstudio/grid-protocol@1.20260825.1135` and for a ZONA on firmware 1.5.5. A pin bump
(`docs/PIN-POLICY.md`) or a firmware update re-opens every field offset, every parameter name and every
frame length in it.

## What was run

Performed by the project owner on 2026-09-03, between roughly 22:15 and 22:23 UTC, in Chrome 152 on
Windows 11, over `npm run preview` at `http://127.0.0.1:4173/dev/skeleton/`. `http://127.0.0.1` is a
secure context, so `navigator.serial` was present and no deploy was needed; the Phase 1 Basic Auth
Worker fronts that route too, which is why the runbook warns about the sign-in prompt.

The module was a **ZONA RevH on firmware 1.5.5**, HWCFG **161**, USB VID `0x303a` / PID `0x8123`
(recorded as 12346 / 33059), SX 0, SY 0, ROT 0, heartbeat **TYPE 1**, **active page 3**,
`otherModules: []`. Protocol pin `1.20260825.1135` in all three captures.

| Fixture                                                         | `run.id`           | Host heartbeat | Pre-send pacing | Recorder created (UTC)     | Events | Steps |
| --------------------------------------------------------------- | ------------------ | -------------- | --------------- | -------------------------- | ------ | ----- |
| `src/lib/transport/fixtures/zona-hardware.json`                 | `b-hb-off-pace-10` | **off**        | 10 ms           | `2026-09-03T22:15:12.641Z` | 3,746  | 150   |
| `src/lib/transport/fixtures/zona-hardware-a-hb-on-pace-10.json` | `a-hb-on-pace-10`  | on             | 10 ms           | `2026-09-03T22:21:11.544Z` | 911    | 29    |
| `src/lib/transport/fixtures/zona-hardware-a-hb-on-pace-0.json`  | `a-hb-on-pace-0`   | on             | 0 ms            | `2026-09-03T22:22:38.529Z` | 230    | 21    |

**Which clock.** Two different clocks appear in a capture and this document quotes one of them
throughout. Event `t` values and step `sentAt` / `settledAt` / `latencyMs` values are
`performance.now()` milliseconds since the page loaded — not wall clock, and not comparable between
arms. `capturedAt` is the only wall-clock stamp, taken when the recorder was constructed. Every
latency below is the per-step `sentAt` to `settledAt` figure from `steps`, **not** the page's `burst`
summary block, which measures a wider window and reads 0.2 to 1.1 ms higher over the very same twenty
requests. Section (b) quotes both, once, so the difference is on the record rather than in a footnote.

A fourth export exists and is deliberately **not** committed: an earlier, mid-run copy of arm B taken
after the store, superseded by the complete arm and a strict prefix of its events. Committing both
would read as two runs.

The one-paragraph version: the module completed the whole cycle — identify, fetch, write back,
store, re-fetch byte-identical — with zero timeouts, zero negative acknowledgements, zero refused
frames and `attempts: 1` on all 200 recorded steps across the three captures.

## (a) Is an outbound host heartbeat required?

**Answer: no, not for `CONFIG` or `PAGESTORE`. The prediction is confirmed.**

The prediction, from firmware source, was that it is not required: the module heartbeats on an
unconditional 250 ms timer (`grid_esp32_port.c:209-223`, `:415-418`), its heartbeat type flips to 1 on
USB connect with no host involvement (`:463-471`), and nothing in the `CONFIG` or `PAGESTORE` decode
paths consults `editor_connected` — its only use anywhere is gating LED preview generation
(`grid_ui.c:746-748`).

The page printed its definition of "required" before the run, so the test could not be moved
afterwards:

> With the host heartbeat off, within a 10 s window from connect: inbound HEARTBEAT frames arrive at 3
> per second or more; both CONFIG/FETCH return a REPORT within 1000 ms; both CONFIG/EXECUTE return an
> ACKNOWLEDGE within 500 ms; and PAGESTORE returns an ACKNOWLEDGE within 3000 ms. If all four hold, the
> host heartbeat is not required.

What `zona-hardware.json` shows, with `run.hostHeartbeat.enabled: false`:

- **The module never stopped talking.** 1,086 `HEARTBEAT/EXECUTE` frames, all TYPE 1, from `t`
  163841.8 to `t` 435320.4 — **271.5 seconds at 4.00 per second**, with an inter-frame gap of 132.3 ms
  at the tightest and 367.7 ms at the loosest. Condition (i) held: 40 heartbeats arrived inside the
  first ten seconds after the first recorded frame.
- **The host really was silent.** The capture holds 149 `tx` events and 149 request steps (150 steps,
  of which `identify` sends nothing), so every outbound byte in the arm is accounted for by a request.
  There is no periodic host heartbeat anywhere in it. The only unsolicited outbound frames are the five
  mandatory `restore-page-change` heartbeats at `t` 272436.8, 273522.0, 274173.6, 275332.9 and
  278211.0.
- **Both fetches were answered before the host had ever sent a heartbeat.** `fetch-setup` at `t`
  224458.1, settled 224477.1 (19.0 ms) and `fetch-timer` at 224479.5, settled 224492.4 (12.9 ms) — 60.6
  seconds after the first frame, with nothing but those two requests having gone out.
- **Both writes of the first cycle were acknowledged before the first restore was sent.** `write-timer`
  272397.0 to 272413.8 (16.8 ms), `write-setup` 272414.3 to 272435.9 (21.6 ms); the first
  `restore-page-change` follows at 272436.8.
- **The stores were acknowledged 28.7 seconds after the last restore.** Ten of them, the first at `t`
  306907.7 settling at 306946.4 (38.7 ms), and all ten `ok` on the first attempt.

Conditions (ii), (iii) and (iv) therefore held on the substance but not inside the definition's literal
ten-second window: the operator worked at their own pace, so the first fetch landed 60.6 s after
connect, the first write 108.6 s after, and the first store 143.1 s after. That makes the answer
stronger rather than weaker — the module was still heartbeating at 4.00/s and still acknowledging
requests four and a half minutes into an arm in which the host sent no heartbeat at all.

`zona-hardware-a-hb-on-pace-10.json` is the control: the same cycle with the 300 ms host heartbeat on
behaved identically (its 202 `tx` events against 28 request sends are the ~174 host heartbeats over its
53.4 s).

**Consequence for Phase 6.** The device session does not need a heartbeat loop to keep `CONFIG` or
`PAGESTORE` working. It does still need the restore, and that is a separate mechanism entirely: a
successful `CONFIG/EXECUTE` sets `page_change_enabled = 0` (`grid_decode.c:1279`), and the **only**
thing that sets it back is an inbound `HEARTBEAT` with `TYPE 255` (`:717`) — the firmware's own
editor-timeout restore is commented out (`grid_esp32_port.c:480`). Without it the user's ZONA cannot
change page, from Lua's `gpl()` or from outside, until it is power-cycled. Arm B is precisely the arm
where that matters, and the restore fired five times, once per write-back, from the page's own
`finally`. **Phase 6 and Phase 7 must keep doing this after every config write, heartbeat loop or no
heartbeat loop.** Never send TYPE 254: it disables page changing and nothing in HANGAR would re-enable
it.

One real consequence of a silent host, worth knowing rather than guessing: `editor_connected` gates
LEDPREVIEW report generation, and arm B's only five `LEDPREVIEW/REPORT` frames arrive at `t` 272441.4,
273525.1, 274175.7, 275335.0 and 278213.4 — immediately after each restore heartbeat, which is the
frame that sets the flag. A host that never beats gets no LED preview. HANGAR never asks for one.

## (b) Is the 10 ms pre-send gap load-bearing?

**Answer: no, on the evidence in hand. Ship 0 ms — with a named caveat that Phase 7 must carry.**

The burst probe is twenty consecutive read-only `CONFIG/FETCH` for the Setup event, one outstanding at
a time, counting timeouts, negative acknowledgements and latency.

| Capture                               | Pacing | n   | min     | p50     | max     | Timeouts | Negative acks |
| ------------------------------------- | ------ | --- | ------- | ------- | ------- | -------- | ------------- |
| `zona-hardware-a-hb-on-pace-0.json`   | 0 ms   | 20  | 2.8 ms  | 3.1 ms  | 3.4 ms  | 0        | 0             |
| `zona-hardware-a-hb-on-pace-10.json`  | 10 ms  | 20  | 13.2 ms | 13.8 ms | 15.8 ms | 0        | 0             |
| `zona-hardware.json` (all six probes) | 10 ms  | 120 | 13.1 ms | 14.0 ms | 16.4 ms | 0        | 0             |

Removing the gap makes every request roughly **11 ms cheaper and nothing worse**, and the spread stays
as tight: 0.6 ms peak to peak at pace 0 against 2.6 ms across arm A's twenty. End to end, twenty
requests took **65.7 ms** at pace 0 (`t` 28652.5 to 28718.2) against **305.3 ms** for arm B's last
twenty (`t` 418882.4 to 419187.7). Arm B's six probes of twenty each took between 293.2 and 305.3 ms,
starting at `t` 412658.6, 414192.3, 415034.6, 417316.4, 418330.4 and 418882.4.

The two clocks, once, on the same twenty steps so the difference is visible: arm B's last probe reads
13.4 / 14.2 / 16.3 ms per step and 14.2 / 15.0 / 17.2 ms in the `burst` summary block; arm A reads 13.2
/ 13.8 / 15.8 against 13.8 / 14.5 / 16.5; the pace-0 probe reads 2.8 / 3.1 / 3.4 against 3.0 / 3.3 /
3.8. The block is consistently the higher of the two. Note also that `zona-hardware.json` holds **120**
burst steps from six probes while its `burst` block describes only the last twenty — aggregating the
arm means reading `steps`, not `burst`.

The mechanism the 10 ms sleep would have been defending is real and specific: a 512-byte TinyUSB CDC RX
buffer (`tusb_config.h:39`) feeding a 2048-byte per-port ring (`grid_transport.h:13`) that **discards a
whole message silently** when it cannot fit (`grid_transport.c:151-153`). A `CONFIG/EXECUTE` is
`49 + ACTIONLENGTH` bytes — 690 for this module's 642-character Setup, 957 at the 908-character budget.
Two of those back to back is 1,380 to 1,914 bytes against a 2,048-byte ring.

**Decision: ship `PRE_SEND_DELAY_MS = 0`, and keep the constant named.** Three caveats, because the
measurement is narrower than the decision:

1. One module, one cable, one host, twenty samples at pace 0. That is evidence, not proof.
2. **The burst probe never exercised the mechanism.** Outbound, a `CONFIG/FETCH` is 49 bytes; the
   ~690-byte pressure the probe creates is on the module's transmit path and the host's receive path,
   not on the module's receive ring. Back-to-back 690 to 957-byte `CONFIG/EXECUTE` frames — exactly
   what Phase 7's install writes look like — were never sent at 0 ms pacing anywhere in this run.
3. Therefore: if Phase 7 ever sees a config write time out with no negative acknowledgement, the silent
   ring discard is the first hypothesis and restoring the 10 ms gap is the first experiment.
   `PRE_SEND_DELAY_MS` stays a named constant in `src/lib/protocol/constants.ts` for that reason, not
   as decoration.

## (c) Real acknowledgement latencies, and the honest timeouts

**Answer: everything settles under 40 ms; the desktop's timeouts are three orders of magnitude larger
than the link, and the shipped values below are ten times the slowest thing ever observed on each fast
path.**

Measured from `zona-hardware.json` unless the row says otherwise, per-step clock:

| Path                | Steps                           | n   | min     | p50     | p99     | max     | Desktop | HANGAR ships |
| ------------------- | ------------------------------- | --- | ------- | ------- | ------- | ------- | ------- | ------------ |
| `CONFIG/FETCH`      | `fetch-*`, `refetch-*`, `burst` | 124 | 12.9 ms | 14.0 ms | 16.4 ms | 19.0 ms | 250 ms  | **300 ms**   |
| `CONFIG/EXECUTE`    | `write-timer`, `write-setup`    | 10  | 14.8 ms | 17.0 ms | 21.6 ms | 21.6 ms | 500 ms  | **250 ms**   |
| `PAGESTORE/EXECUTE` | `store`                         | 10  | 13.6 ms | 16.9 ms | 38.7 ms | 38.7 ms | 3000 ms | **3000 ms**  |

`zona-hardware-a-hb-on-pace-10.json` adds 24 fetches (min 11.9, p50 13.7, max 29.7 — the 29.7 is
`fetch-setup`, the first request of that arm), two writes (16.2 and 21.4) and one store (35.4).
`zona-hardware-a-hb-on-pace-0.json` adds twenty fetches at 2.8 to 3.4.

Across both completed arms: **`CONFIG/FETCH` 11.9 to 29.7 ms** over 148 requests, **`CONFIG/EXECUTE`
14.8 to 21.6 ms** over 12, **`PAGESTORE/EXECUTE` 13.6 to 38.7 ms** over 11. Zero timeouts, zero
negative acknowledgements, `attempts: 1` everywhere. `write-setup` is consistently about 5 ms slower
than `write-timer` across all six write-back cycles — 642 characters against 22, the payload difference
landing exactly where it should.

The shipped values, and why each one is what it is:

- **`fetchMs = 300`**, down from the 1000 ms starting value. Ten times the slowest fetch ever observed
  (29.7 ms), and eighteen times the p99 of the 124-sample arm. Three bounded attempts plus the retry
  backoff then fit inside 1.3 seconds instead of 3.7, which is the difference between a page that
  reports a dead link and a page that appears to hang.
- **`executeMs = 250`**, down from 500. Ten times the slowest write observed (21.6 ms), rounded up.
- **`pagestoreMs = 3000`**, **unchanged, and now measured rather than assumed** — the distinction
  matters, because "measured and kept" and "never measured" look identical in a source file. The eleven
  observed stores ran 13.6 to 38.7 ms, so 3000 ms is roughly 78 times the worst of them. It is kept
  anyway: a store's cost is flash programming, not the link, and a `PAGESTORE/EXECUTE` that arrives
  while a bulk NVM operation is already running is **dropped with no acknowledgement and no negative
  acknowledgement at all** (`grid_decode.c:979-981`). A timeout is the only signal that case ever
  produces, and it should mean "the module is genuinely busy", not "the link was slow".

Shipped: fetchMs=300, executeMs=250, pagestoreMs=3000, preSendDelayMs=0

That line is machine-readable on purpose: `src/lib/skeleton-results.spec.ts` parses it and asserts it
equals `TIMEOUTS` and `PRE_SEND_DELAY_MS` in `src/lib/protocol/constants.ts`. A document that records a
measurement and a constant that ships a different number is the quiet failure that gate exists to
catch.

The honest limit on all four numbers: **no measurement here exercised a busy or failing module.** Every
one of them is a headroom argument over a clean idle link, not a measured tail.

## (d) Was the active page reported unprompted, and what did it carry?

**Answer: yes, on every single heartbeat, four times a second, carrying page 3.**

`zona-hardware.json` holds **1,086 `PAGEACTIVE/REPORT` classes — exactly one per `HEARTBEAT/EXECUTE`
frame** — from `t` 163841.8 to `t` 435320.4, and **every one of them carries `PAGENUMBER 3`**. The same
pairing holds in the other arms: 214 pairs in `zona-hardware-a-hb-on-pace-10.json`, 39 in
`zona-hardware-a-hb-on-pace-0.json`, page 3 throughout. Nothing asked for any of them. This is firmware
putting the active page in the same BRC frame as the heartbeat once USB is connected
(`grid_transport.c:199-203`).

**The page was 3, not 0.** D-10 — target the module's reported active page, never a hardcoded 0 — is
vindicated on real hardware rather than in principle: a skeleton that had assumed page 0 would have
fetched an empty `ACTIONSTRING` from a module sitting on page 3 and had nothing to write back, and the
run would have proved nothing while reporting success.

**There is no request for it, and none exists.** `src/lib/protocol/descriptors.ts` declares exactly
four outbound descriptors — `hostHeartbeat`, `fetchConfig`, `sendConfig`, `storePage` — and the active
page is not among them, because it does not need to be. The one instruction that would touch the active
page, `PAGEACTIVE/EXECUTE`, **changes** it and destroys the running Lua VM; it is forbidden forever
under D-06 and `src/lib/protocol/forbidden-instructions.spec.ts` fails if it ever appears.

One detail that mattered under real traffic: 124 `CONFIG/REPORT` frames also carry page numbers of
their own. The three-condition rule the page uses to move its active-page tracker — a `PAGENUMBER`
**and** a `HEARTBEAT` in the same decoded frame **and** no `EVENTTYPE` or `ACTIONLENGTH` — is what kept
those 124 frames out of it.

## (e) Were heartbeats from any other module seen?

**Answer: none. A single module, alone on the cable, for the whole run.**

`identity.otherModules` is `[]` in `zona-hardware.json`, `zona-hardware-a-hb-on-pace-10.json` and
`zona-hardware-a-hb-on-pace-0.json` alike. Stronger than the identity block: across all **1,550 decoded
frames** in the three captures (1,241 + 249 + 60), every BRC header carried `SX 0, SY 0`. Not one frame
in the run came from any address but the ZONA on the USB cable.

The consequence is a gap, not a result. **D-12's other-module path — name the modules on screen and
disable the store button, because `PAGESTORE` is a global broadcast — was never exercised against real
traffic.** It is proven only against `FakeTransport`. Phase 7 must not read this section as evidence
that it works; it is evidence that it never had to.

## (f) Does the Lua formatter WASM resolve from a plain static build?

**Answer: yes. Already settled by Phase 3, in a real browser, against the real production artifact — so
it is answered here by reference, with no fixture from this run.**

See `.planning/phases/03-vendor-the-domain/03-06-SUMMARY.md`. `npm run build` emits
`build/_app/immutable/assets/lua_fmt_bg.D_18ElAm.wasm` at **628,148 bytes**; `worker/index.js` serves it
as `Content-Type: application/wasm`; and a real Chromium page loading that build through `wrangler dev`
instantiates it and compiles all nine catalog presets **with an empty page console** — no
`instantiateStreaming` fallback warning, no error. The whole probe ran in 1.0 s cold and 623 to 895 ms
warm. `e2e/fidelity.e2e.ts` is the standing proof and runs in the normal suite.

No capture from this run could have evidenced it either way, and a decorative fixture citation here
would be worse than none: **the skeleton never loads the formatter at all.** Nothing in
`src/lib/protocol/` or `src/lib/transport/` calls `initLuaFormatter`, `compressScript` or
`minifyScript` — the walking skeleton reads and echoes back the module's own strings and never compiles
anything.

One standing constraint inherited from that phase: if a Content-Security-Policy is ever added to
`worker/index.js` — a reasonable hardening step for a site that writes to hardware — `script-src`
**must** include `'wasm-unsafe-eval'`. Without it the module never instantiates, and the symptom is
indistinguishable from "the formatter never initialised".

## Two caveats Phase 7 must carry

**1. The store restarts the module's script.** `PAGESTORE`'s success callback reloads the page from
flash and restarts the Lua VM (`grid_decode.c:956-960`, ending in
`grid_ui_bulk_start_with_state(..., grid_ui_bulk_page_load, activepage, 0, NULL)`). "Provable no-op" is
a claim about the **stored bytes**, not about the **running script**. The wire corroborates it:
`zona-hardware.json` holds five `DEBUGTEXT` lines reading `tick` at `t` 272411.5, 273496.8, 274150.8,
275309.7 and 278186.1 — exactly one per write-back, which is the factory Timer's own `print("tick")`
firing because the `CONFIG/EXECUTE` restarted the script — and ten reading `nvm store success`, exactly
one per store, a firmware-side confirmation sitting beside the `PAGESTORE/ACKNOWLEDGE` the page
actually matched on. With the factory config (dim, static) the restart is invisible. With an animating
config it is a visible reset, and KEEP ON DEVICE has to be designed knowing that.

**2. The port grant persists across a browser restart.** `requestPort()` granted
`http://127.0.0.1:4173` access to that port, and the grant survived quitting Chrome 152 completely and
reopening it: on the next load the page's read-only ports line reported **`previously granted ports:
1`**. So `navigator.serial.getPorts()` returns the ZONA with no user gesture and no chooser on a later
visit, which makes CONN-06's silent-reconnect offer viable for Phase 6 without an experiment of its
own. Two limits: the grant is **per origin**, so the local preview's grant says nothing about the
deployed one; and a returned port is **permitted, not open** — `open()` still has to succeed.
`SerialPort.forget()` is what revokes it, it is visible in the browser's own site settings, and shipping
a "revoke this site's access to your ZONA" control is Phase 6's.

## What the module carries now

**The restore, per arm.** `zona-hardware.json` records five `restore-page-change` steps, each
immediately after one of its five `write-setup` steps, each with outcome `sent`, at `t` 272436.8,
273522.0, 274173.6, 275332.9 and 278211.0. `zona-hardware-a-hb-on-pace-10.json` records one, at `t`
47195.4, after its single `write-setup`. `zona-hardware-a-hb-on-pace-0.json` records **none, and
correctly so**: that arm is `identify` plus one burst probe, it never wrote a config, so there was
nothing to re-enable. This exception is stated rather than hidden, and
`src/lib/transport/fixtures/fixtures.spec.ts` test 4 asserts the invariant in exactly that form — one
restore per `write-setup`, per arm — so the probe arm passes on the substance instead of being excused
from the rule.

**The bytes.** `results.byteIdentical` is `true` in both arms that completed a cycle. Setup 642
characters before and after, Timer 22 (`--[[@cb]]print("tick")`), and `setupBefore === setupAfter` and
`timerBefore === timerAfter` as strings, not merely as lengths. Arm B's re-fetch (`refetch-setup` at
`t` 396318.6, `refetch-timer` at 396333.1) ran **after five write-backs and ten flash stores**, so the
flash round trip is inside the comparison. The module holds exactly the bytes it held before the run.

**One character of interest.** The factory Setup is **642** characters; the pinned package's own touch
`INIT` default is 641. The run echoes back whatever it fetched, so this changes nothing about the no-op
— but the lesson for Phase 7 is that **the module's own string is the truth and the package default is
a hint**. Any budget or diff logic that assumes they agree will be off by a character on a factory
module.

## Open, still

- **Every failure path.** No unplug mid-write, no port conflict, no timeout, no negative
  acknowledgement and no refused frame has ever been seen from a real module — `attempts: 1` on all 200
  steps, 1,550 of 1,550 frames decoded. `FakeTransport`'s five injected faults are the only evidence
  any failure path in HANGAR works.
- **The port-conflict message (D-04, CONN-04).** Runbook step 0 was **not exercised**: the operator had
  no Grid Editor running and chose not to start one. That is neither a pass nor a failure, and the
  message stays unproven against a real conflict. Phase 6 owns the failure vocabulary and should close
  it.
- **D-12's other-module path**, per section (e).
- **Whether 0 ms pacing survives back-to-back 690 to 957-byte `CONFIG/EXECUTE` frames**, per section
  (b). Phase 7's install is where that gets answered.
- **Whether the port grant persists for the deployed HTTPS origin** as it does for
  `http://127.0.0.1:4173`. Grants are per origin and only the local one was tested.
- **Firefox.** The run was Chrome 152 only. Firefox 151+ has Web Serial but shows a site-permission
  prompt before the port chooser and passes a noticeably smaller share of the web-platform tests; none
  of that was exercised here.
