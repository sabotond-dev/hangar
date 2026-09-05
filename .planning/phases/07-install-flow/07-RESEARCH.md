# Phase 7: Install Flow - Research

**Researched:** 2026-09-05
**Domain:** Web Serial writes to a ZONA over the Grid protocol - a snapshot, three clicks, a failure
taxonomy, and a durable per-module key
**Confidence:** HIGH on the wire (Phase 2 captures + firmware source read line by line), HIGH on the
identity mechanism's field layout (package and firmware headers compared byte for byte), MEDIUM that a
real ZONA answers a `SERIALNUMBER/FETCH` (source-verified, never observed), MEDIUM on the settle
timing after `PAGESTORE` (unmeasured), HIGH on the string pin (measured across all nine presets).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Safety rails**

- **D-01 [user]** Nothing is written without an explicit click, and the connect surface says so out
  loud (SAFE-01 - Phase 6's header note already carries the sentence; Phase 7 keeps it true).
- **D-02 [user]** `TRY ON DEVICE` writes to RAM only and is the primary action; `KEEP ON DEVICE`
  stores to flash and is visibly secondary and separate - never equal-weight buttons (SAFE-02; the
  chosen panel already holds both, the second disabled with "after a try-on").
- **D-03 [user]** At connect - before any write control enables - HANGAR snapshots the touch
  element's Setup and Timer (Phase 2's `fetchBoth` on the module's reported active page); every
  write control stays disabled until that snapshot is present and non-empty (SAFE-03). `PUT BACK`
  restores it with one click at any time.
- **D-04 [user]** The snapshot persists in `localStorage` keyed by module identity so `PUT BACK`
  survives a closed tab (SAFE-04). **Research question:** Web Serial exposes VID/PID, not the USB
  serial, and the heartbeat carries no serial - the key needs a stable per-module identity readable
  over the wire (a Grid property, or the fetched strings' hash as a weaker fallback); the researcher
  decides and the UI copy says what "this ZONA" means.
- **D-05 [user]** `KEEP ON DEVICE` requires a confirmation naming what is replaced ("the Setup and
  Timer scripts on your ZONA's touch element") and stating it survives a power cycle (SAFE-05). On a
  rig with other Grid modules the confirmation names them (Phase 6's identity carries them) and
  states their current pages are stored too, because PAGESTORE is a global broadcast - and the
  action remains allowed (SAFE-06; supersedes Phase 2's refuse-on-rig, which was a skeleton rule).
- **D-06 [user]** "Installed" means an ACKNOWLEDGE frame arrived for each event write, never a
  resolved writer promise. A write that lands one event but not the other is detected, reported
  plainly, and recovered by retry or by `PUT BACK` (SAFE-07). Retries on timeout are bounded; a
  connection lost mid-write ends in a named failure state with `PUT BACK` still offered (SAFE-09).
- **D-07 [user]** Speed is stated honestly ("about a second") and a settled state is confirmed -
  no progress bar for a 200 ms operation (SAFE-08). Phase 2 measured EXECUTE ACKs at 15-22 ms.
- **D-08 [user]** On browsers without Web Serial the install controls are present but disabled with
  the reason inline, never hidden (DEGR-02 - Phase 4's disabled-with-reason pattern).

**The write itself**

- **D-09 [orchestrator]** The wire order is Phase 2's proven one: Timer (event 6) first, then Setup
  (event 0), on the touch element (element 0) of the module's reported active page, each a
  CONFIG/EXECUTE awaited for its ACK; then `restorePageChange` (a successful CONFIG/EXECUTE clears
  `page_change_enabled`; only an inbound TYPE 255 heartbeat restores it). `PUT BACK` is the same
  sequence with the snapshot's strings. `KEEP ON DEVICE` is PAGESTORE/EXECUTE awaited for its ACK.
- **D-10 [orchestrator]** The strings come from Phase 5's tuner: for compiler-driven entries the
  compiled Setup/Timer of the current knob state after `padReady()`; for Lua entries the rendered
  canonical text. Both are asserted <= 908 before anything reaches the wire; an over-budget state
  already disables `TRY ON DEVICE` (TUNE-05). What is written is byte-for-byte what the meters
  measured - a spec pins it.
- **D-11 [orchestrator]** The session (Phase 6) gains a write-capable transport only inside the
  install actions; the never-writes invariant narrows to "zero writes without a click" and every
  write is attributable to one of three clicks (`TRY ON DEVICE`, `PUT BACK`, `KEEP ON DEVICE`),
  asserted against `FakeTransport`.
- **D-12 [orchestrator]** After `KEEP ON DEVICE` the module restarts its Lua VM (Phase 8 research):
  the settled state re-fetches both strings and shows them byte-identical to what was sent - the
  same re-fetch proof Phase 2 shipped - before saying "kept".

**Proof**

- **D-13 [orchestrator]** Every path runs against `FakeTransport` and the Phase 2 hardware captures
  in Vitest: snapshot-before-write, the three clicks, partial ACK (one event lands), timeout with
  bounded retry, disconnect mid-write, the multi-module confirmation text, the localStorage key round
  trip, over-budget refusal before the wire. Playwright walks the states through the fake serial
  shim on `/dev/session/` (Phase 6) or a `/dev/install/` probe, in both projects.
- **D-14 [user, standing]** The hardware truths are the user's daytime checklist
  (`docs/INSTALL-RUNBOOK.md`, a `checkpoint:human-verify` in the final plan): the first RAM write to
  a real ZONA, `PUT BACK`, a power cycle bringing the original back, `KEEP ON DEVICE` surviving a
  power cycle, a fresh-tab `PUT BACK`. The orchestrator never performs a write.

**Placement (Phase 4 D-08 honoured)**

- **D-15 [orchestrator]** `TRY ON DEVICE` and `KEEP ON DEVICE` stay where the chosen panel put them;
  `PUT BACK` appears beside `KEEP ON DEVICE` once a snapshot exists, secondary in weight; the install
  states (writing / settled / kept / partial / lost) render in the panel's honesty slot the way the
  connect states do, with the identity line unchanged. The flash confirmation is an inline block, not
  a modal, with `KEEP ON DEVICE` as its only affirmative and `NOT NOW` beside it. Whether a third
  colour earns itself for the flash warning is the UI spec's call (Phase 5's spec named it as the
  first candidate); the default is no.

### Claude's Discretion

CONTEXT.md declares no explicit discretion section. Read against D-01..D-15, the researcher/planner
freedoms are: the module and file split under `src/lib/device/`; the internal shape of the install
store; the exact snapshot record schema and localStorage key string; the naming of the install states;
the ordering of plans; the wording of copy CONTEXT.md does not fix; and whether the `/dev/install/`
probe is a new route or an extension of `/dev/session/`. D-04 explicitly delegates the durable-snapshot
key to research - answered below.

The three questions CONTEXT.md leaves **open for the user**:

1. Whether `KEEP ON DEVICE` may use a third colour for its warning.
2. Whether the durable-snapshot key should be shown to the user (which ZONA the site remembers).
3. Whether a power-cycle test row belongs in the daytime checklist (it does in this draft).

### Deferred Ideas (OUT OF SCOPE)

Firefox-specific install copy beyond Phase 6's; Android WebUSB / iOS transports; writing to any
element but the touch element; page switching; anything the Grid Editor does beyond these three
clicks.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SAFE-01 | Nothing written without an explicit click, and the connect screen says so | The never-writes proof already exists in two halves (`try-on.spec.ts` test 3, Phase 6 plan 06-04 test 15). Phase 7 narrows it: keep the source-scan half green on `session.svelte.ts` by putting every write in a **separate** module (`install.svelte.ts`), and add a dynamic half - "zero writes across connect + browse + tune; exactly N writes after each click". The panel's honesty literal *"Writing arrives in the next release - this never writes."* must change in this phase; see Pitfall 10. |
| SAFE-02 | RAM primary, flash secondary and separate | `KeepOnDevice.svelte` already ships disabled with its reason, at auto width, hairline border, dim label, 24 px rule from the primary. Phase 7 enables it and adds the confirmation block. No geometry change is required. |
| SAFE-03 | Snapshot at connect; `PUT BACK` restores in one click | `fetchBoth(queue, identity)` (`sequence.ts:212`) is the whole read, already hardware-proven; `canWriteBack` (`write-guard.ts`) is the non-empty test D-03 asks for, verbatim. The gate is "snapshot present and `canWriteBack(...).ok`". |
| SAFE-04 | The snapshot persists in `localStorage` keyed by module identity | **Answered below:** `SERIALNUMBER/FETCH` -> `SERIALNUMBER/REPORT` returns a 128-bit per-chip id (ESP32-S3 eFuse MAC). Offsets in the pinned package and in `grid-fw` are byte-identical. Key = the four words as 32 hex characters. The record is a map of `page -> {setup, timer}` so a page change cannot cross-contaminate. |
| SAFE-05 | Flash confirmation names what is replaced and that it survives a power cycle | Firmware confirms both halves: `grid_decode.c:976` stores **the module's own active page** and it is never a parameter; the success callback reloads that page from flash and restarts the Lua VM (`grid_decode.c:955-961`). |
| SAFE-06 | On a rig the confirmation names the other modules and states their pages are stored too; still allowed | `Identity.otherModules` already carries them (Phase 6 D-08 sorts them by `sx`,`sy`). Firmware: PAGESTORE is checked with `IS_ME | IS_GLOBAL` and `storePage()` addresses `DX/DY = -127,-127`, so every module on the bus stores its own active page. `Identity.storeAllowed` (Phase 2 D-12) must be **retired or ignored** here - SAFE-06 supersedes it. |
| SAFE-07 | "Installed" means an ACKNOWLEDGE per event write; a half-landed write is detected and recovered | `RequestQueue.request()` resolves only on a matching decoded class (`queue.ts:96-112`), never on a resolved `write()`. The partial case has a vendored name and message already: `PadPartialWriteError(["timer"], "setup", cause)` at `_pad.ts:3460-3473`. |
| SAFE-08 | Honest speed, a settled state, no progress bar | Measured: `CONFIG/EXECUTE` 14.8-21.6 ms over 12 hardware requests; the whole RAM write pair plus the restore is **~39 ms** (`zona-hardware.json`, `write-timer` 272397.0 -> `restore-page-change` 272436.9). |
| SAFE-09 | Bounded retries; a lost connection ends in a named failure with `PUT BACK` still offered | The queue is already bounded (`RETRY_ATTEMPTS = 3`, `retryBackoffMs = 120*(n+1)`) and already refuses to retry a `NackError` or an `AbortedError`. The disconnect path exists: `transport.onClose -> queue.abort(reason)`. |
| DEGR-02 | Install controls present but disabled with the reason inline | Proven shipped: `e2e/first-experience.e2e.ts:339-373` asserts both `try-on-device` and `keep-on-device` visible-and-disabled with the reason in `connect-status`, with `serial` deleted from `Navigator.prototype`. Phase 7 must keep that test green and add `put-back` to it. |

</phase_requirements>

<research_summary>

## Summary

Phase 7 is not a new-technology phase. Every wire fact it needs was proven on real hardware in Phase 2
and every piece of machinery it needs already exists in the tree: `RequestQueue` (one outstanding
request, ACK-only resolution, bounded retries, typed `NackError`/`AbortedError`), `sendConfig` /
`storePage` / `hostHeartbeat` descriptors, `writeBack` in Phase 2's proven Timer-then-Setup order,
`canWriteBack`, `FakeTransport` with five injectable faults, `zonaResponder`, and three committed
hardware captures. The phase's real work is **three new things and one honest gap**.

**The three new things.** (1) A **per-module identity read over the wire**: `SERIALNUMBER/FETCH` ->
`SERIALNUMBER/REPORT` carries `WORD0..WORD3`, the module's eFuse MAC on ESP32-S3, and the field
offsets in `@intechstudio/grid-protocol@1.20260825.1135` are byte-identical to `grid-fw`'s
`grid_protocol.h:955-965`. That is the durable-snapshot key D-04 asks for, and nothing else in
reach is both stable and non-colliding. (2) A **separate install store** that borrows the session's
transport, owns the snapshot, the three actions and the write-failure taxonomy - separate because
Phase 6's never-writes gate is a source scan of `session.svelte.ts` and must stay green. (3) A
**strings channel** from the tuner to the install action: nothing today carries the compiled Setup and
Timer out of `buildTuner` - only the meter numbers, the ladder and the stamp - so `Tuner` gains one
emit and `TuningRegion` one report.

**The honest gap.** `SKELETON-RESULTS.md` section (b) says it in advance: 0 ms pre-send pacing was
never tested against back-to-back 690-957 byte `CONFIG/EXECUTE` frames, which is exactly what an
install is. The module's 2,048-byte receive ring silently discards a whole message it cannot fit
(`grid_transport.c:151-153`) and a discarded write produces a timeout with no NACK. The first real
install of a large config **is** that experiment. The mitigation is one field and no new machinery:
the install queue's `preSendDelayMs` starts at 0 and escalates to `DESKTOP_PRE_SEND_DELAY_MS` (10)
after a timeout-with-no-NACK, so the RETRY the user is already offered runs the experiment.

The string pin D-10 asks for is exact and was measured: with `reserved = {setup:0, timer:0}`,
`cost(result).setup.used === result.setupLua.length` for **all nine presets, both events, zero
mismatches**, and every Lua entry's rendered text is already asserted to be a fixed point of
`compressScript`. So "what is written is byte-for-byte what the meters measured" is not a slogan -
it is `expect(written.setup).toBe(compiled.setupLua)` and `expect(written.setup.length).toBe(cost.setup.used)`.

**Primary recommendation:** build `src/lib/device/install.svelte.ts` as a second runes store that
takes the session's transport and identity, drives one `RequestQueue` through a generalised
`writeBoth(queue, target, {setup, timer})` (Phase 2's `writeBack` widened from `FetchedPair` to two
strings), keys its `localStorage` record on a new `fetchSerialNumber()` descriptor - the fifth and
last outbound instruction HANGAR will ever have - and holds the snapshot as `moduleId -> page ->
{setup, timer}`. Never register a second `transport.onData`; the session owns the byte stream and
must expose a class-sink subscription instead.

</research_summary>

<standard_stack>

## Standard Stack

No new dependency. Phase 7 adds zero packages; every capability it needs is already pinned.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@intechstudio/grid-protocol` | **1.20260825.1135** (exact pin, no caret) | `encode_packet` / `decode_packet_frame` / `decode_packet_classes` for the fifth descriptor; `GridScript.compressScript` behind `padReady()` for the meters | Its version is a firmware datestamp, not semver. `docs/PIN-POLICY.md` governs a bump. Verified: it already carries `SERIALNUMBER_WORD0..3` at offsets 5/13/21/29, length 8, identical to `grid-fw`. |
| `svelte` | 5.x (runes) | The install store, same shape as `session.svelte.ts` | Scalars and `$state.raw` only; the transport, the queue and the scanner stay plain private fields. |
| `@types/w3c-web-serial` | 1.0.8 | `SerialPort` typings | Already installed; `getInfo()` is typed as VID/PID only, which is the fact that forces the wire-level identity. |

### Supporting - all in-tree, all reused rather than rebuilt

| Module | Purpose | When to Use |
|--------|---------|-------------|
| `src/lib/transport/queue.ts` `RequestQueue` | One outstanding request, ACK-only resolution, bounded retries, `NackError` / `AbortedError`, `sendImmediate` for the restore heartbeat | Every install action. Construct **one per connection**, not one per click. |
| `src/lib/transport/sequence.ts` `fetchBoth` / `writeBack` / `storeToFlash` / `restorePageChange` | The four hardware-proven sequences | `fetchBoth` verbatim for the snapshot and for the re-fetch proof; `writeBack` **generalised** to take two strings; `storeToFlash` with its `storeAllowed` throw removed or bypassed (SAFE-06 supersedes it); `restorePageChange` in a `finally` on every write path. |
| `src/lib/protocol/descriptors.ts` | The **only** module allowed to call `encode_packet` | Add `fetchSerialNumber(sx, sy)`. Fifth and final descriptor. |
| `src/lib/protocol/write-guard.ts` `canWriteBack` | The "snapshot present and non-empty" test D-03 names | Gate every write control on it. Its empty-string branch is exactly the shape a fetch of a non-active page produces. |
| `src/lib/transport/fake.ts` `FakeTransport` | Five faults: `drop`, `delay`, `disconnect`, `corrupt`, `truncate` | Every failure in the taxonomy below maps to one of these, plus `nth` for the partial-ACK case. |
| `src/lib/transport/fixtures/synthetic.ts` `zonaResponder` | A scripted ZONA for live-mode fakes | Extend with: SERIALNUMBER, a `flash` store distinct from `ram`, and the `currentpage` NACK. |
| `src/lib/browse/return.ts` | The injected-`Storage` pattern (`ReturnStore = Pick<Storage, "getItem"|"setItem"|"removeItem">`, `undefined` during prerender, nothing throws) | Copy it exactly for the snapshot store. It is already the house shape and already spec-guarded. |
| `src/lib/pad/index.ts` | `compileState`, `costOf`, `validateCompiled` - all behind `padReady()` | The pre-wire budget assertion and the compiled strings. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A new `install.svelte.ts` store | Grow `session.svelte.ts` | Rejected. Phase 6 plan 06-04 test 15's second half scans `session.svelte.ts` for `.write(`, `RequestQueue`, `sendConfig`, `storePage`, `fetchConfig`, `writeBack`, `storeToFlash`, `hostHeartbeat`. Growing the session turns that gate red and there is no honest replacement for it. A separate file keeps a real structural guarantee. |
| A generalised `writeBoth(q, target, strings)` | The vendored `writePad(adapter, result)` (`_pad.ts:3898`) | Rejected as the primary path, adopted as a source. `writePad` gives Timer-first, `withRetry(label, 3)`, `PadPartialWriteError` and a `validate()` gate for free - but it needs a `CompileResult`, and `PUT BACK` has only two strings. Two writers that must agree about ordering is exactly the drift SAFE-03 cannot afford. **Use one string-taking writer for all three clicks; reuse `PadPartialWriteError`'s vocabulary and cite `_pad.ts:3908-3933` for the ordering rationale.** |
| Keying the snapshot on `SERIALNUMBER` | Keying on `hwcfg + firmware + hash(fetched strings)` | Rejected, and it is worth writing down why: **the fetched strings change the moment `TRY ON DEVICE` runs**, so a content-derived key would stop finding its own snapshot immediately after the first write - the precise moment `PUT BACK` matters most. It also collides on two identical modules. It is not a weaker fallback; it is a broken one. |
| Keying on `SERIALNUMBER` | Session-only snapshot (no `localStorage`) | This **is** the fallback when `SERIALNUMBER/FETCH` times out (unknown firmware). `PUT BACK` still works for the life of the tab; the copy says so. Never silently pretend durability. |
| One `RequestQueue` per connection | One per action | Rejected. `sendImmediate` drops a heartbeat when a write is in flight (`queue.ts:120-130`), and two queues over one transport would let a restore be dropped by the other queue's write. One queue also gives free serialisation of the three clicks. |

**Installation:** none.

```bash
# Nothing to install. Verified against the lockfile on 2026-09-05:
#   @intechstudio/grid-protocol  1.20260825.1135  (exact pin - do not bump for this phase)
#   @types/w3c-web-serial        ^1.0.8
```

</standard_stack>

<architecture_patterns>

## Architecture Patterns

### Recommended Project Structure

```
src/lib/device/
├── session.svelte.ts        # Phase 6. UNCHANGED except two additions (below)
├── install.svelte.ts        # NEW: snapshot, three actions, install phases, failure taxonomy
├── install-copy.ts          # NEW: every install sentence, import-free (session-copy's twin)
├── snapshot.ts              # NEW: pure. the record schema, the key, read/write over an injected Storage
├── snapshot.spec.ts
├── install.spec.ts
└── try-on.ts                # Phase 4. unchanged

src/lib/protocol/
└── descriptors.ts           # + fetchSerialNumber(sx, sy)   <- the fifth and last

src/lib/transport/
└── sequence.ts              # writeBack widened to writeBoth(q, target, {setup, timer})
                             # + fetchSerialNumber sequence helper + moduleKey()

src/lib/ui/
├── TryOnDevice.svelte       # the primary click becomes a write; honesty literal changes
├── KeepOnDevice.svelte      # enabled; owns the inline confirmation block
├── PutBack.svelte           # NEW: secondary, beside KEEP ON DEVICE, only when a snapshot exists
└── TuningRegion.svelte      # + onconfig report (the compiled strings)

src/routes/dev/install/      # NEW probe route (or an extension of /dev/session/)
docs/INSTALL-RUNBOOK.md      # NEW: the six hardware rows
```

### Pattern 1: The fifth descriptor, and why it is addressed rather than broadcast

**What:** `SERIALNUMBER/FETCH` addressed to the ZONA's own `SX/SY`, answered by a globally-addressed
`SERIALNUMBER/REPORT` carrying four 32-bit words.
**When to use:** once, immediately after the session reaches `connected`, before the snapshot fetch.

```ts
// src/lib/protocol/descriptors.ts - the fifth and last outbound instruction.
//
// Firmware: grid_decode.c:839-869. The FETCH is accepted with
// GRID_DESTINATION_IS_ME | GRID_DESTINATION_IS_GLOBAL, so a broadcast would make
// EVERY module on the bus answer - and the REPORT is built with
// grid_msg_init_brc(..., GRID_PARAMETER_GLOBAL_POSITION, ...), so all of those
// answers would carry SX/SY -127,-127 and be indistinguishable from each other.
// Address it to the ZONA. That is the whole reason this takes sx and sy.
//
// The REPORT sets no LASTHEADER, so correlateById is FALSE, and the filter names
// no address at all - for the same reason storePage()'s does not.
export function fetchSerialNumber(sx: number, sy: number): GridRequest {
  return {
    label: "fetch-serial",
    descr: {
      brc_parameters: { DX: sx, DY: sy },
      class_name: "SERIALNUMBER",
      class_instr: "FETCH",
      class_parameters: {},
    },
    filter: { class_name: "SERIALNUMBER", class_instr: "REPORT" },
    timeoutMs: TIMEOUTS.fetchMs,
    correlateById: false,
  };
}

/** 32 hex characters. Deterministic, stable across power cycles, per chip. */
export function moduleKeyOf(cls: DecodedClass): string {
  const w = (k: string) => (Number(cls.class_parameters[k]) >>> 0)
    .toString(16).padStart(8, "0");
  return w("WORD0") + w("WORD1") + w("WORD2") + w("WORD3");
}
```

Verified by round-trip against the pinned package on 2026-09-05:
`encode_packet({class_name:"SERIALNUMBER", class_instr:"REPORT", class_parameters:{WORD0:0x12345678,
WORD1:0x9abcdef0, WORD2:0, WORD3:0}})` decodes back to
`{"WORD0":305419896,"WORD1":2596069104,"WORD2":0,"WORD3":0}` with
`brc {DX:-127, DY:-127, SX:-127, SY:-127}`.

### Pattern 2: The session exposes two new seams, and writes nothing

**What:** Phase 6's session keeps every one of its properties. Phase 7 adds exactly two members, and
neither contains a forbidden needle, so plan 06-04's source scan stays green with no edit.

```ts
// src/lib/device/session.svelte.ts - the two additions, and nothing else.

/**
 * The open transport, or undefined. Phase 7's install store borrows it; this
 * file still never writes through it, and the scan in session.spec.ts test 15
 * still passes because none of its forbidden needles appears here.
 */
get transport(): GridTransport | undefined { return this.#transport; }

/**
 * Subscribe to every decoded class from the session's ONE frame pump.
 *
 * GridTransport carries exactly ONE onData callback - "whoever registers last
 * owns the byte stream" (06-04-PLAN). After identification the session owns it,
 * and it is what keeps the active page and the rig tail true. A second
 * transport.onData() from the install store would silently unhook the fold: the
 * page number on screen would freeze at its connect-time value and a page change
 * would then make every write NACK with no explanation on screen.
 *
 * So the queue is fed from HERE, exactly as the skeleton page feeds it
 * (routes/dev/skeleton/+page.svelte:224-239: identity first, then the queue).
 */
onClass(cb: (cls: DecodedClass) => void): () => void;
```

The session's existing `onClose` -> teardown path must also call the install store's abort, or the
install store registers its own close handler through the same seam. Phase 2's skeleton does exactly
this: `grid.onClose((reason) => { ...; queue?.abort(reason); })`.

### Pattern 3: One writer for all three clicks

**What:** Phase 2's `writeBack` widened from `FetchedPair` to two strings, so `TRY ON DEVICE` and
`PUT BACK` are literally the same code path.
**When to use:** every RAM write.

```ts
// src/lib/transport/sequence.ts

export interface EventStrings { setup: string; timer: string }

/**
 * Write both events into the module's RAM, in the field-tested order.
 *
 * TIMER (6) FIRST, THEN SETUP (0). _pad.ts:3908-3913 gives the reason and it is
 * not stylistic: gtt is a no-op until the Timer event holds at least one stored
 * action, and Setup runs immediately in the live VM - so a Setup-first write
 * arms a timer that does not exist yet and the pad simply sits still. It is also
 * why the BOTOR mixed-state incident left the Timer landed and the Setup missing
 * rather than the reverse. Sequential, one acknowledgement at a time, each under
 * its own pinned step id, so a half-landed write names which half landed.
 */
export async function writeBoth(
  q: RequestQueue,
  target: { sx: number; sy: number; page: number },
  s: EventStrings,
): Promise<void> {
  await q.request(sendConfig(target.sx, target.sy, target.page, EVENT_TIMER, s.timer), "write-timer");
  await q.request(sendConfig(target.sx, target.sy, target.page, EVENT_SETUP, s.setup), "write-setup");
}

/** Phase 2's caller, unchanged in behaviour, now a two-line adapter. */
export async function writeBack(q: RequestQueue, id: Identity, f: FetchedPair): Promise<void> {
  await writeBoth(q, { sx: id.zona.sx, sy: id.zona.sy, page: id.activePage }, {
    setup: f.setup.actionString ?? "",
    timer: f.timer.actionString ?? "",
  });
}
```

Every caller wraps it the way `runNoOpCycle` does:

```ts
try {
  await writeBoth(q, target, strings);
} finally {
  // MANDATORY, on every path including the failed one. A successful
  // CONFIG/EXECUTE sets page_change_enabled = 0 (grid_decode.c:1279) and the
  // ONLY thing that sets it back is an inbound HEARTBEAT TYPE 255
  // (grid_decode.c:717); firmware's own timeout restore is commented out
  // (grid_esp32_port.c:480). Without this the visitor's ZONA cannot change page
  // until it is power-cycled - and a half-landed write is exactly the case where
  // it would otherwise be skipped.
  await restorePageChange(q);
}
```

### Pattern 4: The snapshot record, keyed twice

**What:** `localStorage` holds one record per module; each record holds one snapshot **per page**.
**When to use:** always. The second key level is not tidiness - see Pitfall 4.

```ts
// src/lib/device/snapshot.ts - pure, imports nothing, never throws.

export const SNAPSHOT_KEY = "hangar.snapshot.v1";

export type EventPair = { readonly setup: string; readonly timer: string };
export type ModuleSnapshot = {
  /** 32 hex characters from SERIALNUMBER/REPORT. */
  readonly moduleId: string;
  /** Page number -> the strings that module held on that page when we first saw it. */
  readonly pages: Readonly<Record<string, EventPair & { readonly takenAt: string }>>;
};

/** Anything with the three methods; undefined during prerender. Never throws. */
export type SnapshotStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function readSnapshot(store: SnapshotStore | undefined, moduleId: string): ModuleSnapshot | undefined;
export function writeSnapshot(store: SnapshotStore | undefined, snap: ModuleSnapshot): void;
```

The store is reached exactly the way `BrowseLink.svelte:120-127` reaches `sessionStorage` - a
property access on `window.localStorage` can itself throw in a browser configured to refuse storage:

```ts
function snapshotStore(): SnapshotStore | undefined {
  try { return window.localStorage; } catch { return undefined; }
}
```

**Never overwrite an existing page entry.** The snapshot is the module's *original*, not its latest.
Once `TRY ON DEVICE` has written, a re-connect's `fetchBoth` returns HANGAR's own configuration, and
overwriting would destroy the only copy of what the visitor came in with. Write only when the key is
absent for that page.

### Pattern 5: The strings channel from the tuner

**What:** `buildTuner` already computes both strings at the same instant it computes both meter
numbers; today it publishes only the numbers. One emit closes the gap and makes D-10's pin structural
rather than an assertion about two separate compiles.

```ts
// src/lib/tune/model.ts

/** The exact bytes a write would put on the wire, beside the numbers that measured them. */
export type ConfigStrings = { setup: string; timer: string };

export type TunerOptions = {
  // ... existing ...
  /** The compiled pair, emitted with every settled measurement. Undefined while measuring. */
  onconfig?(config: ConfigStrings | undefined): void;
};

// measurePadsim: the compile is already in hand.
const result = await compileState(state);
const measured = await costOf(result, options.reserved);
if (stale(mine)) return;
land(measured.setup.used, measured.timer.used);
options.onconfig?.({ setup: result.setupLua, timer: result.timerLua });

// measureLuaRoute: renderLua already produced exactly the wire text.
const lua = renderLua(entry, indices);
// ...
options.onconfig?.({ setup: lua.setup, timer: lua.timer });
```

`TuningRegion.svelte` reports it upward with `onconfig`, `Coverflow.svelte` holds it beside
`overBudgetReason`, and it reaches `TryOnDevice.svelte` as a prop. `onconfig(undefined)` on every knob
move (feed goes `stale`) is what makes "the debounce cannot land a new compile between click and
write" a structural property rather than a race - see Pitfall 5.

### Pattern 6: The install state machine

`idle -> snapshotting -> ready -> writing -> settled` with five named failures. It lives in the
install store, **not** in the session: Phase 6's UI contract is nine session phases and this phase
renders no tenth.

| Phase | Meaning | Controls |
|-------|---------|----------|
| `idle` | no session, or session not `connected` | all three disabled, reason inline |
| `snapshotting` | serial-number fetch + `fetchBoth` in flight | all three disabled, "reading what is on your ZONA" |
| `ready` | snapshot present and `canWriteBack(...).ok` | `TRY ON DEVICE` enabled (unless over budget); `PUT BACK` shown |
| `writing` | one action in flight | all three disabled |
| `settled` | both ACKs arrived | "on your ZONA now"; `KEEP ON DEVICE` enabled |
| `kept` | PAGESTORE ACK + re-fetch byte-identical | "kept - it survives a power cycle" |
| `snapshot-failed` | fetch failed or returned an empty string | **all write controls stay disabled**, reason inline, RETRY offered |
| `partial` | one event ACK'd, the other did not | names which half; RETRY (the missing half only) **and** `PUT BACK` |
| `refused` | a NACK arrived | names the five firmware conditions; never retried |
| `lost` | the link died mid-write | names it; `PUT BACK` offered but explains it needs a reconnect first |
| `kept-unconfirmed` | PAGESTORE ACK'd, the re-fetch never matched inside the bound | honest: "stored, but the module has not read it back yet" |

### Anti-Patterns to Avoid

- **Registering a second `transport.onData`.** Silently unhooks the session's identity fold. Use the
  `onClass` seam.
- **Two `RequestQueue` instances over one transport.** `sendImmediate` drops the restore heartbeat
  when *its own* queue has a write in flight; it cannot see the other queue's.
- **Reusing `_pad.ts`'s `isTransient` regex for retry classification.** `TRANSIENT_WRITE =
  /interrupted|timeout|timed out|busy|no response/i` matches `AbortedError`'s message *"Waiting for
  response was interrupted (…)"* - a dead link, which must never be retried. The queue already
  exposes precise typed errors; classify on `instanceof NackError` / `instanceof AbortedError`.
- **Writing `compressScript(setupLua)` instead of `setupLua`.** It is 1 character per action shorter
  and it breaks the byte-for-byte meter pin for nothing. See Pattern 7 / the measurement below.
- **Enabling `KEEP ON DEVICE` before a `settled` RAM write.** Storing flash from a RAM state the user
  has not seen is the one ordering SAFE-02 exists to prevent, and `KeepOnDevice.svelte`'s shipped
  reason already promises "available after a try-on".
- **Trusting `Identity.storeAllowed`.** It is Phase 2's D-12 skeleton rule ("another module is on the
  bus, so the store is disabled"). SAFE-06 explicitly supersedes it. `storeToFlash()` throws on it
  today; that throw must go, and the multi-module case becomes a *confirmation sentence*, not a
  refusal.

</architecture_patterns>

<dont_hand_roll>

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ACK-only completion | A `write()` + `setTimeout` | `RequestQueue.request()` | It already resolves only on a matching decoded class, correlates on the id firmware echoes into `LASTHEADER`, and rejects a `HEARTBEAT` before it looks at anything else (`match.ts:29-32`). A module beats 4x/s and would satisfy a loose filter. |
| Bounded retry + backoff | A recursive retry | `RETRY_ATTEMPTS = 3`, `retryBackoffMs = 120*(n+1)` | Already shipped, already matching the vendored `withRetry` backoff by design ("so Phase 7 inherits one policy", `constants.ts`). The desktop's unbounded recursion (`engine.store.ts:337`) is the thing being avoided. |
| The write ordering and its rationale | A fresh argument about which event goes first | `_pad.ts:3908-3913` + `sequence.ts writeBack` | `gtt` is a no-op until the Timer event holds a stored action; Setup runs immediately in the live VM. Both the vendored compiler and `docs/HARDWARE-AUDITION.md` state it, and Phase 2 proved it on hardware six times. |
| The partial-write vocabulary | Inventing a name and a sentence | `PadPartialWriteError` (`_pad.ts:3460-3473`) | *"The {failed} event did not save, so the pad is running a mixed configuration. Try again."* Fields `wrote: PadEventName[]`, `failed: PadEventName`, `cause`. It was written from a real observed hardware incident. |
| The pre-wire budget refusal | A length check | `validateCompiled(result, reserved)` filtered to `severity === "error"` | `writePad` does exactly this before its first write. It catches the syntax case too, which a length check cannot: `compressScript` **throws** on unparseable Lua. |
| The snapshot's non-empty test | `if (s !== "")` | `canWriteBack([setup, timer])` | It already knows the four ways a fetched string is untrustworthy, including the one that matters: on a recall failure firmware sends a NACK **and then still sends the REPORT** with `ACTIONLENGTH 0` and a zeroed buffer (`grid_decode.c:1315-1360`). An empty string is exactly the shape a fetch of a non-active page produces. |
| A `localStorage` wrapper | try/catch scattered at call sites | `src/lib/browse/return.ts`'s injected-`Storage` shape | Pure, import-free, `undefined` during prerender, nothing throws, and `return.spec.ts` already guards the pattern. |
| The rx framing | A new scanner | `FrameScanner` | EOT+LF with a cursor and an 8 KB ceiling. Its known limitation (the delimiter is not escape-safe) is exactly why `sendConfig` asserts printable ASCII before a write. |
| A fake ZONA for tests | A new mock | `FakeTransport` + `zonaResponder` | Five faults already cover the entire taxonomy below, `fromCapture` replays real chunk boundaries, and the responder reads the request id **off the wire** so "the ACK echoes the request id" is a genuine round trip. |

**Key insight:** every hard part of this phase has already been solved once in this repository, on
hardware, with the reasoning written next to the code. The phase's risk is not in the writing - it is
in the four places where Phase 7 needs something that has never existed: a wire-level module identity,
a second consumer of one byte stream, a durable record that must survive its own writes, and a
settle-after-store timing nobody has measured.

</dont_hand_roll>

## Runtime State Inventory

Phase 7 is not a rename or a refactor, but it **creates persistent runtime state for the first time in
this project**, so the inventory is worth doing in the same five categories.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **NEW: `localStorage["hangar.snapshot.v1"]`** - the only persistent HANGAR state that has ever existed. Today the repo uses `sessionStorage` once (`hangar.browse.return`, `src/lib/browse/return.ts`) and nothing else. | Code: the record schema is versioned in its key (`.v1`); an unreadable or wrong-version record degrades to "no durable snapshot", never to a partial restore - the same rule SHARE-03 already applies to stamps. No migration exists to write. |
| Live service config | **The ZONA's own RAM and flash.** This is the category that matters: after `TRY ON DEVICE` the module's RAM holds HANGAR's config; after `KEEP ON DEVICE` its flash does. Neither is in git and neither is recoverable from this repository. | The snapshot **is** the migration. It must be taken before the first write and never overwritten (Pattern 4). `docs/INSTALL-RUNBOOK.md` row F is the last-resort recovery (Grid Editor). |
| OS-registered state | **The browser's serial permission grant**, per origin, keyed internally by VID/PID and the module's per-chip serial (Chromium `SerialChooserContext`). Phase 2 measured it surviving a full browser restart on `http://127.0.0.1:4173`. `SerialPort.forget()` (Phase 6 D-10) revokes it. | None for Phase 7 - but note the interaction: `FORGET THIS ZONA` revokes the grant and **does not** clear the snapshot. That is correct (the snapshot is the way back) and the copy must say so. |
| Secrets / env vars | None. `.dev.vars` holds only the Basic Auth gate credentials, unchanged. | None. |
| Build artifacts | None new. The install path adds no asset; the formatter WASM is already lazy and already needed by the tuner before install is reachable. | None. |

## Common Pitfalls

### Pitfall 1: A second `transport.onData` silently unhooks the session

**What goes wrong:** the install store registers its own data callback to feed its `RequestQueue`. The
queue works. The header's page number freezes at its connect-time value, the rig tail stops filling,
and then a write NACKs for a reason nothing on screen can explain.
**Why it happens:** `GridTransport` carries exactly **one** `onData` callback (`transport.ts:12`,
`web-serial.ts:126`, `fake.ts:110`). Whoever registers last owns the byte stream. Phase 6 plan 06-04
registers the session's fold after `identifyOnly` resolves, and says so in its own words.
**How to avoid:** the session exposes `onClass(cb): () => void`; the install store subscribes. The
skeleton page is the shape to copy: identity first, then the queue, both inside one pump
(`routes/dev/skeleton/+page.svelte:224-239`).
**Warning signs:** a spec that constructs an install store and finds `session.identity` never updating
after the first heartbeat.

### Pitfall 2: `sendImmediate` drops the restore heartbeat, and the drop is silent-ish

**What goes wrong:** `restorePageChange` is called while a write is in flight; it is **dropped, not
queued** (`queue.ts:120-130`, mirroring `SendHeartbeatImmediate.executeOn`). The step is emitted with
`outcome: "aborted"` and the message *"dropped: a write was already in flight"* - but nothing on
screen reads steps. The visitor's ZONA is left unable to change page until it is power-cycled.
**Why it happens:** two overlapping actions, or a `finally` that runs before an awaited write settled.
**How to avoid:** (a) one in-flight install action at a time, guarded in the store, not just in the
queue; (b) `restorePageChange` only after both `q.request(...)` calls have settled, in a `finally`;
(c) assert it in a spec - "after every write path, including the failed ones, exactly one
`restore-page-change` step with `outcome: 'sent'`". `fixtures.spec.ts` test 4 already asserts the
one-restore-per-`write-setup` invariant for Phase 2's arms; extend the same rule.
**Warning signs:** a capture with a `restore-page-change` step whose outcome is `aborted`.

### Pitfall 3: 0 ms pacing has never met a 957-byte write

**What goes wrong:** a `CONFIG/EXECUTE` times out with no NACK and no explanation. Retrying at the
same pace fails the same way.
**Why it happens:** a `CONFIG/EXECUTE` is `49 + ACTIONLENGTH` bytes on the wire - 690 for the factory
Setup, **957 at the 908-character budget**. Two of those back to back is 1,380-1,914 bytes against a
2,048-byte per-port ring (`grid_transport.h:13`) fed by a 512-byte TinyUSB CDC RX buffer
(`tusb_config.h:39`), and the ring **discards a whole message silently** when it cannot fit
(`grid_transport.c:151-153`). `PRE_SEND_DELAY_MS` was set to 0 on the strength of a burst probe whose
outbound frames were **49 bytes**. `SKELETON-RESULTS.md` section (b) caveat 3 names this as Phase 7's
first experiment, in advance.
**How to avoid:** the install store owns a `preSendDelayMs` field, initialised to `PRE_SEND_DELAY_MS`
(0). On a `write-*` step that ends `outcome: "timeout"` with **zero** NACKs anywhere in the action,
set it to `DESKTOP_PRE_SEND_DELAY_MS` (10) and rebuild the queue; the RETRY the visitor is already
offered then runs at 10 ms. One field, no new machinery, and the constant already exists and is
already documented as existing for exactly this. Cost when it fires: +20 ms on a ~40 ms operation.
**Warning signs:** `outcome: "timeout"`, `attempts: 3`, `nacks: 0` on a `write-setup` step whose
`ACTIONSTRING` was long. Record it in the runbook so the answer is measured rather than assumed.

### Pitfall 4: A snapshot from a different page than the one written

**What goes wrong:** the visitor changes the ZONA's page (a `gpl()` from Lua, or a page control)
between the snapshot and the write. `PUT BACK` then writes page 3's original onto page 1.
**Why it happens:** the snapshot's page and the write's page are two different reads of a value that
moves. The session's continuous fold (Phase 6) republishes the active page as it changes, which is
correct and which makes the mismatch reachable.
**How to avoid, in three layers:**
1. **Firmware is the backstop and it is a hard one.** `grid_decode.c:1272` computes
   `bool currentpage = page == grid_ui_state.page_activepage;` and a CONFIG/EXECUTE that fails it is
   **NACK'd, not written**. A cross-page write is therefore impossible, not merely discouraged.
2. **The record is keyed by page** (Pattern 4), so a page change accumulates a second snapshot rather
   than shadowing the first.
3. **Re-snapshot on a page change.** When `session.identity.activePage` changes while `ready`, drop
   back to `snapshotting` for the new page. That is also what makes `TRY ON DEVICE` safe after a page
   change: it writes to the page it just snapshotted.
   Note the one thing `page_change_enabled` buys here: after the first successful write the module
   cannot change page at all until the restore heartbeat goes out, so the window is narrow - but the
   window before the first write is wide open.
**Warning signs:** a `NackError` on `write-timer` with the module reporting a different active page
than the snapshot's.

### Pitfall 5: The debounce lands a new compile between the click and the write

**What goes wrong:** the visitor drags a knob and clicks `TRY ON DEVICE` inside the 120 ms
`COMPILE_DEBOUNCE_MS` window. The meters still show the previous numbers; the strings the store holds
are the previous strings; what reaches the wire is not what was on screen.
**Why it happens:** `model.ts` schedules the recompile on a trailing 120 ms timer and marks the feed
`stale` in the meantime.
**How to avoid:** `onconfig(undefined)` is emitted at exactly the same instant the feed goes `stale`
(inside `moveTo`), and the install store treats `config === undefined` as "not ready to write" -
`TRY ON DEVICE` is disabled for those 120 ms with the same *measuring* language the meters already
use. The alternative - awaiting a fresh compile inside the click handler - is worse: it puts an await
in front of a write for no gain, and 120 ms of a disabled primary control is invisible next to the
"about a second" the copy promises anyway.
**Warning signs:** a spec that clicks immediately after `set()` and finds a write with the old string.

### Pitfall 6: The re-fetch after `KEEP ON DEVICE` races the module's own page reload

**What goes wrong:** the PAGESTORE ACK arrives, the re-fetch goes straight out, and the REPORT comes
back with a partially-loaded or stale string. The panel says the store failed when it did not.
**Why it happens:** `grid_protocol_nvm_store_success_callback` (`grid_decode.c:947-961`) sends the
ACK and then calls `grid_ui_page_clear_template_parameters` and
`grid_ui_bulk_start_with_state(..., grid_ui_bulk_page_load, activepage, 0, NULL)`. So at the moment
the ACK is observed a page-load bulk operation has just **started**. `CONFIG/FETCH` has **no bulk
guard** (`grid_decode.c:1315-1360`) - it reads `grid_ui_event_recall_configuration` directly. Nobody
has measured how long that load takes.
**How to avoid:** a bounded re-fetch-until-match: up to 3 rounds, `retryBackoffMs` between them,
success on the first byte-identical pair. On exhaustion the state is `kept-unconfirmed` with an honest
sentence - the ACK already means stored; the re-fetch is a proof, not the definition. Add a runbook
row that records **how many rounds it actually took**, so a later phase replaces this guess with a
measurement. Worst-case bound: 3 x (2 x 300 ms + 120 ms) = 2.2 s, which is why it is a settle state
and not a spinner.
**Warning signs:** a first-round mismatch that a second round resolves. That is the signal, and it is
worth logging in the capture rather than swallowing.

### Pitfall 7: A NACK is a refusal and must never be retried

**What goes wrong:** a retry loop hammers a deterministic refusal three times and then reports a
timeout, hiding the actual cause.
**Why it happens:** firmware NACKs a `CONFIG/EXECUTE` for exactly five deterministic reasons
(`grid_decode.c:1270-1276`): `validlength` (`scriptlength <= ACTIONSTRING_maxlength`), `endswithetx`
(`script[scriptlength] == ETX`), `currentpage`, `validelement`, and the event existing on the element.
None of them changes on a retry.
**How to avoid:** the queue already does the right thing (`queue.ts:246-258` refuses to retry
`NackError` and `AbortedError`). The install store must **not** wrap it in a retry of its own, and the
`refused` state's copy should name the two conditions a visitor can act on: the page moved under you,
or the configuration is too long. Firmware also emits a `DEBUGTEXT` on this path -
`"failed to set config, conditions: %d%d%d%d%d%d"` - which is worth recording in the capture even
though nothing on screen reads it.
**Warning signs:** three attempts recorded for a step whose outcome is `nack`. That is a bug in the
caller, not in the queue.

### Pitfall 8: On a rig, one PAGESTORE produces N acknowledgements

**What goes wrong:** nothing, if the queue is understood; a confusing extra frame if it is not.
**Why it happens:** `storePage()` addresses `DX/DY = -127,-127` and firmware accepts it with
`IS_ME | IS_GLOBAL`, so **every** module on the bus stores its own active page and each answers with
its own `PAGESTORE/ACKNOWLEDGE` echoing the same `LASTHEADER`. The queue resolves on the first and
clears its waiter, so the rest are delivered to nobody (`queue.ts:139`, `settle` nulls `this.waiter`).
That is correct behaviour and it is also SAFE-06's whole reason for existing: the confirmation must
say that the other modules' current pages are stored too.
**How to avoid:** nothing to fix. Assert it: a rig fixture where three modules ACK and the store
resolves once with no error. And **delete the `storeAllowed` throw** in `storeToFlash` - Phase 2's
D-12 refuse-on-rig is explicitly superseded.
**Warning signs:** a spec that asserts exactly one inbound PAGESTORE ACK.

### Pitfall 9: `localStorage` quota, private mode, and a record that outlives its schema

**What goes wrong:** a `setItem` throws in a private window or on a full quota, inside the connect
path, and the panel never reaches `ready`.
**Why it happens:** `window.localStorage` can throw on **property access**, not only on use
(`BrowseLink.svelte:44-52` documents this). And a `QuotaExceededError` on `setItem` is a real
possibility once two ZONAs x a few pages x up to 1,816 characters each accumulate - small, but not
zero.
**How to avoid:** the same shape `return.ts` uses. Nothing throws; every failure degrades to
"snapshot held for this tab only" with the copy saying so. The durable half is a courtesy;
**the in-memory snapshot is the safety rail and it must never depend on storage succeeding.** Take
the snapshot into memory first, then try to persist it.
**Warning signs:** a spec that passes a store which throws and finds the install store stuck in
`snapshotting`.

### Pitfall 10: The shipped copy says HANGAR never writes

**What goes wrong:** Phase 7 enables writes and leaves a sentence on screen promising it does not.
**Why it happens:** two literals in `TryOnDevice.svelte` are Phase 4's and are load-bearing:
`HONESTY` = *"Connects to your ZONA and identifies it. Writing arrives in the next release - this
never writes."* and `identifiedBody`'s *"Nothing was written, and nothing will be until install ships
in the next release."* Both are in the honesty slot whose 72 px reservation and three sizing twins are
a shipped layout invariant (Phase 6 plan 06-12: "unchanged. No fourth string.").
**How to avoid:** change both literals in this phase, keep the slot at three strings, and re-measure
the sizing twin - the *longest* of the three still decides the reservation, and today that is
`tryOnBudgetReason("Setup and Timer")`. SAFE-01's promise becomes "nothing is written without a click"
rather than "nothing is written", which is the sentence CONTEXT.md D-01 actually asks for.
**Warning signs:** `e2e/first-experience.e2e.ts` still green while the panel promises something false -
that test asserts the *unsupported* copy, not the honesty line, so it will not catch this. Add the
assertion.

### Pitfall 11: A write racing a replug

**What goes wrong:** the module is unplugged mid-write. The read loop errors, `onClose` fires,
`queue.abort(reason)` rejects the pending waiter with `AbortedError`, and the action ends. Then the
module is replugged, the session adopts a **new** `SerialPort` object, and a stale in-flight action
resumes against a dead transport.
**Why it happens:** Chromium mints a fresh token for a re-added wired port, so the replugged port is a
different object (Phase 6 06-04-PLAN, the replug identity trap). An install action holding a captured
`transport` reference would not notice.
**How to avoid:** the install store keys every in-flight action to a **connection generation** that
the session bumps on every adopt/teardown, and discards any result whose generation is stale - the
same `generation` pattern `model.ts` already uses for the debounced compile. The `lost` state also
explicitly says `PUT BACK` needs a reconnect first, because a `PUT BACK` offered on a dead link would
fail identically to the write that just failed.
**Warning signs:** a spec that disconnects mid-write, reconnects, and finds two queues or two
snapshots alive.

<code_examples>

## Code Examples

### The snapshot, at connect, before any control enables

```ts
// src/lib/device/install.svelte.ts (sketch)
//
// Order matters and each step is a gate on the next:
//   1. the module names itself         -> the localStorage key exists
//   2. both strings come back non-empty -> canWriteBack passes
//   3. only then does anything enable
async #snapshot(id: Identity, q: RequestQueue): Promise<void> {
  this.phase = "snapshotting";

  // 1. The key. A timeout here is NOT fatal: it degrades to a session-only
  //    snapshot, and the copy says so rather than implying durability.
  let moduleId: string | undefined;
  try {
    const cls = await q.request(fetchSerialNumber(id.zona.sx, id.zona.sy), "fetch-serial");
    moduleId = moduleKeyOf(cls);
  } catch {
    moduleId = undefined;              // durable half unavailable; in-memory half still works
  }

  // 2. The strings. Phase 2's fetchBoth, verbatim, on the module's REPORTED page.
  const pair = await fetchBoth(q, id);
  const guard = canWriteBack([pair.setup, pair.timer]);
  if (!guard.ok) { this.phase = "snapshot-failed"; this.reason = guard.reason; return; }

  // In memory FIRST. Storage is a courtesy and must never be the reason a
  // visitor has no way back (Pitfall 9).
  this.original = { setup: pair.setup.actionString!, timer: pair.timer.actionString! };
  this.originalPage = id.activePage;
  if (moduleId) persistIfAbsent(snapshotStore(), moduleId, id.activePage, this.original);

  this.phase = "ready";
}
```

### TRY ON DEVICE, and the shape every action shares

```ts
async tryOnDevice(config: ConfigStrings): Promise<void> {
  if (this.phase !== "ready" && this.phase !== "settled") return;   // one action at a time
  const gen = this.#generation;
  this.phase = "writing";
  const target = { sx: id.zona.sx, sy: id.zona.sy, page: id.activePage };
  try {
    await writeBoth(this.#queue, target, config);       // Timer then Setup, ACK each
    if (gen !== this.#generation) return;               // the link was replaced under us
    this.phase = "settled";                             // ACK-only. Never a resolved write().
  } catch (err) {
    if (gen !== this.#generation) return;
    this.#classify(err);                                // partial | refused | lost | timeout
  } finally {
    // Mandatory on every path. See Pattern 3.
    await this.#queue.sendImmediate(hostHeartbeat(), "restore-page-change").catch(() => {});
  }
}

/**
 * The taxonomy, and it is decided by TYPE, never by message text.
 *
 * _pad.ts's isTransient regex (/interrupted|timeout|timed out|busy|no response/i)
 * would classify AbortedError - "Waiting for response was interrupted (...)" -
 * as transient and retry a dead link three times. The queue already gives
 * precise classes; use them.
 */
#classify(err: unknown): void {
  const timerLanded = this.#lastSteps.some((s) => s.id === "write-timer" && s.outcome === "ok");
  if (err instanceof NackError)    { this.phase = "refused"; return; }
  if (err instanceof AbortedError) { this.phase = "lost";    return; }
  this.phase = timerLanded ? "partial" : "failed";      // timeout after 3 bounded attempts
}
```

### KEEP ON DEVICE, with the settle proof

```ts
async keepOnDevice(sent: ConfigStrings): Promise<void> {
  if (this.phase !== "settled") return;          // SAFE-02: never before a try-on
  this.phase = "writing";
  try {
    // PAGESTORE is a global broadcast. On a rig every module ACKs; the queue
    // resolves on the first and the rest are delivered to nobody. That is the
    // behaviour SAFE-06's confirmation sentence describes, not a bug.
    await this.#queue.request(storePage(), "store");

    // D-12: the module reloads the page from flash and restarts the Lua VM
    // (grid_decode.c:955-961), so a re-fetch immediately after the ACK can race
    // the load. Bounded, and honest when it runs out (Pitfall 6).
    for (let round = 0; round < 3; round++) {
      const after = await fetchBoth(this.#queue, id, "refetch");
      if (after.setup.actionString === sent.setup && after.timer.actionString === sent.timer) {
        this.phase = "kept"; return;
      }
      await sleep(retryBackoffMs(round));
    }
    this.phase = "kept-unconfirmed";
  } catch (err) { this.#classify(err); }
}
```

### The FakeTransport scripts, one per failure

```ts
// Every row of the taxonomy is one existing fault. No new fake is needed.
new FakeTransport({ responder, faults: [{ kind: "drop", match: { class_name: "CONFIG", class_instr: "ACKNOWLEDGE" }, nth: 2 }] });
//   -> the Timer ACK lands, the Setup ACK never does: PARTIAL, and it names Setup.

new FakeTransport({ responder, faults: [{ kind: "delay", match: { class_name: "CONFIG", class_instr: "ACKNOWLEDGE" }, byMs: 400 }] });
//   -> past executeMs (250): three bounded attempts, then TIMEOUT.

new FakeTransport({ responder, faults: [{ kind: "disconnect", afterTxFrames: 1 }] });
//   -> onClose -> queue.abort -> AbortedError -> LOST, never a retry.

new FakeTransport({ responder: nackOnWrongPage(state) });
//   -> NackError -> REFUSED, attempts === 1.

new FakeTransport({ responder, faults: [{ kind: "corrupt", match: { class_name: "SERIALNUMBER" } }] });
//   -> the key never arrives: session-only snapshot, and the copy says so.
```

### Extending `zonaResponder` for this phase

```ts
// src/lib/transport/fixtures/synthetic.ts
export interface ZonaState {
  sx: number; sy: number; activePage: number;
  ram: Record<number, string>;
  flash: Record<number, string>;        // NEW: what a power cycle restores
  serial: [number, number, number, number];   // NEW
}

// CONFIG/EXECUTE now models firmware's five NACK conditions - at minimum the
// currentpage one, because Pitfall 4 depends on it being real:
if (page !== state.activePage) return [configNackFrame({ lastheader: requestId })];

// PAGESTORE copies ram -> flash AND reloads flash -> ram, which is the
// Lua-VM-restart semantics D-12 is about (grid_decode.c:955-961).
state.flash = { ...state.ram };
state.ram = { ...state.flash };

// SERIALNUMBER/FETCH -> a globally addressed REPORT with four words.
```

</code_examples>

<sota_updates>

## State of the Art

Nothing in the wider ecosystem changed under this phase; every "old vs current" here is internal to
the project and to the firmware.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 2 D-12: refuse the store when a second module is on the bus | SAFE-06: allow it, name the other modules, say their pages are stored too | Phase 7 CONTEXT D-05 | `storeToFlash`'s `storeAllowed` throw must go; `Identity.storeAllowed` becomes informational. `sequence.spec.ts:154` asserts the old rule and must be rewritten, not deleted. |
| Phase 4/6: `TRY ON DEVICE` identifies and never writes | It writes to RAM | Phase 7 | Two shipped copy literals become false (Pitfall 10). |
| `PRE_SEND_DELAY_MS` decided at 0 from a 49-byte-outbound probe | Same value, now with an escalation path on the one case the probe could not reach | Phase 7 | One field on the install store; `DESKTOP_PRE_SEND_DELAY_MS` stops being read only by the `/dev/skeleton/` A/B toggle. |
| Four outbound descriptors (`forbidden-instructions.spec.ts` test 4) | **Five.** `SERIALNUMBER/FETCH` joins them | Phase 7 | The class-name set becomes `["CONFIG","HEARTBEAT","PAGESTORE","SERIALNUMBER"]`; the instr set stays `["EXECUTE","FETCH"]`. Everything else in that spec is unchanged - and `PAGEACTIVE`, `NVMERASE`, `PAGECLEAR`, `PAGEDISCARD` and `TYPE 254` stay forbidden forever. |
| `STEP_IDS` = ten ids | **+`fetch-serial`**, and `write-timer` / `write-setup` / `store` / `refetch-*` now carry install traffic as well as skeleton traffic | Phase 7 | `capture.ts`'s `STEP_IDS` union is the shared vocabulary between the sequences, the page and the gates; adding to it is a one-line change with a spec behind it. |

**Deprecated / outdated by this phase:**

- `sequence.ts storeToFlash`'s refusal message *"Another module is on the bus and a page store is a
  global broadcast, so the store is disabled"* - superseded by a confirmation, not a refusal.
- `docs/HARDWARE-AUDITION.md`'s premise *"HANGAR cannot install until Phase 7; nothing on the HANGAR
  site writes to your module today"* - true until this phase lands, and the sentence is worth
  updating when it does.

</sota_updates>

<open_questions>

## Open Questions

1. **Does a real ZONA on firmware 1.5.5 answer `SERIALNUMBER/FETCH`?**
   - What we know: the handler exists (`grid_decode.c:839-869`), it is wired into
     `grid_decoder_to_ui[]` (`:1424`) - the same table that serves `CONFIG` and `PAGESTORE` - the
     checked-out tree declares `GRID_PROTOCOL_VERSION 1.5.5`, matching the tested module exactly, and
     the pinned package's field offsets (5/13/21/29, length 8) are byte-identical to
     `grid_protocol.h:955-965`. A round trip through the package's own encoder and decoder works.
   - What's unclear: no frame of this class appears anywhere in the three hardware captures, and
     `grid-editor` never sends one (grepped: the string appears only inside its bundled copy of the
     protocol package). It is source-verified and wire-unproven.
   - Recommendation: build the timeout path first and make it a real degrade, not a throw. Runbook
     row A is *"the site names your ZONA and remembers it"*, and it is the highest-value row in the
     checklist because everything durable hangs off it. If it fails, `PUT BACK` is session-only, the
     copy already says so, and SAFE-04 closes as **partially verified** rather than as a lie.

2. **How long does the module's post-store page reload take?**
   - What we know: the store itself is 13.6-38.7 ms over eleven observations; the ACK is sent by the
     success callback, which then *starts* a `grid_ui_bulk_page_load`; `CONFIG/FETCH` has no bulk
     guard.
   - What's unclear: everything about the load's duration. Phase 2's re-fetch ran 89 seconds after
     the last store, so it says nothing about this.
   - Recommendation: bounded re-fetch-until-match (3 rounds, `retryBackoffMs`), the `kept-unconfirmed`
     state for exhaustion, and a runbook row that records the round count so the guess becomes a
     measurement.

3. **Does 0 ms pacing survive back-to-back 690-957 byte `CONFIG/EXECUTE` frames?**
   - What we know: the mechanism is real and specific (512-byte CDC buffer, 2,048-byte ring, silent
     whole-message discard). The failure signature is a timeout with no NACK.
   - What's unclear: whether it ever fires. `SKELETON-RESULTS.md` predicted this would be Phase 7's
     question and it still is.
   - Recommendation: escalate to 10 ms on the first such timeout (Pitfall 3), and record the outcome
     in the runbook either way - including "it never fired", which is the answer that closes the
     caveat.

4. **What does a mixed configuration actually look like on the pad?**
   - What we know: Timer lands, Setup does not, so the **old** Setup runs beside the **new** Timer.
     The new Timer body references `self` state the old Setup never created, so a Lua error per tick
     or a frozen pad are both plausible. `PadPartialWriteError`'s comment records that this was
     observed on real hardware once.
   - What's unclear: whether it is visibly alarming (strobing, all-white) or merely still. The copy
     should not over-promise either way.
   - Recommendation: write the copy about *what HANGAR knows* ("the Setup did not save, so your ZONA
     is running half of one configuration and half of another") and not about what it looks like.
     Offer both recoveries. Do not add a runbook row that asks the user to induce it - inducing a
     partial write on purpose needs a fault injector on the wire, which does not exist.

5. **Should the module's id be shown to the visitor?** (CONTEXT open question 2.)
   - What we know: a 32-hex-character string is not a name. But "this ZONA" is ambiguous the moment
     someone owns two.
   - Recommendation: **do not show the raw id.** Show its last four hex characters inside the
     identity line only when a *second* module id has ever been stored - `ZONA (…4f2a)`. Zero cost
     when there is one module, exactly the disambiguation when there are two. Flag it for the user;
     it is a UI-spec call, not a research one.

6. **Where does the `reserved` install marker go?**
   - What we know: three places in the tree anticipate Phase 7 passing a non-zero `PadReserved` for
     "an install marker" (`pad/index.ts:97`, `tune/surprise.ts:14`, `tune/ladder.spec.ts:11`,
     `TuningRegion.svelte`'s prop).
   - What's unclear: nothing in CONTEXT.md, ROADMAP.md or REQUIREMENTS.md asks for a marker.
   - Recommendation: **ship `reserved = {setup: 0, timer: 0}`.** A marker is not a requirement; it
     would move every number in Phase 5's "16,645 reachable states, zero over 908" finding, and it
     would break the exact byte-for-byte meter pin measured below. Keep `reserved` plumbed as the
     test-only door to the over-budget branch, which is what `ladder.spec.ts` already uses it for.

</open_questions>

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | everything | yes | v24.14.0 | - |
| npm | everything | yes | 11.9.0 | - |
| Vitest (`server` + `sweep` projects) | every unit gate | yes | 4.1.x, configured | - |
| Playwright | the `/dev/install/` probe walk, both projects | yes | 1.62.1 | - |
| wrangler | `npm run test:e2e` serves the real build | yes | 4.128.0 | `npx sirv-cli build` (no auth coverage) |
| `@intechstudio/grid-protocol` | the fifth descriptor | yes | 1.20260825.1135 (exact pin) | - |
| `grid-fw` source (read-only sibling) | the firmware citations in this document | yes | `dc7d301`, `GRID_PROTOCOL_VERSION 1.5.5` | - |
| Phase 2 hardware captures | replay-driven specs | yes | 3 fixtures, 1,550 decoded frames | - |
| **A physical ZONA** | every `*(hardware)*` success criterion | **not to the orchestrator** | - | **None.** D-14 is absolute: the first write to a real ZONA is the user's click at the checkpoint. `FakeTransport` proves the code; it cannot prove the module. |
| **A second Grid module** | SAFE-06's rig confirmation against real traffic | **unknown** | - | The synthetic rig fixture proves the copy and the code; runbook row E is optional and says so. Phase 2 already recorded that all 1,550 frames carried `SX 0, SY 0`. |
| **A second ZONA** | the two-modules-one-machine key collision case | **unlikely** | - | Provable in node with two synthetic serial numbers. No hardware row. |

**Missing dependencies with no fallback:** the ZONA itself, for the five hardware rows. This is by
design, not a gap: it is `checkpoint:human-verify` in the final plan.

**Missing dependencies with fallback:** the second Grid module (synthetic rig fixture + an optional
runbook row).

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.x, two projects (`server` node, `sweep` node); Playwright 1.62.1, two projects (`chromium`, `webkit-phone` grepped on `@webkit`) |
| Config file | `vite.config.ts` (`test.projects`), `playwright.config.ts` |
| Quick run command | `npm run test:quick` (the `server` project) |
| Full suite command | `npm run check && npm run lint && npm run test:quick && npm run test:sweep && npm run test:e2e` |

**Counts are baseline + delta, never literals.** `scripts/check-counts.mjs` exists because phases
interleave in one tree, and Phase 6 is executing while this is written. The last measured totals
(`docs/TESTING.md`, 2026-09-05, end of Phase 5.1) are `quick 66 files / 692`, `sweep 3 / 13`,
`e2e 61`, `check 517 files / 0 errors`. **Phase 7 plans must re-measure `BASE_*` from Phase 6's final
SUMMARY and assert baseline + this phase's stated delta.**

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SAFE-01 | zero writes across connect + browse + tune; exactly 2 writes after `TRY ON DEVICE`, 2 after `PUT BACK`, 1 after `KEEP ON DEVICE` | unit | `npx vitest run --project server src/lib/device/install.spec.ts -t "never writes"` | Wave 0 |
| SAFE-01 | `install.svelte.ts` is the ONLY module under `src/lib/device/` naming a write; `session.svelte.ts`'s scan still finds none | unit (source scan) | `npx vitest run --project server src/lib/device/session.spec.ts` | exists (Phase 6 test 15) - extend |
| SAFE-02 | `KEEP ON DEVICE` is disabled in every phase but `settled`; geometry unchanged | unit | `npx vitest run --project server src/lib/ui/device-ui.spec.ts` | exists - extend |
| SAFE-03 | every write control disabled until the snapshot is present and `canWriteBack` passes; an empty fetched string keeps them disabled | unit | `... install.spec.ts -t "snapshot"` | Wave 0 |
| SAFE-04 | the key round-trips; a second module gets its own record; a page gets its own entry; an existing entry is never overwritten; a throwing store degrades without throwing | unit | `npx vitest run --project server src/lib/device/snapshot.spec.ts` | Wave 0 |
| SAFE-04 | `SERIALNUMBER/FETCH` encodes addressed, decodes to four words, and `moduleKeyOf` is 32 hex chars | unit | `npx vitest run --project server src/lib/protocol/descriptors.spec.ts` | exists - extend |
| SAFE-05 | the confirmation names the touch element, both events, and the power cycle, character for character | unit | `npx vitest run --project server src/lib/device/install-copy.spec.ts` | Wave 0 |
| SAFE-06 | with a synthetic rig the confirmation names the other modules in `sx`,`sy` order and the action still runs; three ACKs resolve one request | unit | `... install.spec.ts -t "rig"` | Wave 0 |
| SAFE-07 | drop the 2nd CONFIG ACK -> `partial`, names Setup, offers retry **and** PUT BACK; the restore still fired | unit | `... install.spec.ts -t "partial"` | Wave 0 |
| SAFE-08 | `settled` is reached from the ACKs only; no timer, no interval, no progress element in the source | unit (source scan) | `... install.spec.ts -t "settled"` | Wave 0 |
| SAFE-09 | delay past `executeMs` -> exactly 3 attempts then `failed`; disconnect mid-write -> `lost` with PUT BACK offered; a NACK -> `refused` with `attempts === 1` | unit | `... install.spec.ts -t "bounded"` | Wave 0 |
| DEGR-02 | all three controls visible-and-disabled with the reason inline, `serial` deleted | e2e | `npx playwright test e2e/first-experience.e2e.ts -g "no Web Serial"` | exists - extend with `put-back` |
| D-10 | `written.setup === compiled.setupLua` and `written.setup.length === cost.setup.used` for every shelf preset and every Lua entry | unit | `npx vitest run --project server src/lib/device/wire-pin.spec.ts` | Wave 0 |
| D-10 | an over-budget state never reaches the wire (forced via `reserved`) | unit | `... wire-pin.spec.ts -t "over budget"` | Wave 0 |
| D-12 | after the store, the re-fetch proof runs bounded and `kept-unconfirmed` is reachable | unit | `... install.spec.ts -t "kept"` | Wave 0 |
| D-13 | the whole flow walks in a browser through the fake serial shim, in both projects | e2e | `npx playwright test e2e/install.e2e.ts` | Wave 0 |
| D-14 | the six hardware rows | **manual** | `docs/INSTALL-RUNBOOK.md` | Wave 0 |

**Manual-only, with the reason:** every `*(hardware)*` criterion. Web Serial has no CDP domain and no
fake-device hook; a shim proves HANGAR's reaction to a modelled browser, never the browser. Phase 2's
runbook says it in those words and it is still true.

### Sampling Rate

- **Per task commit:** `npm run test:quick` (+ `npm run lint` when a source file moved).
- **Per wave merge:** `npm run check && npm run lint && npm run test:quick && npm run test:sweep`.
- **Phase gate:** all of the above plus `npm run test:e2e` against the production build through
  `wrangler dev`, then `/gsd:verify-work`, then the `checkpoint:human-verify` runbook.

Note the standing trap: `config-shape.spec.ts` test 14 and `og/build.spec.ts` read `build/`, so
`test:quick` must be run **after** a build, not only before one.

### Wave 0 Gaps

- [ ] `src/lib/device/snapshot.ts` + `snapshot.spec.ts` - the record, the key, the injected store (SAFE-04)
- [ ] `src/lib/device/install.svelte.ts` + `install.spec.ts` - the machine and its taxonomy (SAFE-01, 03, 06, 07, 08, 09, D-12)
- [ ] `src/lib/device/install-copy.ts` + `install-copy.spec.ts` - every sentence, import-free (SAFE-05)
- [ ] `src/lib/device/wire-pin.spec.ts` - D-10's byte-for-byte pin across all presets and all Lua entries
- [ ] `src/lib/protocol/descriptors.ts` - `fetchSerialNumber` + `moduleKeyOf`; `descriptors.spec.ts` and `forbidden-instructions.spec.ts` test 4 both widen from four builders to five
- [ ] `src/lib/transport/sequence.ts` - `writeBoth`; `storeToFlash`'s `storeAllowed` throw removed; `sequence.spec.ts:154` rewritten to SAFE-06's rule
- [ ] `src/lib/transport/capture.ts` - `STEP_IDS` gains `fetch-serial`
- [ ] `src/lib/transport/fixtures/synthetic.ts` - SERIALNUMBER report, `ram`/`flash` split, the `currentpage` NACK
- [ ] `src/lib/device/session.svelte.ts` - `get transport()` and `onClass()`; **no fifth static specifier**
- [ ] `src/lib/tune/model.ts` + `TuningRegion.svelte` + `Coverflow.svelte` - the `onconfig` channel
- [ ] `src/lib/ui/PutBack.svelte`; `KeepOnDevice.svelte` enabled + confirmation; `TryOnDevice.svelte` honesty literals
- [ ] `src/routes/dev/install/+page.svelte` - the probe (and `config-shape.spec.ts`'s "linked from nowhere" scan generalised to `src/routes/dev/*`, which Phase 6 research already recommends)
- [ ] `e2e/install.e2e.ts` + the shim's scripted-ACK extension
- [ ] `docs/INSTALL-RUNBOOK.md`

### The measurement that pins D-10

Run on 2026-09-05 against `@intechstudio/grid-protocol@1.20260825.1135`, all nine shelf presets at
their defaults, `reserved = {setup:0, timer:0}`:

```
aurora     setup  250 used  250 | timer   55 used   55 | compressed(setup) 249 | fits
pinwheel   setup  305 used  305 | timer   55 used   55 | compressed(setup) 304 | fits
starfield  setup  238 used  238 | timer   55 used   55 | compressed(setup) 237 | fits
radar      setup  438 used  438 | timer   55 used   55 | compressed(setup) 437 | fits
joystick   setup  535 used  535 | timer   24 used   24 | compressed(setup) 534 | fits
ninepads   setup  580 used  580 | timer  158 used  158 | compressed(setup) 579 | fits
faders     setup  513 used  513 | timer   24 used   24 | compressed(setup) 512 | fits
dial       setup  646 used  646 | timer   55 used   55 | compressed(setup) 645 | fits
tpad       setup  902 used  902 | timer  146 used  146 | compressed(setup) 901 | fits
presets: 9   mismatches: 0
```

`cost().used === compiled.setupLua.length` everywhere, because `budgetOf` is
`Math.max(measure(lua), lua.length) + reserved` (`_pad.ts:3060-3063`) and the uncompressed figure is
the larger by exactly one character per action - the space after each `]]` that the minifier deletes.
`_pad.ts:3021-3032` states the rule and why both are checked: *"the device rejects on the COMPRESSED
length of the event's toLua(), while GridEvent.insert() budgets on the UNCOMPRESSED one … The
uncompressed figure is the binding one and it is what the editor's own counter shows."*

**Therefore: write `result.setupLua` and `result.timerLua` verbatim.** The written length then equals
the meter exactly, the device's own (compressed) check has one character per action of slack, and
`CONFIG_LENGTH` is 909 so `sendConfig` refuses anything `>= 909` - the same 908 ceiling from the other
side. For Lua entries `renderLua`'s output is already asserted to be a fixed point of `compressScript`
across the whole knob cross-product (`src/lib/catalog/lua-entries.spec.ts`), so the two routes agree.

## The hardware checklist (`docs/INSTALL-RUNBOOK.md`)

Six rows. Modelled on `docs/SKELETON-RUNBOOK.md`: a **Before you start** block, a **Getting the page
open** block naming both `npm run preview` on `http://127.0.0.1:4173` (a secure context) and the
deployed HTTPS origin with its Basic Auth prompt, the `file://` trap stated explicitly, then a table
with a **Pass** column and a **What to hand back** close.

Two warnings this runbook needs that the skeleton's did not:

- **This checklist writes to your module.** Row A takes the snapshot, and every row after it changes
  what the ZONA is running. Row C is the way back and row E makes it permanent. Have Grid Editor
  available as the last resort.
- **While HANGAR holds the port, Grid Editor cannot open it.** `DISCONNECT ZONA` is one click from
  the header (Phase 6).

| # | Row | Do this | Passes when | Why a machine cannot |
|---|-----|---------|-------------|----------------------|
| **A** | The module names itself and is remembered (SAFE-04) | Connect. Read the identity line. Then close the tab, reopen the site, and connect again. | The snapshot is taken before any control enables, and after the reopen `PUT BACK` is offered **without** a fresh read - which only works if the module's own id came back over the wire. **Record whether the id arrived at all**: nothing in three hardware captures has ever carried a `SERIALNUMBER` frame, and `grid-editor` never sends one. | `SERIALNUMBER/FETCH` is source-verified and wire-unproven. A fake answers because it was told to. |
| **B** | The first RAM write (SAFE-02, SAFE-08) | With a configuration chosen and in budget, click `TRY ON DEVICE`. | The pad is doing the new thing within about a second, the panel says so from the two acknowledgements rather than from a timer, and the border LEDs flashed white briefly (firmware's own write feedback, `grid_decode.c:1281`). **Record the wall time from click to settled**, and whether it ever timed out. | Nothing but a module can prove a write landed; a fake ACK proves only that HANGAR believed one. This row is also Pitfall 3's experiment: a timeout with no refusal here is the 2,048-byte ring, and the answer is 10 ms pacing. |
| **C** | `PUT BACK` (SAFE-03) | Click `PUT BACK`. | The pad returns to exactly what it was doing before row B, in one click, with no confirmation step. | The comparison is by eye against a physical module. |
| **D** | A power cycle brings the original back (SAFE-02) | Click `TRY ON DEVICE` again. Unplug the ZONA. Plug it back in. | The module comes up running its **original** configuration, not HANGAR's - which is what "RAM only" means and is the entire safety argument for the primary control. | RAM is not readable after it is gone. |
| **E** | `KEEP ON DEVICE` survives a power cycle (SAFE-05, D-12) | `TRY ON DEVICE`, then `KEEP ON DEVICE`, read the confirmation, confirm. Then unplug and replug. | The confirmation named the touch element, both events and the power cycle before anything was sent; the panel reached "kept" only after the re-fetch matched; and the module comes back up running HANGAR's configuration. **Record how many re-fetch rounds it took** (Pitfall 6) and whether the border LEDs animated yellow-dim during the store. Then `PUT BACK` and `KEEP ON DEVICE` again to leave the module as you found it. | Flash is the definition of "survives", and only a power cycle tests it. The re-fetch round count is a measurement nobody has. |
| **F** | Fresh-tab `PUT BACK` (SAFE-04) | After row E, close the browser **completely**. Reopen, open the site, connect, click `PUT BACK`. | The original comes back from `localStorage` in one click - and if row A failed, this row is expected to fail with it, honestly, saying the snapshot was for this tab only. | Profile state plus flash state. Neither is simulable. |
| **G** *(optional)* | A rig (SAFE-06) | Attach a second Grid module beside the ZONA. Open the flash confirmation. | The confirmation names the other module and says its current page is stored too, and the action is still allowed. **Do not confirm it unless you are willing to store that module's page.** | Every frame in Phase 2's run carried `SX 0, SY 0`; this path has never met real traffic. |

**Recovery if a row fails**, in order: `PUT BACK` (rows B, C, D, E); power-cycle the module (row B or
D, RAM only); `PUT BACK` from a fresh tab (row F); and finally **Grid Editor**, which can rewrite both
events on the touch element by hand. Row A of `docs/HARDWARE-AUDITION.md`'s "Before you start" already
tells the user to capture their configuration before an audition; the same instinct applies here, and
the snapshot is HANGAR's version of it.

<sources>

## Sources

### Primary (HIGH confidence)

**Firmware, `intechstudio/grid-fw` @ `dc7d301`, read-only, `GRID_PROTOCOL_VERSION 1.5.5`:**

- `common/src/c/grid_decode.c:839-869` - `grid_decode_serialnumber_to_ui`: `IS_ME | IS_GLOBAL`
  destination, `GRID_INSTR_FETCH_code` only, `WORD0..WORD3` from `grid_sys_get_id`, REPORT built at
  `GRID_PARAMETER_GLOBAL_POSITION`, no `LASTHEADER`
- `common/src/c/grid_decode.c:1424` - `GRID_CLASS_SERIALNUMBER_code` in `grid_decoder_to_ui[]`
- `common/src/c/grid_protocol.h:952-965` - the frame template and the four word offsets (5/13/21/29, length 8)
- `common/src/c/grid_sys.c:17-25`, `grid_sys.c:174-180` - `uniqueid_array[4]`, set once at init
- `esp32s3/components/grid_esp32_platform/grid_esp32_platform.c:139-181` - `grid_platform_get_id`
  reads `EFUSE_BLK1` (the factory MAC) into bytes 0-5; bytes 6-15 stay zero
- `esp32s3/components/grid_esp32_usb/grid_esp32_usb.c:20-24` - the **same** six bytes become the USB
  `iSerialNumber` string (`grid_usb.c:116-124`), which is what Chromium keys its permission on and
  what `SerialPort.getInfo()` refuses to expose
- `common/src/c/grid_decode.c:1258-1313` - `CONFIG/EXECUTE`: the five NACK conditions, the
  `page_change_enabled = 0` at `:1279`, the white alert, the `LASTHEADER` echo at `:1307`
- `common/src/c/grid_decode.c:1315-1360` - `CONFIG/FETCH`: **no bulk guard**, and the NACK-then-REPORT
  fallthrough that `canWriteBack`'s empty-string branch exists for
- `common/src/c/grid_decode.c:947-961`, `:963-999` - `PAGESTORE`: the yellow-dim alert, the silent
  drop when a bulk operation is already running, and the success callback that reloads the page from
  flash and restarts the Lua VM
- `common/src/c/grid_decode.c:717` - `TYPE 255` is the only thing that restores `page_change_enabled`
- `esp32s3/components/grid_esp32_port/grid_esp32_port.c:480` - the firmware's own timeout restore,
  commented out

**Pinned package, `@intechstudio/grid-protocol@1.20260825.1135`:**

- `dist/index.js` - `SERIALNUMBER_WORD0..3_offset/length` identical to the firmware header
- Round trip verified 2026-09-05: `encode_packet` -> `decode_packet_frame` -> `decode_packet_classes`
  returns `SERIALNUMBER REPORT {WORD0..3}` with `brc {DX:-127, DY:-127, SX:-127, SY:-127}`
- `grid.getProperty("CONFIG_LENGTH")` = **909**

**Hardware captures (committed, `src/lib/transport/fixtures/`):**

- `zona-hardware.json` (`b-hb-off-pace-10`, 3,746 events, 150 steps) - five write-back cycles, ten
  stores, the `CONFIG/ACKNOWLEDGE` shape (`{LASTHEADER, VERSIONMAJOR}`, brc `SX 0, SY 0`), the
  `PAGESTORE/ACKNOWLEDGE` + `DEBUGTEXT "nvm store success"` pairing, `write-timer` 16.8 ms /
  `write-setup` 21.6 ms / `restore-page-change` +0.9 ms
- `zona-hardware-a-hb-on-pace-10.json`, `zona-hardware-a-hb-on-pace-0.json`
- `docs/SKELETON-RESULTS.md` - sections (a) through (f), the shipped timeouts and their derivation,
  the two Phase 7 caveats, and the "Open, still" list this phase inherits
- `.planning/phases/02-walking-skeleton/02-VERIFICATION.md` - the six recorded caveats, including
  caveat 5 (0 ms pacing never met a 690-957 byte write) and caveat 3 (the other-module path)

**In-tree source, read in full:**

- `src/lib/transport/{queue,sequence,transport,web-serial,fake,capture,framing}.ts`
- `src/lib/protocol/{constants,descriptors,decode,match,write-guard}.ts` and
  `forbidden-instructions.spec.ts`
- `src/lib/device/try-on.ts`; `src/lib/tune/model.ts`; `src/lib/pad/index.ts`;
  `src/lib/browse/return.ts`
- `src/vendor/botor/_pad.ts` - `compile` (`:2331`), the cost comment (`:3010-3032`), `measure`
  (`:3041`), `budgetOf`/`cost`/`fits` (`:3056-3082`), `PadPartialWriteError` (`:3460`), `withRetry`
  (`:3492`), `PadWriteAdapter`/`writePad` (`:3886-3936`)
- `src/routes/dev/skeleton/+page.svelte:190-245` - the one-pump pattern
- `e2e/first-experience.e2e.ts:339-373`; `playwright.config.ts`; `vite.config.ts`;
  `scripts/check-counts.mjs`; `docs/TESTING.md`; `docs/SKELETON-RUNBOOK.md`;
  `docs/HARDWARE-AUDITION.md`

**Planning:**

- `.planning/phases/07-install-flow/07-CONTEXT.md`; `.planning/ROADMAP.md` Phase 7;
  `.planning/REQUIREMENTS.md` SAFE-01..09, DEGR-02
- `.planning/phases/06-device-session/{06-CONTEXT,06-RESEARCH,06-03-PLAN,06-04-PLAN,06-12-PLAN,06-14-PLAN}.md`
- `.planning/phases/05-.../05-CONTEXT.md` (D-10, D-23); `.planning/phases/08-.../08-RESEARCH.md`
  (the audition checklist, the store's VM restart, `grxm`)

**Measurements taken for this document (2026-09-05, node v24.14.0, scratchpad only, repo untouched):**

- all nine presets compiled and costed: `used === setupLua.length` and `used === timerLua.length`,
  zero mismatches; `compressScript(setupLua)` exactly one character shorter per action
- `SERIALNUMBER` encode/decode round trip through the pinned package
- `grid.getProperty("CONFIG_LENGTH") === 909`

### Secondary (MEDIUM confidence)

- **`grid-editor` @ working tree, read-only** - grepped for `SERIALNUMBER`: it appears **only** inside
  the bundled protocol package (`dist-web/assets/index-*.js`), never in `src/`. The desktop editor
  identifies modules by `SX/SY` position and has never sent this instruction. That is why the
  mechanism is source-verified and wire-unproven.
- The claim that a partial write leaves a visibly broken pad - reasoned from the Timer/Setup coupling
  and from `PadPartialWriteError`'s own comment ("Observed on real hardware"), not measured here.

### Tertiary (LOW confidence - needs validation)

- The post-store page-load duration. Not measured anywhere. The bounded re-fetch and the
  `kept-unconfirmed` state exist because of this gap, and runbook row E is what closes it.
- Whether 0 ms pacing survives two back-to-back 957-byte writes. Predicted safe by the Phase 2 probe,
  which never exercised the mechanism. Runbook row B is the experiment.
- The 48-bit effective entropy of the module id on ESP32-S3 (`WORD2`/`WORD3` are always zero). Read
  from source; never observed on a wire.

</sources>

<metadata>

## Metadata

**Research scope:**

- Core technology: Web Serial writes over the Grid protocol; the ZONA's `SERIALNUMBER` class; the
  ESP32-S3 eFuse identity path
- Ecosystem: nothing new - the phase adds zero dependencies
- Patterns: one-writer-for-three-clicks; the class-sink seam over a single-callback transport; the
  twice-keyed snapshot; the strings channel from the tuner; the install state machine as a second
  store
- Pitfalls: eleven, each with the firmware line or the shipped file that produces it

**Confidence breakdown:**

- Standard stack: **HIGH** - no new packages; every module named was read in full
- Wire behaviour (writes, ACKs, restore, store): **HIGH** - Phase 2's three hardware captures plus a
  line-by-line firmware read
- The identity mechanism's field layout: **HIGH** - package and firmware headers compared byte for byte
  and round-tripped through the encoder
- That a real ZONA answers `SERIALNUMBER/FETCH`: **MEDIUM** - dispatch table confirms it should; no
  frame of this class has ever been observed and `grid-editor` never sends one
- The D-10 byte-for-byte pin: **HIGH** - measured across all nine presets, both events, zero
  mismatches, plus an existing fixed-point assertion for every Lua entry
- Post-store settle timing: **LOW** - unmeasured; mitigated by a bounded loop and an honest state
- 0 ms pacing under two 957-byte writes: **LOW** - explicitly named as Phase 7's experiment in advance
- Pitfalls: **HIGH** - each traceable to a firmware line, a shipped file or a recorded Phase 2 caveat

**Research date:** 2026-09-05
**Valid until:** 2026-10-05 (30 days) for everything except the two LOW rows, which are settled by
`docs/INSTALL-RUNBOOK.md` rows B and E and should be replaced with measurements the moment they run.
A `@intechstudio/grid-protocol` pin bump or a ZONA firmware update re-opens every field offset, every
parameter name and every frame length in this document - `docs/PIN-POLICY.md` governs.

</metadata>

---

*Phase: 07-install-flow*
*Research completed: 2026-09-05*
*Ready for planning: yes*

## RESEARCH COMPLETE

1. **The durable key is answered and it is a wire read, not a hash.** `SERIALNUMBER/FETCH` addressed
   to the ZONA returns the eFuse MAC as `WORD0..WORD3`; the package's offsets are byte-identical to
   `grid-fw`. Plan a **fifth descriptor** - the first new outbound instruction since Phase 2 - and
   widen `forbidden-instructions.spec.ts` test 4 from four builders to five.
2. **A content hash is not a weaker fallback, it is a broken one** - the fetched strings change the
   moment `TRY ON DEVICE` runs. The real fallback is a session-only snapshot with honest copy, and it
   needs its own plan-level state and its own sentence.
3. **The writes belong in a new `install.svelte.ts`, never in the session.** Phase 6's never-writes
   gate is a source scan of `session.svelte.ts`; a separate file keeps that guarantee real and costs
   the session only two new members (`get transport()`, `onClass()`).
4. **`GridTransport` carries one `onData` callback.** A plan that lets the install store register its
   own silently freezes the header's page number and turns every later write into an unexplained NACK.
   The class-sink seam is a wave-1 dependency for everything downstream.
5. **The tuner does not publish its strings today.** `buildTuner` emits meters, ladder, over-budget and
   stamp - not `setupLua`/`timerLua`. One `onconfig` emit at the same instant as `land()` is what makes
   D-10's byte-for-byte pin structural instead of an assertion about two separate compiles. Plan it
   before the install actions, not beside them.
6. **The pin is exact and measurable now:** `written === compiled.setupLua` and
   `written.length === cost.setup.used`, verified across all nine presets with zero mismatches. Write
   `setupLua` verbatim; do not compress at install time.
7. **One writer for all three clicks.** Generalise Phase 2's `writeBack` to `writeBoth(q, target,
   {setup, timer})` so `PUT BACK` is literally the same hardware-proven code path as `TRY ON DEVICE`.
   Do not adopt the vendored `writePad` as a second writer - reuse its ordering rationale and its
   `PadPartialWriteError` vocabulary instead.
8. **Two pieces of shipped work must be undone, not added to:** `storeToFlash`'s `storeAllowed` throw
   (SAFE-06 supersedes Phase 2's D-12, and `sequence.spec.ts:154` asserts the old rule), and the two
   `TryOnDevice.svelte` literals promising HANGAR never writes. Both are small and both are easy to
   miss in a plan that only adds files.
9. **Two failure paths need a bounded loop rather than a single await:** the post-store re-fetch
   (which races the module's own page reload, unmeasured) and a write timeout with no NACK (the
   2,048-byte ring, escalate to 10 ms pacing). Each earns a named state - `kept-unconfirmed`,
   `failed` - and each earns a runbook row that converts the guess into a measurement.
10. **Split the phase along the dependency spine, not by control:** (0) descriptor + snapshot module +
    sequence widening + `STEP_IDS`; (1) the session seams; (2) the install store and its taxonomy
    against `FakeTransport`; (3) the tuner's strings channel; (4) the three controls, the confirmation
    block and the copy changes; (5) the `/dev/install/` probe, the shim's scripted ACKs and the e2e;
    (6) the runbook and the single `checkpoint:human-verify`. Every count in every plan must be
    baseline-plus-delta read from Phase 6's final SUMMARY - Phase 6 is still executing in this tree.
