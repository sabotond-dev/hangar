# Pitfalls Research

**Domain:** Public static site that writes configurations to strangers' USB hardware over Web Serial, plus a firmware-faithful 9x9 LED simulator running on dozens of canvases at once.
**Researched:** 2026-09-02
**Confidence:** HIGH for firmware and Chromium facts (read from `grid-fw` @ `dc7d301e` and Chromium source); HIGH for prior-art incidents (read from `grid-editor` @ `redesign` and the user's ZONA memory notes); MEDIUM for Web Serial permission-persistence behaviour and flash-endurance numbers (flagged inline).

---

## Ranking — read this first

The roadmap should let this order shape phase order. Rank 1-5 are the ones that either break someone's hardware, waste weeks, or make the whole premise fail.

| # | Pitfall | Blast radius | Shapes phase order? |
|---|---------|--------------|---------------------|
| 1 | **Exclusive serial port — Grid Editor owns the ZONA** (C1) | The core promise ("plug in, open a URL") silently fails for the exact users most likely to try it | Yes — connect UX must be designed around it in the first serial phase |
| 2 | **A write that reports success without an acknowledgement** (C2) | Every safety guarantee downstream is built on a lie | Yes — the ACK round-trip must exist before any write feature |
| 3 | **Half-written config: Timer landed, Setup did not** (C3) | A stranger's pad is left running a chimera of two configs | Yes — write ordering + retry + partial-write error before the catalog |
| 4 | **No recoverable original** (C4) | Irreversible loss of a config the user paid a person to make | Yes — snapshot must land in the same phase as the first write, not later |
| 5 | **Audition state reaching flash** (C5) | Permanent, silent, on someone else's device | Yes — Store is its own phase with its own guard |
| 6 | **Simulator fidelity drift, pinned by a test written from the same misreading** (C6) | Weeks of confident, wrong output; a green suite hiding it | Yes — oracle strategy chosen before the simulator port |
| 7 | **WASM Lua formatter not initialised** (C7) | Budgets silently wrong, every card reports invalid syntax | Yes — an async gate at app boot |
| 8 | **908-char budget, comments included** (C8) | Configs that pass locally and are rejected by the module | No — but every tuning knob must respect it |
| 9 | **Bootloader VID/PIDs in the port filter** (C9) | A route to DFU on a site whose scope says "never brick" | Yes — one-line fix, must be in the first serial phase |
| 10 | **getPorts() is not a session you can rely on** (C10) | "It worked yesterday" bug reports forever | No |
| 11 | **Background-tab throttling stalls writes and drops the heartbeat** (C11) | Mid-write stalls of minutes; module declares EDITOR TIMEOUT | No |
| 12 | **Read-loop lock ordering + unbounded rx buffer** (C12) | Port that cannot be reopened; slow memory growth | No |
| 13 | **GPLv3 without corresponding source** (C13) | Licence violation on a public site | Yes — decided in phase 0, cheap then, expensive later |
| 14 | **Many animated canvases: rAF, drift, per-card contexts, reduced motion** (C14) | The "rack of running machines" identity becomes a fan-spinning tab | No |
| 15 | **`@intechstudio/grid-protocol` pin vs firmware version** (C15) | Silent protocol mismatch against a newer or older module | No |

---

## Critical Pitfalls

### C1: The operating system gives serial ports exclusively — a running Grid Editor makes HANGAR unable to connect at all

**What goes wrong:**
The visitor is a ZONA owner. ZONA owners have Grid Editor installed. Grid Editor **auto-connects on launch and can be minimised to the tray**, so it is frequently holding the port with no visible window. The visitor clicks HANGAR's Connect button, the Chrome port picker appears and lists the ZONA (the picker enumerates ports regardless of who owns them), they pick it, and `port.open()` rejects.

**The definite answer, verified in Chromium source:**
Chromium opens serial ports exclusively on all three platforms.

- **Windows** — `services/device/serial/serial_io_handler.cc` `StartOpen()` opens with
  `base::File::FLAG_OPEN | FLAG_READ | FLAG_WIN_EXCLUSIVE_READ | FLAG_WRITE | FLAG_WIN_EXCLUSIVE_WRITE | FLAG_ASYNC | FLAG_TERMINAL_DEVICE`.
  `FLAG_WIN_EXCLUSIVE_*` maps to `CreateFile` with `dwShareMode = 0`, so the second opener gets `ERROR_ACCESS_DENIED`.
- **macOS and Linux** — `serial_io_handler_posix.cc` explicitly comments *"The base::File::FLAG_WIN_EXCLUSIVE_READ and base::File::FLAG_WIN_EXCLUSIVE_WRITE flags do nothing on POSIX-based systems. Request exclusive access to the terminal device here."* and then calls `ioctl(fd, TIOCEXCL)`. A second `open()` on a TIOCEXCL'd tty fails with `EBUSY`.

**The exact user-facing symptom (from `third_party/blink/renderer/modules/serial/serial_port.cc`):**
`port.open()` rejects with a `NetworkError` DOMException whose message is the literal string **`Failed to open serial port.`** There is no distinct "in use by another application" error and no way to ask who holds it. In DevTools it reads:
`Uncaught (in promise) DOMException: Failed to open serial port.`
Identical on Windows, macOS and Linux.

**The symmetry that makes this worse — and better:**
Grid Editor is Electron 39 and **uses the same Chromium Web Serial stack**, not node-serialport (`src/electron/main.ts:568` handles `select-serial-port` and auto-picks `portList[0]`; `serialport.ts:202` calls `navigator.serial.requestPort()` in both the web and desktop builds). So:
- Both sides take TIOCEXCL / exclusive share mode. Whoever opens first wins; there is **no Linux "both connected, interleaved garbage" hazard**, which is the usual worst case for this class of bug.
- The reverse also holds: once HANGAR has the port, Grid Editor cannot connect. HANGAR must release the port, not just leave the tab open.

**Why it happens:**
Nobody tests with the vendor's desktop app running, because developers close it to avoid the conflict — which is exactly what removes the bug from their own machine.

**How to avoid:**
1. Detect it precisely. `catch` the open rejection and match on the DOMException `name === "NetworkError"`. Do **not** string-match `"Failed to open serial port."` as the primary test — it is a Chromium implementation string that can change; use it only as a secondary signal.
2. Say the true thing in the error copy: *"Something else is already using your ZONA. Grid Editor connects automatically and can sit in the system tray — quit it completely (tray icon → Quit, not just close the window) and press Connect again."* Name Grid Editor explicitly; it is the cause in the overwhelming majority of cases.
3. Add a retry button that re-attempts `open()` on the same `SerialPort` object without a new `requestPort()`, so the recovery is one click after quitting the Editor.
4. **Release the port aggressively.** Close on `visibilitychange` → hidden after an idle timeout, and on `pagehide`. A HANGAR tab left open for a week must not lock the user out of their own Editor.
5. Distinguish this from the two other open failures: user cancelled the picker (`requestPort()` rejects `NotFoundError`), and device unplugged between pick and open (also `NetworkError`, but `port.connected === false`).

**Warning signs:**
- Works perfectly on the dev machine, fails for the first three external testers.
- Bug reports of the form "the picker shows my ZONA but nothing happens".
- Any code path that treats an `open()` rejection as "no device found".

**Phase to address:** First Web Serial phase, alongside the connect button. This is not polish — it is the most likely first-contact failure.

---

### C2: A write that reports success because the bytes reached the OS buffer

**What goes wrong:**
`port.writable.getWriter().write(bytes)` resolves when the data is handed to the platform, not when the module accepted it. If HANGAR resolves "Installed!" on that promise, the UI lies about a stranger's hardware. The prior art has the exact same trap one layer up: `GridEvent.sendToGrid()` (`runtime.ts:864-879`) **resolves with `{ value: true }`** — a success — when `isValid()` is false:

```ts
if (!this.isValid()) {
  return Promise.resolve({
    value: true,
    text: "Nothing to sync, event has invalid actions.",
    ...
  });
}
```

So a config with a syntax error reports "OK" and never leaves the machine. This is recorded in the user's notes as *"sendToGrid() reports success even when isValid() is false, so run checkSyntax first"* — verified at source, HIGH confidence.

**Why it happens:**
Two different meanings of "success" (local acceptance vs. remote acknowledgement) share one boolean, and the happy path never distinguishes them.

**How to avoid:**
- **Define "installed" as: the module sent back a matching `CONFIG` ACKNOWLEDGE frame.** Port the editor's `ResponseWaiter` shape — a promise resolved by the inbound frame decoder with a `filter` on class/element/event and `LASTHEADER` id (`engine.store.ts:110-165, 300-345`) — or write a smaller equivalent. Do not ship a write path without it.
- Validate before writing, never after: run `GridScript.checkSyntax(script)` **and** the 908-char budget check on the compressed output, and refuse to write on failure with a visible error.
- Know what `checkSyntax` actually is. In `@intechstudio/grid-protocol@1.20260825.1135` it is literally `try { beautifyLua(script); return true } catch { return false }` — a **parse check only**. It does not catch undefined globals, wrong arity, or ZONA-specific traps (`glp(n, layer, -1)` always errors on ZONA; Mode blocks abort Setup). A passing `checkSyntax` is necessary, not sufficient.
- Never use a `Promise.all`-style multi-write. `GridElement.sendToGrid()` (`runtime.ts:1260-1267`) collects event writes into `Promise.all`, so ordering is not guaranteed — and ordering is load-bearing (see C3).

**Warning signs:**
- A success toast that fires faster than the module's LEDs change.
- Any `await writer.write(...)` followed directly by a state change to "installed".
- Tests that mock the transport and assert only that `write` was called.

**Phase to address:** The transport/ACK phase, **before** any config-writing feature.

---

### C3: Half-written config — Timer landed, Setup did not

**What goes wrong:**
The ZONA touch element has exactly two events, Setup (0) and Timer (6). They are written as two separate protocol transactions. If the first lands and the second fails, the pad runs half of one configuration beside half of another: LEDs from one preset, touch behaviour from another, or a Setup that installs a `touch_cb` referencing state a different Timer never creates.

**This is not hypothetical.** It happened on real hardware and is documented in `_pad.ts:3451-3465`:

> *"Observed on real hardware: a config write during a busy 20 ms keeper timer failed with `Waiting for response was interrupted`, and the module kept the old Setup beside the new Timer."*

The failure string comes from `ResponseWaiter.destroy()` in `engine.store.ts:152-162`. A single retry fixed it.

**Why it happens:**
The Grid link drops requests while the module is busy, and a config that re-arms a fast keeper timer makes "busy" the normal state. Under Chrome's background-tab timer throttling (C11) the window widens dramatically.

**Concrete mitigation design — all four layers, not one:**

1. **Fixed order: Timer first, always.** `writePad` (`_pad.ts:3890-3928`) documents why: *"Storing Setup on its own leaves the left mouse button held down after the first tap, because Setup runs immediately in the live VM and nothing exists yet to release it. It also satisfies `gtt`'s precondition, which is a no-op until the Timer event holds at least one stored action."* Write Timer, await its ACK, then write Setup. Sequential, never `Promise.all`.
2. **Per-half retry on transient errors.** Port `withRetry` + `isTransient` verbatim, including the non-obvious part: the runtime rejects with **plain objects** `{ value, text, type }`, not `Error`s, so `String(e)` is `"[object Object]"` and a naive regex on the stringified error never matches. Read `.text`. `TRANSIENT_WRITE = /interrupted|timeout|timed out|busy|no response/i`, three attempts, backoff `120 * (i + 1)` ms. Normalise rejections at HANGAR's own adapter boundary so this cannot regress.
3. **A distinct error type when the halves disagree.** `PadPartialWriteError` carries `.wrote` and `.failed`. The UI must say the true thing — *"The Setup did not save, so your pad is running a mixed configuration"* — and offer **two** buttons: Try again, and Put back. A generic "write failed" toast is worse than useless here because doing nothing leaves the mixed state on the device.
4. **The escape hatch the firmware already provides: `PAGEDISCARD`.** Verified in `grid_decode.c` `grid_decode_pagediscard_to_ui` → `grid_ui_bulk_start_with_state(..., grid_ui_bulk_page_load, page, ...)`. PAGEDISCARD reloads the active page **from flash** and restarts the Lua VM. Because HANGAR's audition writes are RAM-only, PAGEDISCARD is a **guaranteed, atomic, zero-flash-cost restore to a consistent state**, independent of whatever mixture HANGAR left in RAM. It even lights the border LEDs yellow-dim while it runs, so the user sees it happen.
   - Caveat verified at source: `grid_decode_pagediscard_to_ui` returns early (silently, `return 1`) if `grid_ui_bulk_in_progress()` — a discard sent while a store is running is **dropped with no error**. Wait for the store's ACK before discarding.
   - Second caveat: PAGEDISCARD restores what is in *flash*, so it only undoes RAM auditions. That is precisely why auditions must be RAM-only.
5. **The zero-cost universal recovery: unplug and replug.** Because RAM auditions never touch flash, a power cycle restores the stored config. Say this in the UI. It is the one recovery that works even if HANGAR itself has crashed.

**Warning signs:**
- Any write path that does not `await` between the two halves.
- A retry policy that treats all errors alike (retrying a compile error forever, or giving up on a transient one).
- No UI state for "partially written".

**Phase to address:** The RAM-audition write phase. C3's mitigation is the reason that phase must precede the catalog phase.

---

### C4: The "original config" snapshot that captured nothing

**What goes wrong:**
HANGAR promises the user's original configuration is always recoverable. The snapshot is taken at connect time by reading the two events off the module. If the read resolves *before the event content has actually arrived*, the snapshot is an empty string, and Put back writes an empty config over whatever the user had. The user has now permanently lost a config, and HANGAR's single most important safety promise inverted into the worst possible outcome.

**This is a recorded FATAL from the prior art**, caught in review:

> *"Review pass fixed a FATAL: `GridEvent.load()` resolves while `AutoEventFetcher` has the event FETCHING, so snapshots could capture empty configs; `awaitEventLoaded` subscribes until truly loaded."*

`AutoEventFetcher` polls every 150 ms (`services.ts:38-40`) and calls `event.load()` on any event where `isLoaded()` is false — so there is a live race between the panel's load and the background fetcher's load.

**How to avoid:**
- **Snapshot before anything else, and gate every write on it.** No write button is enabled until `snapshot.setup` and `snapshot.timer` are both non-empty strings that arrived from the module. If the snapshot fails, HANGAR is in browse-only mode for that session and says so.
- **Never trust a load promise; subscribe until loaded.** Port the `awaitEventLoaded` pattern — wait on the *state*, not the call.
- **Snapshot the raw wire form**, the compressed Lua exactly as the module reports it. Do not round-trip it through the compiler, the humanizer, or a `PadState`. The snapshot must be able to restore a config HANGAR's compiler cannot even parse — a hand-written config, a Zone Blocks config, a factory config.
- **Make Put back re-store if a store happened.** From `pad-editor.store.ts`: *"re-stores the restored snapshot too, so flash never silently holds a [variant]"*. If the user Stored during the session, Put back must Store the snapshot back, not just write it to RAM — otherwise flash keeps the HANGAR config forever.
- **Offer the snapshot as a download.** A "Download my original config" button producing the Profile Cloud JSON shape costs almost nothing and turns an in-tab promise into a file the user still has after the tab closes. This is the single highest-value safety feature per line of code in the whole project.
- **Persist the snapshot outside the tab.** Keep it in `sessionStorage` keyed by port info so an accidental reload does not destroy it (see C10 — a reload destroys the `SerialPort` object *and* every JS variable).
- **Say the promise plainly on screen.** "Opening this page never writes to your ZONA" must be visible, and must be true — no prefetch, no probe write, no "clear the pad so the preview matches".

**Warning signs:**
- Snapshot length of 0 anywhere in logs.
- Put back tested only immediately after an audition, never after a page change or a replug.
- Any code that reconstructs the snapshot from a `PadState` rather than storing the source string.

**Phase to address:** Same phase as the first write. Snapshot ships before audition, not after.

---

### C5: Audition state reaching flash

**What goes wrong:**
Flash is permanent and silent. If a temporary state — a solo variant, a half-tuned experiment, a mid-drag preview — can reach `PAGESTORE`, it becomes the user's config forever with no visible moment where they agreed to it.

The prior art hit this twice and solved it twice:
- Zone Blocks per-axis Solo: *"RAM-only, 60 s auto-restore, `storePage` restores-then-aborts if unconfirmed so solo can NEVER reach flash"* (`zone-solo-guard.ts`).
- Map/Solo: *"`soloStream` is audition-only, can NEVER reach a stamp or Store; cleared on every exit path; review fixed a leak via On-your-pad-now."*

**How to avoid:**
- **One and only one function may emit `PAGESTORE`.** Everything else physically cannot. Route it through a single guarded module.
- **That function restores-then-aborts.** Before storing, ask every temporary-state owner to restore the real config and *confirm it landed*. If any restore is unconfirmed, **abort the store** rather than storing the wrong thing. Aborting is always safe; storing wrongly never is.
- **Store is a separate, labelled, second click**, never chained to audition, never on a timer, never on unload. Label it with what it does: "Save to the pad's memory (survives unplugging)".
- **Enumerate exit paths and clear temporary state on all of them**: card switch, tab switch, page change, disconnect, `pagehide`, `visibilitychange`, retune, and the "put it back" button. The prior art's leak was one missed exit path.
- **Test for the negative.** A test that asserts a solo/preview state *cannot* reach the store path is worth more than ten tests of the happy path.

**Flash wear (MEDIUM confidence — mechanism verified, endurance not):**
`grid_ui_bulk_page_store` (`grid_ui.c:1098-1168`) writes one LittleFS file per changed event (`%02x/%02x/%02x.cfg`), only for events with `cfg_changed_flag` set, with a `PT_YIELD` between each. ZONA is ESP32-S3, so this is LittleFS on SPI NOR flash with dynamic wear levelling. A ZONA store is ~2 small files, ~1 KB each. Human-paced clicking is not a wear risk. **Auto-storing on every knob turn would be** — a tuning slider bound to Store could issue thousands of erases in a session. I did not verify the flash part's rated endurance; treat "never auto-store" as the rule and the number as unnecessary.

**Unplug during a store:**
LittleFS is power-fail-safe by design, so the *filesystem* survives an unplug mid-store. But `grid_ui_bulk_page_store` iterates elements and events in **ascending index order**, so Setup (event type 0) is written before Timer (type 6) — the **opposite** of the RAM write order HANGAR controls. An unplug between the two leaves flash with a new Setup and an old Timer. HANGAR cannot reorder this; it can only:
- keep Store short and tell the user not to unplug during it,
- keep the downloadable snapshot from C4 as the real recovery,
- and re-verify after store by reading both events back and comparing.

**Warning signs:**
- More than one call site for the store instruction.
- A store triggered by anything other than a direct click.
- Store tested only in isolation, never while a preview/solo is active.

**Phase to address:** The Store-to-flash phase, which must come after audition and after Put back both work.

---

### C6: Simulator fidelity drift — the test that pins the same misreading as the code

**What goes wrong:**
The simulator and the compiler are two independent restatements of firmware behaviour. When one drifts, the site shows a beautiful animation that the hardware will not produce. The dangerous version is when the *test* is written from the same reading of the firmware that produced the code, so a green suite certifies the bug.

**This is a real committed bug in the prior art**, recorded in the memory notes and still visible in the fix:

> *"Found+fixed a real committed bug: `ledIndexToCell` mirrored ODD rows; firmware mirrors EVEN rows (`grid_module.c:445-458`, hw 8 = logical (0,0)). Test had pinned the same wrong parity (written from the same misreading), so a green suite hid it."*

Verified independently in `grid-fw` at `common/src/c/grid_module.c`:
```c
#define R0 8, 7, 6, 5, 4, 3, 2, 1, 0            // even row -> descending (mirrored)
#define R1 9, 10, 11, 12, 13, 14, 15, 16, 17    // odd row  -> ascending
```
Even rows are mirrored. `ledIndexToCell` is now `y % 2 === 0 ? GRID - 1 - raw : raw`. Note the scope of the damage: *"Only screen-side art affected, no emitted Lua"* — the bug was invisible on hardware and visible only as a horizontally flipped preview, which is exactly the class of bug a simulator-only site cannot afford.

**The standard techniques that prevent this class, in order of strength:**

1. **Transcribed oracles, not derived rules.** Copy the firmware constant into the test file **as literal data**, with a `file:line` citation, and assert the implementation against the data. The prior art does exactly this and it is the reason the fix stuck — `pad-sim.test.js:70-95` contains the whole 81-entry `FIRMWARE_TABLE` verbatim and asserts `screenToHw`/`hwToScreen` against it for all 81 cells. A test written as "the mirror should be on odd rows" restates the bug; a test written as "here is the table from `grid_module.c:445-458`" cannot.
   Transcribe at minimum: the 81-entry LED lookup table, the 256-entry sine lookup, the integer weight tables summing 254 with the single `/512`, the colour-ramp two-segment interpolation with mid at both 127 and 128, and the freeze-on-expiry tick order.
2. **Property/invariant tests that are independent of the implementation.** `pad-sim.test.js` asserts the mapping is a **bijection and self-inverse over all 81 LEDs** — a property that holds for the correct table and for the buggy one, so it is not sufficient alone, but it catches a different class (dropped/duplicated cells). Pair it with the transcribed table.
3. **Cross-checks between two independently derived artefacts.** The prior art's `agrees with the corrected ledIndexToCell for every hardware index` test exists precisely because *"two mappings with opposite parity in one directory was the trap"*. Any fact expressed in two places must have a test that ties them together. HANGAR will have at least three: the compiler's emitted Lua, the simulator's model, and the site's card art.
4. **Pinning tests that read the compiler's output, not its inputs.** `pad-invariants.test.js` extracts rates, stops and expressions **from `compile()` output** with independent regexes and sweeps 1188+ (later 3564) states. This catches "the compiler changed and the simulator did not" without needing hardware. This is the anti-drift mechanism that already exists and must be ported.
5. **Frozen fixtures with a versioned format.** The stamp fixtures (`v1` frozen, `v2` needs-v4 rule so `c`/`d` grafts fail closed) mean an old shared URL either decodes identically or fails loudly. Never silently.
6. **Adversarial re-derivation.** For any firmware fact that will be baked in permanently, have a second pass re-derive it from the firmware **without reading the implementation**. This is the only technique that catches a misreading, because it is the only one that does not inherit it.

**HANGAR's test strategy given almost no hardware access:**
- **Tier 1 — Firmware oracles (no hardware).** Transcribed tables and constants, cited to `grid-fw` file:line, asserted exhaustively. These are the ground truth.
- **Tier 2 — Compiler↔simulator agreement (no hardware).** For every catalog entry and every reachable knob combination, compile, then assert that the simulator's model of that compiled output matches the values parsed back out of the emitted Lua. Sweep, do not sample.
- **Tier 3 — Budget and validity invariants (no hardware).** Every state in the sweep: `checkSyntax` passes, `compressScript(...).length <= 908` for both events, no forbidden calls, no CC > 127, no note > 127.
- **Tier 4 — Golden frames (no hardware).** For each preset, hash the simulator's frame buffer at fixed tick counts. A change to any shared helper that alters a preset's appearance shows up as a diff on a specific preset instead of nowhere.
- **Tier 5 — Protocol conformance against a fake module (no hardware).** A `GridTransport` implementation that speaks the real frame format lets the whole write/ACK/retry/partial-failure path be tested, including *injected* failures: drop the Setup ACK, delay it past the timeout, disconnect mid-write. **This is the only way the C3 mitigation gets tested at all**, because the real failure needs a busy module.
- **Tier 6 — Hardware pass (rare, batched).** Maintain an explicit, versioned checklist of things only hardware can settle. The prior art already has one and it is still open: *"shelf checklist (Store/replug/Put back/audition while touched), dial deadzone feel + clockwise polarity, sim-vs-module side-by-side"*. Treat unverified-on-hardware as a first-class state in the catalog data, not a footnote — a badge on the card is honest and costs nothing.
- **Anti-pattern to forbid:** updating a test to match new output because "the new output looks right". Every oracle test change must cite a firmware line.

**Warning signs:**
- A test whose assertion is a restatement of the implementation's rule in English.
- A test file with no `grid-fw` file:line citations.
- Presets that were never rendered side-by-side with hardware and are not marked as such.

**Phase to address:** Chosen and written **before** the simulator port, applied during it. This is the phase-ordering consequence: oracle strategy first, port second.

---

### C7: The WASM Lua formatter is not initialised, so budgets are wrong and everything looks invalid

**What goes wrong:**
`@intechstudio/grid-protocol` is not pure JS. `dist/index.js:2` is `import init, { format } from '@wasm-fmt/lua_fmt'`, and `lua-formatter.d.ts` says `initLuaFormatter()` **"MUST be called before using minifyLua() or beautifyLua()"**. Both of the two functions HANGAR depends on most go through it:
- `GridScript.compressScript = shortify → minifyScript → minifyLua` — this is the **cost function**. Before init, it throws.
- `GridScript.checkSyntax = try { beautifyLua(script); return true } catch { return false }` — before init, the throw is swallowed and it returns **`false`**.

So a race at page load produces the worst possible symptom: every card reports invalid syntax, or the fit ladder throws, and nothing says why. On a static site with code-split catalog cards, this race is the default, not the exception.

**How to avoid:**
- Gate the whole app on `await padCompilerReady()` (the pattern already exists at `_pad.ts:51-58`, memoised, plus `assertPadCompilerReady()` which throws *"The Lua formatter is not initialised. Await padCompilerReady() first."*). Port both.
- Make the assertion loud in dev and a visible loading state in prod. A silent `false` from `checkSyntax` is indistinguishable from a real syntax error.
- **CSP:** WebAssembly instantiation is blocked in Chrome unless `script-src` includes `'wasm-unsafe-eval'` (supported since Chrome 97). If HANGAR ships a strict CSP — which it should, since it talks to hardware — WASM silently fails without it and the symptom is identical to the un-initialised case.
- **MIME type:** the `.wasm` asset must be served as `application/wasm` for streaming instantiation. Cloudflare Pages/Workers assets do this by default; verify it rather than assume it.
- Budget the cost: `dist/index.js` alone is 265 KB unminified, plus the `lua_fmt` WASM binary. Load it eagerly at boot (it is needed for the very first card) but keep it out of the critical render path for the browse-only experience if the catalog can ship precomputed costs.

**Warning signs:**
- Costs of 0, or every card flagged invalid, on a cold load but not a warm one.
- Works in `npm run dev`, fails on the deployed static build.
- `checkSyntax` returning `false` for code you know is valid.

**Phase to address:** Compiler-port phase, at the app-boot gate.

---

### C8: The 908-character budget — the minifier keeps comments, and the module rejects at 909

**What goes wrong:**
Configs are authored, look fine, and are rejected or truncated by the module.

**Verified facts:**
- `GRID_PARAMETER_ACTIONSTRING_maxlength` is **909** in `grid_protocol.h:127` (908 usable + terminator), per event. Setup and Timer each get their own 908, so the real budget is 1816 split across two and **not fungible** — 900 in Setup and 100 in Timer does not let you borrow.
- The minifier **preserves comments by design**. `lua-formatter.d.ts`: *"Minifies Lua code by removing unnecessary whitespace **while preserving comments**"*. This is the package's own documentation, not folklore. Any comment shipped in emitted Lua is paid for at full price.
- Known pre-existing debt to inherit knowingly: *"a few extreme sweep states (worst 941: drift+bloom+dial-abs-radius) sit over 908 at Full already"* and *"worst measured stack was 941/908 at full brightness"*.

**How to avoid:**
- Cost with the **real** `compressScript`, never with `.length` on the pretty source, never with a hand-rolled minifier. Note the signature trap from the notes: *"cost takes a CompileResult, NOT a PadState"*.
- Emit comment-free Lua. Keep the explanatory comments in the TypeScript that generates it.
- **The fit ladder proposes, it never applies.** From `_pad.ts`: *"A compiler that turned Drift into Wave because Drift did not fit would make the picture on screen a lie about the object on the desk."* On a public site where the simulator is the whole product, a silent downgrade is a lie to a stranger. Degrade visibly, with named steps, or refuse.
- Every tuning knob needs a budget test across its **full** range, not its default. Sweep, do not sample.
- Ship the known-over-budget states as **blocked** knob combinations with an explanation, not as a runtime surprise.

**Warning signs:**
- A knob whose extremes were never compiled in a test.
- Budget checks on the human-readable form.
- Cost computed once at authoring time and cached across a compiler change.

**Phase to address:** Compiler-port phase for the cost function; tuning-knobs phase for the ladder and the sweep.

---

### C9: Bootloader VID/PIDs in the port filter — a route to DFU on a site whose scope says "never brick"

**What goes wrong:**
The editor's filter (`serialport.ts:26-53`, values from `configuration.json`) contains six entries:

| VID | PID | What |
|-----|-----|------|
| `0x03eb` | `0xecac` | Grid module (SAMD51) |
| `0x03eb` | `0xecad` | Grid module (SAMD51) |
| `0x303a` | `0x8123` | Grid module (ESP32-S3) — **this is ZONA** |
| `0x03eb` | `0x2402` | **Bootloader** (Grid D51) |
| `0x303a` | `0x8122` | **Bootloader** (Grid ESP32) |
| `0x303a` | `0x8124` | **Bootloader** (Knot) |

Copying the filter wholesale into HANGAR means the picker will offer a module sitting in bootloader mode, HANGAR will open it, and every subsequent protocol assumption is wrong. PROJECT.md is explicit: *"Firmware update, bootloader, DFU — HANGAR must never be able to brick a module."*

**How to avoid:**
- Ship exactly one filter entry: `{ usbVendorId: 0x303a, usbProductId: 0x8123 }`. HANGAR is ZONA-only by design (*"the simulator, the compiler and the entire visual language are 9x9-specific"*), so there is no reason to accept a SAMD51 Grid module either — connecting to a PBF4 and offering it a 9x9 config is its own failure.
- Confirm module identity **after** opening, from the module's own HWCFG/TYPE report, before enabling any write. VID/PID is a picker convenience, not an identity check. `GRID_MODULE_ZONA_RevH = 161` (`grid_protocol.h:88`).
- If a non-ZONA Grid module connects, say so kindly and stay in browse-only mode.
- Write the "no bootloader, no DFU, no firmware instruction is ever emitted" rule as a test over the set of protocol classes HANGAR can construct.

**Warning signs:**
- A filter array with more than one entry.
- Any code path that reaches a write without having read the module type.

**Phase to address:** First Web Serial phase. One line, five minutes, permanent.

---

### C10: `getPorts()` is not a session, and neither is the tab

**What goes wrong:**
Developers build the connection UX around "the site remembers your ZONA", then discover the remembering is conditional, then ship a UI with no visible way to reconnect.

**What is actually true:**

| Behaviour | Status | Confidence |
|---|---|---|
| `requestPort()` requires **transient user activation** (a real click/touch) | Yes | HIGH — spec + Chrome docs |
| Web Serial requires a **secure context** (HTTPS; `localhost` counts) | Yes | HIGH — MDN |
| `getPorts()` returns ports **this origin has already been granted** | Yes | HIGH — MDN |
| Grants show up in `chrome://settings/content/serialPorts` and can persist across restarts for USB devices | Probably, platform- and device-dependent | **MEDIUM — sources conflict.** The original Chromium tracking bug (crbug 40603963) says *"only ephemeral port permissions are supported so no data is saved across browser restart"*; later material describes persistent storage for USB serial devices. I could not pin the exact Chrome version or the exact conditions. |
| Persistence depends on the device exposing a distinguishing USB **serial number** string | Likely | **LOW — UNVERIFIED.** I could not find a serial-number string descriptor in `grid-fw`'s ESP32-S3 tree; ZONA appears to use ESP-IDF/TinyUSB defaults, which may give every unit the same serial string. Not settled. |
| A **page reload creates a new document**; the old `SerialPort` object and all JS state are gone | Yes | HIGH |
| A page with an open serial port is likely **not bfcache-eligible** | Likely | MEDIUM — the WICG discussion explicitly considers blocklisting all Web Serial pages from bfcache |
| `navigator.serial` `connect`/`disconnect` events fire on physical plug/unplug for permitted ports; the port is `event.target` (Chrome 89+) | Yes | HIGH |
| Cross-origin iframes need `allow="serial"` (Permissions-Policy `serial`) | Yes | HIGH — MDN |

**How to avoid:**
- **Design as if nothing is remembered.** A persistent, always-visible Connect button that calls `requestPort()` from a click handler. Treat `getPorts()` as a pure convenience: if it returns a matching port, offer one-click reconnect; if it returns nothing, show the same Connect button. Never gate the UI on `getPorts()` succeeding.
- **Never call `requestPort()` outside a click handler** — not in `useEffect`, not after an `await` that could consume the activation, not on `connect`. It rejects with a `SecurityError` about user gestures.
- **Wire the `connect` and `disconnect` events on `navigator.serial`** and reflect them in the UI immediately. `disconnect` is the only reliable notice of an unplug; a pending read will also fail, but later and with a less specific error.
- **Handle unplug mid-write explicitly.** On disconnect: cancel the reader, abandon the write queue, reject all pending ACK waiters with a distinguishable error, and — critically — decide whether a write was in flight. If it was, the config state on the device is unknown; the UI should say so and offer Put back once reconnected.
- **Do not rely on the tab surviving.** Persist the C4 snapshot to `sessionStorage`. Add a `beforeunload` warning only while a write is genuinely in flight, never otherwise.
- **Multiple tabs of HANGAR:** the second tab's `open()` fails with the same `NetworkError` as C1 — Chromium's exclusivity is per-port, not per-origin, and the two tabs are separate documents. Detect it and say "HANGAR is already connected in another tab" using a `BroadcastChannel` heartbeat, which is far kinder than the generic message.

**Warning signs:**
- Connect UI that only appears when `getPorts()` is empty.
- `requestPort()` called from anything but a direct click handler.
- No visible state for "your ZONA was unplugged".

**Phase to address:** First Web Serial phase.

---

### C11: A backgrounded tab throttles the timers that the write protocol and the heartbeat depend on

**What goes wrong:**
The user starts an install, switches to Ableton to hear the result, and the write takes minutes or times out. Or they leave HANGAR open in a background tab and the module decides no editor is connected.

**The numbers, both sides verified:**
- **Firmware side:** the ESP32-S3 port task declares `EDITOR TIMEOUT` when the last editor heartbeat is older than **2 000 000 µs = 2 s** (`esp32s3/components/grid_esp32_port/grid_esp32_port.c:472-481`). The editor sends an editor heartbeat every **300 ms** and a grid heartbeat every **250 ms** (`runtime-manager.store.ts:42-43`).
- **Browser side:** Chrome throttles timers in hidden tabs to roughly **once per second**, and applies **intensive throttling to once per minute** when the page has been hidden >5 min, the timer chain count is ≥5, and the page has been silent ≥30 s.

So: 1 Hz throttling still beats the 2 s timeout, but **intensive throttling does not** — the module will declare EDITOR TIMEOUT and stop pushing LED preview. Worse, the editor's write machinery uses timers throughout: `responseTimeout` defaults to **250 ms** via `setTimeout` (`engine.store.ts:317-320`), `processElement` busy-waits with `await this.sleep(1)` (`engine.store.ts:355-362`), the retry backoff is `setTimeout(120 * (i+1))`, and `AutoEventFetcher` polls at 150 ms. Under 1 Hz throttling, a 250 ms response window becomes a ~1 s window and a 1 ms poll becomes a 1 s poll — the whole pipeline runs 100-1000x slower and spuriously times out.

**How to avoid:**
- **Do not start or continue a write while `document.hidden`.** Queue it, and on `visibilitychange` → visible, either resume or ask. This is simpler and more honest than trying to defeat throttling.
- If a write is genuinely in flight when the tab hides, **finish it** (do not abort mid-config — that is C3) but scale the timeouts: derive the ACK timeout from a `performance.now()` deadline rather than a `setTimeout` duration, so a late-firing timer still measures real elapsed time correctly.
- **Never busy-wait with `sleep(1)`.** Use an event-driven queue driven by the ACK promise resolution. The editor's `while (...) await this.sleep(1)` loop is a desktop-app pattern that is actively harmful in a throttled tab.
- **Keep the heartbeat off `setInterval` chains.** A chain count ≥5 is one of the intensive-throttling conditions. Prefer a self-rescheduling `setTimeout` reset from an event, or simply accept EDITOR TIMEOUT in a hidden tab and re-establish on visible (which is the honest behaviour anyway — nothing needs the LED mirror when nobody is looking).
- Web Serial **reads and writes themselves are not rAF- or timer-throttled**; the streams keep working. Only the JS scheduling around them is throttled. Do not mistake one for the other.

**Warning signs:**
- Timeouts that only reproduce when the developer tabs away to read the docs.
- `EDITOR TIMEOUT` in the module's debug output.
- Any `setInterval` in the transport layer.

**Phase to address:** Transport phase for the timeout design; audition phase for the hidden-tab write policy.

---

### C12: Read-loop lock ordering, framing across chunk boundaries, and an rx buffer that never shrinks

**What goes wrong:**
Three separate bugs that all present as "the port cannot be reopened" or "messages get garbled under load".

**1. `releaseLock` ordering.** `port.close()` rejects while `port.readable` is locked. The correct sequence is `reader.cancel()` → await the read loop to exit → `reader.releaseLock()` → `port.close()`. The existing `SerialTransport.close()` does `await this.reader.cancel(); this.reader.releaseLock();` in a `try`, then `port.close()` in another `try` — and the read loop's own `finally` **also** calls `releaseLock()`. A double release throws, and the `catch` swallows it with `console.warn`. It happens to work; it is not a pattern to copy verbatim. In HANGAR, own the ordering explicitly with a single promise representing "the read loop has exited", and await it before closing.

**2. Framing across chunk boundaries.** Grid frames are delimited by EOT (4) then LF (10) three bytes apart. The existing detector is `if (rxBuffer[i] === 10 && rxBuffer[i - 3] === 4)`. A `read()` can split a frame anywhere, including between the EOT and the LF, so accumulation is mandatory — and the accumulator must be scanned from the point where the last complete frame ended, not from zero. At 2 000 000 baud with an 81-LED preview (81 × 8 = 648 bytes) and a **default `bufferSize` of 255 bytes** (MDN: *"If not passed, defaults to 255"*), a single preview report arrives as at least three chunks. Set `bufferSize` explicitly — 4096 or more — when opening.

**3. The rx buffer grows without bound.** If the module sends bytes that never complete a frame (noise on connect, a partially-flushed buffer from a previous owner, a firmware mismatch producing an unknown class), `rxBuffer` grows forever and the scan is re-run over the whole thing on every chunk — quadratic, and a slow leak. Cap it: if the buffer exceeds a few frames' worth with no delimiter found, drop to the last plausible delimiter and log. Never let it grow past a fixed ceiling.

**4. Swallowed inbound errors.** The existing handler wraps delivery in `catch (e) { console.error("MessageStream works too fast (TODO):", e) }`. The user's notes identify the real cause: *"message-stream.store.ts element-name handlers lacked `?.` so a name report before module registration threw a red banner per message; ZONA reproduces reliably."* If HANGAR ports this code, port the fix, and do not ship a `catch` that turns a protocol bug into console noise.

**Warning signs:**
- "Failed to open serial port" on a *reconnect* after a clean disconnect (that is a leaked lock, not C1).
- Message corruption that only appears when the module is animating (high preview traffic).
- Memory climbing over a long connected session.

**Phase to address:** Transport phase.

---

### C13: GPLv3 — serving minified JS is conveying object code

**What goes wrong:**
HANGAR ports `_pad.ts` and `pad-sim.ts` from `grid-editor`, which is GPLv3. Independently, its runtime dependency **`@intechstudio/grid-protocol` ships a GPLv3 LICENSE file** (verified in `node_modules/@intechstudio/grid-protocol/LICENSE`), so even the protocol layer is copyleft. HANGAR is a derivative work and must be GPLv3 — PROJECT.md already accepts this. The trap is what "ship the source" means for a static site.

**The practical consequences:**
1. **Delivering JS to a browser is conveying.** The bundle the visitor downloads is a copy of the program. Minified/bundled output is **object code**, not "the preferred form of the work for making modifications" — so shipping only `assets/index-a1b2c3.js` does not satisfy GPLv3 §6 on its own.
2. **What actually discharges the obligation, cheaply, for a static site:**
   - Publish the full source repository publicly (the BOTOR precedent: *"Grid Editor is GPLv3 so a public binary REQUIRES public source"*). A public repo at a stable URL is the simplest §6(b)-style offer.
   - Put a prominent, permanent **Source** link in the site chrome (footer and About), pointing at the exact repo, plus the commit SHA of the deployed build. A generic "github.com/x/y" link is weaker than a link that identifies *this* build.
   - Ship a `LICENSE` file at the site root serving the full GPLv3 text, and reference it from the page.
   - Include the **build scripts and configuration** in the repo — GPLv3's Corresponding Source explicitly includes the scripts to control compilation and installation. A repo with source but no working build is not compliant.
   - Emit **sourcemaps** alongside the bundle. Not strictly required if the repo is public, but it is the cheapest possible good-faith gesture and it removes the argument entirely.
   - **Preserve copyright and licence notices** in the ported files. Copying `_pad.ts` and `pad-sim.ts` without their headers strips required notices. Add a header to each ported file stating its origin (repo, path, commit) and that it remains GPLv3.
3. **Third-party licences.** Generate a `THIRD-PARTY.md` (or `/licenses` page) from the dependency tree at build time. Two specific things to check: `@wasm-fmt/lua_fmt` (transitively pulled in by grid-protocol — its licence is not GPL and must be listed and honoured), and any font, icon, or UI kit used for the acid-lime identity. A GPLv3 project can include permissively licensed dependencies; it cannot include an incompatible copyleft one, so check before adopting.
4. **The commit-hygiene rule from the prior art carries over.** *"Upstream Intech commits carry their OWN Co-Authored-By trailers... only OUR commits/docs must stay clean."* If HANGAR's repo is public from day one, this applies from commit one.
5. **Unreleased-hardware exposure is a business decision, not a licence one.** The docs site is password-gated and `noindex` for exactly this reason. HANGAR is public by design and its catalog *is* documentation of ZONA's capabilities. Decide deliberately and up front whether launch waits on ZONA's public release, because a public GPLv3 repo cannot be un-published. Related: `@intechstudio/grid-protocol` is Intech's package and its version string tracks firmware — pinning a specific version in a public `package.json` publicly discloses the firmware generation HANGAR targets.

**Warning signs:**
- A deploy pipeline that publishes `dist/` from a private repo.
- Ported files with no origin header.
- No licences page.

**Phase to address:** Phase 0 / scaffold. Retrofitting licence headers across a ported 3.2k-line compiler after the fact is miserable; doing it at port time is free.

---

### C14: Dozens of animated canvases — timestep, throttling, memory, and reduced motion

**What goes wrong:**
The visual identity is *"a rack of running machines"* — every card animating constantly. Naively that is N canvases × N `requestAnimationFrame` loops × N 2D contexts, and it turns a catalog page into a fan-spinning, battery-draining tab that Chrome then throttles into a slideshow.

**The prior art already solved this and the solution should be ported wholesale** (`pad-sim-host.ts`):

| Technique | Implementation | Why |
|---|---|---|
| **One rAF for the whole page** | A single `SimHost` steps every engine | N loops is N times the scheduling overhead and N chances to desync |
| **Fixed 10 ms timestep with an accumulator** | `TICK_MS = 10`, `pendingMs += min(dt, MAX_CATCHUP_MS)` | The firmware runs at 100 Hz; a variable timestep drifts against it and the preview stops being firmware-faithful |
| **Catch-up clamp (the spiral-of-death fix)** | `MAX_CATCHUP_MS = 100` — at most 10 ticks per frame | Without it, returning from a backgrounded tab replays minutes of ticks in one frame: the page freezes, and if the catch-up takes longer than a frame it never catches up. The comment is exact: *"on return the animation must resume near where it paused instead of replaying minutes of ticks in one frame"* |
| **Decoupled tick and paint rates** | `RENDER_INTERVAL_MS = 33` — engines at 100 Hz, canvases at ≤30 fps | *"Ticking is pointer arithmetic; painting is the expensive half"* |
| **Pause offscreen cards** | `IntersectionObserver`, `threshold: 0`; hidden cards do not tick | On a long catalog this is the difference between 8 running engines and 80 |
| **Self-cancelling loop** | `if (any) rafId = requestAnimationFrame(...)` else stop | An idle page costs literally zero |
| **No `shadowBlur`** | Removed deliberately: *"a blurred rect per lit cell at 30 fps across nine canvases is measurable jank on the renderer thread"* | Directly relevant to HANGAR's glow aesthetic — get the glow from CSS on the canvas element, or from a pre-rendered sprite, not from per-cell `shadowBlur` |
| **`devicePixelRatio` only where it matters** | Thumbnails at cell 12; only the focused preview backs its pixels with DPR | A 3x-DPR 9x9 grid on 40 thumbnails is 9x the fill rate for no visible gain |
| **Single teardown hook** | `destroy()` cancels the rAF, detaches pointer listeners, disconnects the observer, removes the media listener, clears the map | *"No `setInterval` exists anywhere in this design, so after this there is nothing left to leak"* |

**Additional traps specific to HANGAR's larger catalog:**
- **Per-card 2D contexts are a real budget.** Browsers cap the number of live WebGL contexts hard and 2D contexts softly; dozens of `<canvas>` elements each with a backing store are megabytes of GPU/CPU memory. With `IntersectionObserver` culling, also **release the backing store** for long-offscreen cards (set `canvas.width = 0`) or virtualise the list so only visible cards have canvases at all. Decide this at the catalog size the site will actually ship with, not with nine cards.
- **rAF does not run in a background tab at all.** That is fine — the accumulator clamp makes the resume graceful — but do not put anything correctness-critical in the rAF loop.
- **`prefers-reduced-motion` is an accessibility requirement, not a nicety.** For users with vestibular disorders, a page of constantly moving grids is genuinely harmful, and this site's entire visual identity is motion. The prior art's answer is the right one and is better than "freeze everything": render **one representative frame** (`REDUCED_MOTION_TICKS = 64`, *"64 ticks in, a sine look sits near its peak, so the card shows its colour and pattern rather than a black square"*), subscribe to the media query **live** so an OS toggle takes effect without a remount, and allow motion only while the user is actively causing it with a pointer — *"uninvited ambient animation is not the carve-out"*. HANGAR should add a visible in-page motion toggle too, since the site's whole premise is motion and some visitors will want to see it despite an OS-level preference.
- **Determinism.** The engines must not read `Date.now()`; the host owns the clock. This is what makes golden-frame tests (C6, tier 4) possible at all.

**Warning signs:**
- More than one `requestAnimationFrame` call site.
- Any `setInterval` in rendering code.
- CPU staying high after scrolling the catalog out of view.
- Frame time spikes right after returning to the tab.

**Phase to address:** Catalog/simulator-cards phase. Port `pad-sim-host.ts`'s structure rather than rewriting it — every one of its comments is a bug someone already paid for.

---

### C15: Pinning `@intechstudio/grid-protocol` against a moving firmware target

**What goes wrong:**
The package description is literally *"Grid protocol descriptors automatically generated from the grid-fw repository"*, and the version string `1.20260825.1135` is a firmware date-time. HANGAR pins it (PROJECT.md constraint). Two failure directions:
- **Module newer than the pin:** new protocol classes or changed parameter offsets; HANGAR's decoder mis-parses or drops frames it does not know.
- **Module older than the pin:** HANGAR emits instructions the module does not implement. The user's notes already record a version-dependent removal: *"`touch_area`/`tar` existed in the old 1.6.9 protocol but is GONE from current firmware."*

**How to avoid:**
- **Read the module's firmware version at connect** (the `HEARTBEAT`/`CONFIG` class parameters carry `VMAJOR`/`VMINOR`/`VPATCH`) and compare against the version the pin was built for. Show a clear, non-blocking warning outside the tested range — but keep install enabled unless it is known-broken; a hard gate on an exact version match will lock out users for no reason.
- Record the tested firmware range in the repo, and treat a protocol bump as a **deliberate, tested change** with a hardware pass, never a Dependabot auto-merge.
- Because it is GPLv3 and published by upstream, the package can be vendored if upstream ever breaks HANGAR — note that as an escape hatch so the decision does not have to be made in a panic.
- HANGAR uses a small fraction of the protocol. Consider a thin adapter over `grid.encode_packet` / `decode_packet_frame` so a breaking upstream change lands in one file.

**Warning signs:**
- No firmware version displayed anywhere in the UI.
- A `^` or `~` range on grid-protocol in `package.json`.
- Nothing in CI that fails when the pinned version changes.

**Phase to address:** Transport phase for version reporting; Phase 0 for the pin policy.

---

## Moderate Pitfalls — ZONA/Grid traps that must not be rediscovered

All verified against `grid-fw` @ `dc7d301e` unless marked otherwise.

| Trap | Verified | Consequence for HANGAR |
|---|---|---|
| **Lua 5.5 turns a fractional argument into 0** with no error (`LUA_FLOORN2I` — confirmed present in `common/dep/lua-5.5.0/src/lvm.h:31-35`; the specific `F2Ieq` build setting is **not verified**, MEDIUM) | Partial | Close every division and `sqrt` with `// 1` / `math.tointeger`. A brightness or rate that silently becomes 0 is a black pad with no error message, and the simulator must reproduce the same truncation or previews lie |
| **A page change destroys the whole Lua VM** | **HIGH** — `grid_ui_bulk_page_load` calls `grid_lua_stop_vm` then `grid_lua_start_vm` (`grid_ui.c:1069-1071`); the page-read path also does a full GC and clears every event | Globals and `touch_cb` are wiped, touch min/max reset. Any HANGAR session state keyed to "what the pad is running" is invalid after a page change. The prior art's answer is a session key that invalidates late writes (`sessionKeyOf`) — port it |
| **The LED preview mirror can never exceed ~3.3 Hz** | **HIGH — mechanism now explained, not just measured.** `grid_protocol_led_preview_generate` is called from exactly two places: the editor-heartbeat branch of `grid_decode.c:731`, and `grid_ui.c:743` gated on `editor_connected` **and** on a UI event having produced message bytes. The editor heartbeat is 300 ms (`runtime-manager.store.ts:42`) → 3.33 Hz ceiling **by construction** | Live thumbnails from hardware are impossible. The simulator is not a nice-to-have, it is the only possible preview. Also: a touch pop produces no event, so the preview does not refresh during touch-only interaction — hardware is fine, the mirror is not |
| **The touch shim pops exactly one sample per 100 Hz cycle** | **HIGH** — `common/src/lua/events.lua` `_events_process` ends with a single `if ele[i]:touch_pop() and ele[i].touch_cb then ... end` per element per cycle | 1 finger fully delivered; 2 fingers drop ~50%; 5 drop ~80%. Any catalog config advertising multi-finger behaviour must either drain the ring with `self:touch_pop()` (~97 chars, callable from Lua) or be honest about the limit. The simulator must reproduce the one-pop budget or previews will feel better than hardware |
| **MIDI throughput ≈ 18 messages per 10 ms cycle** | **HIGH** — `GRID_LUA_STDO_LENGTH 256` (`grid_lua.h:17`) ÷ 14 bytes per frame = 18 | A five-finger 14-bit chord does not fit in one cycle. Configs that send per-contact hi-res XY need a rate budget, and the simulator should surface overflow rather than silently modelling perfect delivery |
| **`evt` 9 is DOWNUP** — a fast tap arriving as one message (user-confirmed, inferred from T100 nibble semantics — MEDIUM) | Partial | Code waiting for a separate `5` leaks a stuck contact. Treat anything not 1 or 4 as "finger gone". This is a shipped fix in the prior art (`fingerWrap now claims on e==9`) |
| **`self:glc`/`self:glp` are silent no-ops on ZONA**; `glp(n, layer, -1)` always errors; Mode blocks (`bmo`/`emo`/`epmo`/`pmo`) abort Setup so `touch_cb` is never assigned | From notes — **not re-verified this session** | Never emit them. A guarded-call scanner over emitted Lua (the prior art has `LED_CALLS`/`OUT_CALLS`/`GUARDED_CALLS` in `_pad.ts:3505-3519`) should be a test, not a convention |
| **The Timer handler only exists once a Timer config has been stored** | From notes — **not re-verified** | Reinforces Timer-first ordering (C3) |
| **One layer caps at 49.6% brightness** (weights sum 254, divisor 512); layers add, so drive 1 and 2 together | From notes; the `/512` is pinned in `pad-sim.ts` tests | A "full brightness" knob that drives one layer looks dim on hardware and correct in a simulator that models it wrong. Both must model it identically |
| **Orientation is standard screen convention**: logical (0,0) upper-left, +y down; touch and LED axes agree — hardware-confirmed 2026-08-27 via the LED probe | HIGH (user hardware) | Do not re-litigate. `127 - y` is "up is louder"; zone 0 is top-left; no flips needed |
| **Serpentine is corrected in firmware's lookup, and `ZONA.svelte`'s inversion is load-bearing** — they are complementary, not a double correction | HIGH — table read this session (C6) | Removing the flip misplaces 40 of 81 LEDs. Any simulator must reproduce it |
| **Writing while the user is touching the pad** | Reasoned from firmware, **not hardware-verified** | Setup runs immediately in the live VM, so a held contact's state table is destroyed mid-gesture. Expect a stuck LED or a stuck MIDI note. Mitigations: write on a debounce (the prior art uses 250 ms, session-keyed), and prefer configs whose Setup leaves LEDs in a defined state. **This is on the open hardware checklist and should stay there** |

---

## Technical Debt Patterns

| Shortcut | Immediate benefit | Long-term cost | When acceptable |
|---|---|---|---|
| Resolve "installed" on the writer promise instead of an ACK | Skips the whole response-waiter layer | Every safety claim becomes unverifiable; C3 becomes undetectable | **Never.** This is the load-bearing wall |
| Copy the editor's six-entry VID/PID filter | One paste | A public path to a bootloader on a site that promises it cannot brick | **Never** |
| Write Setup and Timer with `Promise.all` | Faster install | Non-deterministic ordering; C3 becomes routine | **Never** |
| Skip the snapshot in the first write milestone, "add Put back later" | Ships the demo a week earlier | The first external tester who loses a config is also the last | **Never.** Snapshot ships with the first write |
| Cost the config with `.length` on the pretty source | No WASM boot dependency | Budgets wrong by 30-50%; configs rejected at install time in front of the user | Only for a throwaway spike |
| Auto-store to flash so "it just persists" | Removes a click | Silent permanent writes to a stranger's device; flash wear | **Never** |
| A test that asserts the current output because it looks right | Green suite today | The exact `ledIndexToCell` failure mode | **Never** for firmware facts; acceptable for pure styling |
| One `requestAnimationFrame` per card | Simplest component API | Scheduling overhead, drift between cards, N teardown paths | Only below ~5 cards, and the site will not stay there |
| `shadowBlur` glow for the lime aesthetic | Looks right immediately | Measurable jank at 9 cards, worse at 40 | Only on a single hero canvas, never on thumbnails |
| Vendor-lock to `latest` grid-protocol | Always current | Silent protocol drift with no test coverage | **Never**; pin and bump deliberately |
| Ship `dist/` from a private repo | Simple deploy | GPLv3 violation on a public site | **Never** |

---

## Integration Gotchas

| Integration | Common mistake | Correct approach |
|---|---|---|
| **Web Serial — connect** | Assuming the port picker listing the device means it can be opened | Catch `NetworkError` on `open()`, name Grid Editor in the message, offer retry on the same port object |
| **Web Serial — permission** | Building the UI around `getPorts()` remembering the device | Always-visible Connect button calling `requestPort()` from a click; `getPorts()` is a shortcut only |
| **Web Serial — user gesture** | `requestPort()` after an `await`, or in an effect | Call it synchronously in the click handler |
| **Web Serial — teardown** | `port.close()` while the reader holds the lock | `cancel()` → await loop exit → `releaseLock()` → `close()`, with a single promise representing loop exit |
| **Web Serial — buffer** | Leaving `bufferSize` at its 255-byte default | Pass an explicit larger `bufferSize`; a single 81-LED preview report is 648 bytes and will always be split otherwise |
| **Web Serial — lifetime** | Holding the port open forever in a background tab | Close on hidden-and-idle and on `pagehide`; a HANGAR tab must not lock the user out of Grid Editor |
| **Grid protocol — framing** | Parsing each `read()` chunk independently | Accumulate, scan for EOT+LF, slice from the last complete frame, and **cap the accumulator** |
| **Grid protocol — success** | Treating a resolved promise as an accepted config | Match the module's ACKNOWLEDGE frame by class, element, event and `LASTHEADER` |
| **Grid protocol — errors** | `String(e)` on a rejection | The runtime rejects with plain `{ value, text, type }` objects; read `.text`, and normalise at HANGAR's adapter boundary |
| **grid-protocol package — WASM** | Calling `compressScript`/`checkSyntax` before `initLuaFormatter()` resolves | Gate app boot on `padCompilerReady()`; add `'wasm-unsafe-eval'` to CSP; verify `application/wasm` MIME |
| **grid-protocol package — versioning** | Auto-updating a firmware-tracking dependency | Pin; read and display the module's firmware version; bump deliberately with a hardware pass |
| **Cloudflare static hosting** | Assuming defaults are fine | Verify `application/wasm` MIME, set the CSP header including `'wasm-unsafe-eval'`, and confirm HTTPS (Web Serial is secure-context only) |

---

## Performance Traps

| Trap | Symptoms | Prevention | When it breaks |
|---|---|---|---|
| One rAF per card | CPU climbs linearly with catalog size; cards visibly desync | Single host loop stepping all engines | ~10 cards |
| Variable timestep | Animation speed differs between a 60 Hz and a 144 Hz display; slow drift vs hardware | Fixed 10 ms accumulator matching the firmware tick | Immediately, on any non-60 Hz display |
| No catch-up clamp (spiral of death) | Multi-second freeze on returning to the tab; sometimes never recovers | `MAX_CATCHUP_MS = 100` — cap ticks per frame | First time anyone tabs away for a minute |
| Ticking and painting at the same rate | Frame time dominated by `fillRect` | Tick at 100 Hz, paint at ≤30 fps | ~9 cards |
| Offscreen cards still ticking | Scrolling past the catalog does not reduce CPU | `IntersectionObserver` gating | ~20 cards |
| Canvas backing stores never released | Steady memory growth; tab memory in the hundreds of MB | Virtualise the list, or `canvas.width = 0` for long-offscreen cards | ~40 cards |
| `shadowBlur` per lit cell | Jank correlated with how many LEDs are lit | Pre-rendered sprite or CSS filter on the element | ~9 cards |
| DPR-scaled thumbnails | 3x fill rate on a Retina/4K display for invisible gain | DPR only on the focused preview | Any HiDPI display |
| Unbounded rx buffer + full rescan | Memory climb and rising CPU over a long connected session | Cap the buffer; scan from the last frame boundary | A long session with a chatty module |
| `await sleep(1)` busy-wait in the write queue | Install takes minutes in a background tab | Event-driven queue resolved by the ACK | Any hidden tab |

---

## Security and Safety Mistakes

Hardware safety is this project's security model. Beyond the usual web hygiene:

| Mistake | Risk | Prevention |
|---|---|---|
| Any write on page load, or a "probe" write to detect capabilities | Breaks the site's central promise; a visitor loses a config by *looking* | Zero writes without a click. Assert it: a test over the connect path that fails if any write instruction is constructed |
| Bootloader VID/PIDs in the filter | A path toward DFU on a site scoped to never brick | Single ZONA VID/PID; verify module type after open |
| Emitting any firmware/bootloader/NVM-erase protocol class | Bricking | Whitelist the protocol classes HANGAR may construct; test the whitelist |
| Decoding a shared URL stamp into a *different* config than the author had | A stranger installs something they never saw | The prior art already found this: *"a `b` xy-axes stamp relabelled `a` can decode to a DIFFERENT card (2-bit misalign); fix = checksum format `e`"*. **Ship the checksum before the share feature is public** — this is a known open hole, not a hypothetical |
| Trusting URL-supplied state without revalidation | Malformed or hostile stamps producing out-of-range Lua | Decode → validate → compile → `checkSyntax` → budget check → only then enable install. Fail closed and say so |
| No visible "what will be written" before writing | The user cannot consent to what they cannot see | Show the target (Setup + Timer, RAM or flash), the character costs, and the fact that the original is snapshotted |
| Store reachable while a temporary state is active | Permanent silent write of the wrong config | Single guarded store path that restores-then-aborts if unconfirmed |
| Publishing a catalog that documents unreleased hardware | Business/relationship risk with Intech, not a technical one | Decide launch timing deliberately; the docs site's password gate exists for exactly this reason and HANGAR has no equivalent |

---

## UX Pitfalls

| Pitfall | User impact | Better approach |
|---|---|---|
| Generic "Failed to connect" on the exclusive-port error | The single most common failure has the least useful message; users conclude their ZONA is broken | Name Grid Editor and the tray; offer a one-click retry |
| Install disabled on Firefox/Safari/iOS with no explanation | A large share of visitors think the site is broken | Detect `!('serial' in navigator)` and say plainly: *"Installing needs Chrome, Edge or Opera on desktop. Everything else on this page works right here."* Keep the catalog and simulator fully alive |
| No distinction between RAM audition and flash Store | The user does not know whether their change survives unplugging | Two clearly different actions with different words: "Try it on your pad" vs "Save to the pad's memory" |
| Put back hidden in a menu | The escape hatch is unfindable at the moment of panic | Persistent, always-visible while connected |
| No indication a write is in progress | The user unplugs mid-write | Explicit progress state; block navigation only during a real in-flight write |
| Simulator implies fidelity it does not have | The pad looks different from the card and the user blames the hardware | Mark presets never verified on hardware; be honest about the touch-sample and MIDI-throughput limits in the card copy |
| Motion with no opt-out | Genuinely harmful for vestibular disorders on a page that is *entirely* motion | Honour `prefers-reduced-motion` live, render one representative frame, and add a visible in-page motion toggle |
| Silent fit-ladder downgrade | The card animates one thing and the pad does another | Ladder proposes, never applies; name every step |

---

## "Looks Done But Isn't" Checklist

- [ ] **Connect:** works with Grid Editor running? Tested on Windows, macOS and Linux? Distinguishes "in use" from "cancelled" from "unplugged"?
- [ ] **Connect:** filter contains exactly one VID/PID, no bootloaders? Module type verified after open, not just at pick time?
- [ ] **Connect:** port released on hidden-and-idle and on `pagehide`, so Grid Editor can reconnect?
- [ ] **Reconnect:** works after a page reload? After a replug? After a second tab was opened and closed?
- [ ] **Snapshot:** verified non-empty for both events before any write button enables? Survives a reload? Downloadable as a file?
- [ ] **Write:** Timer written and ACKed before Setup is sent? Verified by a test, not by reading the code?
- [ ] **Write:** "installed" driven by the module's ACK, not a resolved local promise?
- [ ] **Write:** partial-write state has its own error, its own UI, and both Try again and Put back?
- [ ] **Write:** tested with an injected dropped ACK, a delayed ACK, and a mid-write disconnect against a fake module?
- [ ] **Write:** blocked or queued while `document.hidden`?
- [ ] **Store:** exactly one call site? Restores-then-aborts if any temporary state is unconfirmed? Never fires without a direct click?
- [ ] **Put back:** re-stores to flash if the session stored? Tested after a page change and after a replug?
- [ ] **Budget:** every knob swept to both extremes, `compressScript` length ≤ 908 for both events, comment-free output?
- [ ] **Simulator:** every firmware constant transcribed verbatim into tests with a `grid-fw` file:line citation?
- [ ] **Simulator:** compiler↔simulator agreement swept, not sampled?
- [ ] **Boot:** `padCompilerReady()` awaited before any card renders? Verified on the deployed build, not just dev?
- [ ] **CSP:** includes `'wasm-unsafe-eval'`? `.wasm` served as `application/wasm`? Site is HTTPS?
- [ ] **Performance:** one rAF total? Offscreen cards paused? CPU drops when the catalog scrolls away? Memory flat over 30 minutes?
- [ ] **Reduced motion:** honoured live on an OS toggle, with a visible in-page override?
- [ ] **Licence:** GPLv3 text served, Source link with the deployed commit SHA, ported files carry origin headers, third-party licences page generated at build?
- [ ] **Share:** stamp checksum shipped, so a relabelled stamp fails closed rather than decoding to a different card?

---

## Recovery Strategies

| Pitfall | Recovery cost | Recovery steps |
|---|---|---|
| C1 exclusive port | LOW | Quit Grid Editor from the tray; retry `open()` on the same port object |
| C3 half-written config | LOW **if designed for** | Retry the failed half; if that fails, `PAGEDISCARD` (RAM reload from flash); if all else fails, unplug and replug — RAM auditions never touched flash |
| C3 half-written config with **no** snapshot and **no** PAGEDISCARD path | **HIGH — unrecoverable for the user** | This is why C4 ships with the first write, not after |
| C4 empty snapshot | HIGH | If it has already overwritten: nothing HANGAR can do. Prevention only. A downloadable snapshot converts this from HIGH to LOW |
| C5 audition stored to flash | MEDIUM | Put back writes the snapshot and re-stores; only works if C4 held |
| Unplug during a `PAGESTORE` | MEDIUM | LittleFS survives; the config may be half-updated (firmware stores Setup before Timer). Recovery is re-store from the snapshot, then read back and compare |
| C6 fidelity drift found late | MEDIUM-HIGH | Every affected preset must be re-verified; if a stamp format encoded the wrong assumption, old shared URLs must be migrated or failed closed |
| C7 WASM not initialised | LOW | Add the boot gate; no data at risk |
| C12 leaked stream lock | LOW | Reload the page; the document teardown releases the port. Fix the ordering |
| C13 GPLv3 non-compliance | LOW **if caught early**, MEDIUM later | Publish the repo, add notices, add the licences page. Retrofitting headers across a ported 3.2k-line compiler is the expensive part |
| C15 protocol/firmware mismatch | MEDIUM | Pin to the known-good version, add version reporting, hardware-pass the bump |

---

## Pitfall-to-Phase Mapping

Phase names are descriptive; the roadmap will name them. The **ordering constraints** are the point.

| Pitfall | Prevention phase | Verification |
|---|---|---|
| C13 GPLv3 / source availability | **Phase 0 — scaffold** | Deployed site serves LICENSE, footer Source link resolves to the deployed SHA, ported files have origin headers, `/licenses` page generated at build |
| C15 protocol pin policy | **Phase 0 — scaffold** | Exact pin in `package.json`, tested-firmware range documented, CI fails on an unreviewed bump |
| C7 WASM formatter init; C8 budget correctness | **Phase 1 — compiler port** | `checkSyntax("local a=1")` true on a cold deployed load; cost equals `compressScript(...).length` for every preset; CSP header present |
| C6 fidelity oracles (strategy) | **Phase 1 — before the simulator port** | Every firmware constant transcribed with a `grid-fw` file:line citation; a deliberately mutated constant makes the suite red |
| C6 fidelity drift (mechanism); C14 render architecture | **Phase 2 — simulator + catalog cards** | Compiler↔simulator sweep green; golden frame hashes per preset; one rAF; CPU drops on scroll-away; reduced motion honoured live |
| C1 exclusive port; C9 VID/PID filter; C10 permission model; C12 framing and teardown; C15 version reporting | **Phase 3 — Web Serial connect** | Connect attempted with Grid Editor running on all three OSes produces the named message; filter has one entry; module type checked after open; reconnect works after reload and replug; port released on hide |
| C2 ACK-based success; C11 hidden-tab write policy | **Phase 3 — transport, before any write feature** | Fake-module tests: dropped ACK, delayed ACK, mid-write disconnect; write blocked while hidden |
| C4 snapshot and Put back | **Phase 4 — with the first write, not after** | Snapshot non-empty gate; downloadable file; Put back after page change and after replug |
| C3 half-written config | **Phase 4 — RAM audition** | Timer-first asserted by test; retry on injected transient errors; `PadPartialWriteError` surfaced with both recovery buttons; PAGEDISCARD path exercised |
| C5 audition reaching flash; flash wear; unplug-during-store | **Phase 5 — Store to flash** | Single store call site; restore-then-abort test; a test asserting temporary state cannot reach the store path; read-back verification after store |
| C8 fit ladder; stamp checksum (known open hole) | **Phase 6 — tuning knobs + share URL** | Full-range knob sweep under budget; ladder never applies silently; a relabelled stamp fails closed |

**Ordering consequences the roadmap should adopt:**
1. Licence and pin decisions in Phase 0 — free then, expensive later.
2. Oracle strategy **before** the simulator port, not after.
3. Transport with real ACKs **before** any write feature — C2 is the wall everything else leans on.
4. Snapshot/Put back **in the same phase as** the first write — never a follow-up.
5. Store to flash is its **own** phase, after audition and Put back both work.

---

## Sources

**Firmware — `C:\Users\sabot\Documents\Claude\grid-fw` @ `dc7d301e` (read-only, HIGH confidence)**
- `common/src/c/grid_module.c:445-458` — the R0-R8 LED lookup table; even rows descending, confirming even-row mirroring and hw 8 = logical (0,0)
- `common/src/c/grid_ui.c:1002-1071` — `grid_ui_bulk_page_load`: `grid_lua_stop_vm` / `grid_lua_start_vm`, full VM destruction on page change
- `common/src/c/grid_ui.c:1098-1168` — `grid_ui_bulk_page_store`: per-event LittleFS files, `cfg_changed_flag` gating, ascending event order, `PT_YIELD` between writes
- `common/src/c/grid_ui.c:740-760` — LED preview generation gated on `editor_connected` and on a UI event producing message bytes
- `common/src/c/grid_decode.c:718-733` — LED preview pushed from the editor-heartbeat handler
- `common/src/c/grid_decode.c` `grid_decode_pagediscard_to_ui` — PAGEDISCARD → `grid_ui_bulk_page_load`, yellow-dim alert, silent `return 1` if a bulk is in progress
- `common/src/c/grid_protocol.h:88, 127` — `GRID_MODULE_ZONA_RevH 161`, `GRID_PARAMETER_ACTIONSTRING_maxlength 909`
- `common/src/c/grid_lua.h:17` — `GRID_LUA_STDO_LENGTH 256` (the 18-MIDI-messages-per-cycle arithmetic)
- `common/src/lua/events.lua` — `_events_process`: exactly one `touch_pop()` per element per cycle
- `esp32s3/components/grid_esp32_port/grid_esp32_port.c:472-481` — 2 000 000 µs editor heartbeat timeout
- `common/dep/lua-5.5.0/src/lvm.h:31-35` — `LUA_FLOORN2I` present (the specific build setting **not** verified)

**Prior art — `C:\Users\sabot\Documents\Claude\grid-editor` @ `redesign` (read-only, HIGH confidence)**
- `src/renderer/main/zona/_pad.ts:51-72` — `padCompilerReady` / `assertPadCompilerReady`
- `src/renderer/main/zona/_pad.ts:106-118` — `ledIndexToCell` with the even-row comment and the "no emitted Lua depends on it" scoping
- `src/renderer/main/zona/_pad.ts:3451-3500` — `PadPartialWriteError`, `TRANSIENT_WRITE`, `isTransient` (the plain-object rejection trap), `withRetry`
- `src/renderer/main/zona/_pad.ts:3890-3928` — `writePad`: Timer-first rationale, per-half retry, "never `GridElement.sendToGrid()`"
- `src/renderer/main/zona/pad-sim-host.ts` — single rAF, `TICK_MS 10`, `MAX_CATCHUP_MS 100`, `RENDER_INTERVAL_MS 33`, `REDUCED_MOTION_TICKS 64`, `IntersectionObserver`, no `shadowBlur`, single `destroy()`
- `src/renderer/main/zona/zone-solo-guard.ts` — restore-then-abort before PAGESTORE
- `src/renderer/tests/pad-sim.test.js:70-107` — the verbatim 81-entry `FIRMWARE_TABLE`, the bijection/self-inverse property, and the cross-check tying `ledIndexToCell` to `hwToScreen`
- `src/renderer/runtime/runtime.ts:864-879` — `GridEvent.sendToGrid()` resolving `{ value: true }` when `isValid()` is false
- `src/renderer/runtime/runtime.ts:1260-1267` — `GridElement.sendToGrid()` using `Promise.all` (no ordering guarantee)
- `src/renderer/runtime/engine.store.ts:110-165, 300-362` — `ResponseWaiter`, `"Waiting for response was interrupted"`, 250 ms default `responseTimeout`, recursive retry, `await this.sleep(1)` busy-wait
- `src/renderer/runtime/runtime-manager.store.ts:42-43` — `heartbeat_editor_ms = 300`, `heartbeat_grid_ms = 250`
- `src/renderer/runtime/services.ts:38-40` — `AutoEventFetcher.pingTime = 150`
- `src/renderer/serialport/serialport.ts:26-53, 195-235` — the six-entry VID/PID filter and the framing loop
- `src/renderer/serialport/serial-transport.ts` — open at 2 000 000 baud, close/`releaseLock` ordering, read loop
- `src/electron/main.ts:568-590` — `select-serial-port` auto-picking `portList[0]`; Grid Editor desktop uses Chromium Web Serial
- `configuration.json` — the literal VID/PID values including the three bootloader pairs
- `node_modules/@intechstudio/grid-protocol/` — GPLv3 `LICENSE`; `dist/index.js:2` WASM import; `dist/index.js:4457-4480` `compressScript` / `checkSyntax`; `dist/lua-formatter.d.ts` *"preserving comments"* and the init requirement

**User's ZONA engineering notes — `project_zona_module_config.md` (HIGH confidence for hardware-confirmed items, flagged where inferred)**
- The `PadPartialWriteError` incident on real hardware; the LED-preview 3.3 Hz measurement; the `ledIndexToCell` committed bug and the test that pinned it; the `awaitEventLoaded` FATAL; the plain-object rejection normalisation; the stamp-graft known leak; the 908/comments trap; `sendToGrid` vs `isValid`; the serpentine resolution; the 2026-08-27 LED-probe orientation confirmations; the Traps and Hard-facts sections

**Chromium / Web Serial (HIGH unless noted)**
- `services/device/serial/serial_io_handler.cc` — `FLAG_WIN_EXCLUSIVE_READ | FLAG_WIN_EXCLUSIVE_WRITE`
- `services/device/serial/serial_io_handler_posix.cc` — `ioctl(fd, TIOCEXCL)` and the comment explaining why
- `third_party/blink/renderer/modules/serial/serial_port.cc` — exact message strings including `"Failed to open serial port."`, `"The port is already open."`, `"The device has been lost."`
- [MDN — SerialPort.open()](https://developer.mozilla.org/en-US/docs/Web/API/SerialPort/open) — `InvalidStateError` / `NetworkError`; `bufferSize` defaults to 255; secure-context requirement
- [MDN — Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) — secure context, Permissions-Policy `serial`, `connect`/`disconnect` on `navigator.serial`
- [MDN — Serial.getPorts()](https://developer.mozilla.org/en-US/docs/Web/API/Serial/getPorts) — what `getPorts()` returns
- [Chrome for Developers — Read from and write to a serial port](https://developer.chrome.com/docs/capabilities/serial) — user-gesture requirement, `connect`/`disconnect` since Chrome 89, `reader.cancel()` → `releaseLock()` → `close()` ordering, `port.readable` becomes `null` on unplug
- [Chromium issue 40603963 — Serial port permissions storage and UI](https://issues.chromium.org/issues/40603963) — **MEDIUM/conflicting**: the original text says only ephemeral permissions are supported; later material describes persistence for USB serial devices. Not settled here
- [Chrome Help — Connect a website to a USB, Serial, or HID device](https://support.google.com/chrome/answer/12576972) — `chrome://settings/content/serialPorts`
- [Chrome for Developers — Heavy throttling of chained JS timers in Chrome 88](https://developer.chrome.com/blog/timer-throttling-in-chrome-88) — 1 Hz background throttling; 1/min intensive throttling conditions
- [WICG Serial spec](https://wicg.github.io/serial/) — bfcache discussion
- [MDN — CSP script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src) and [WebAssembly/content-security-policy#7](https://github.com/WebAssembly/content-security-policy/issues/7) — `'wasm-unsafe-eval'` required since Chrome 97
- [flash.pingequa.com — "Failed to open serial port" troubleshooting](https://flash.pingequa.com/troubleshooting/failed-to-open-serial-port) and [esphome/issues#4525](https://github.com/esphome/issues/issues/4525) — **MEDIUM**, community corroboration that another program owning the port is the dominant cause of this exact error

**GPLv3 and web JavaScript (MEDIUM — reasoned from the licence text plus community practice, not legal advice)**
- [Drupal core issue #1649654 — Non-trivial JavaScript files need GPL license declaration for compliant distribution to browsers](https://www.drupal.org/project/drupal/issues/1649654)
- [Drupal core issue #3321761 — Aggregated or minified GPL'd assets must document a source for the original file](https://www.drupal.org/project/drupal/issues/3321761)

---

## Explicitly Unverified — flag for a later pass

1. **Whether Chrome persists serial-port grants across browser restarts, under what conditions, and since which version.** Sources conflict. HANGAR's design is deliberately insensitive to the answer (C10), so this is a UX-polish question, not a blocker.
2. **Whether ZONA exposes a distinguishing USB serial-number string descriptor.** No descriptor definition found in `grid-fw`'s ESP32-S3 tree; it appears to use ESP-IDF/TinyUSB defaults. Affects whether Chrome can tell two ZONAs apart and whether a grant can persist. Settle with `lsusb -v` / Device Manager on real hardware.
3. **Flash endurance of ZONA's SPI NOR part.** Mechanism verified (LittleFS, per-event files, changed-flag gating); the rated cycle count was not looked up. Irrelevant if "never auto-store" holds.
4. **The exact `LUA_FLOORN2I` build setting.** The macro is present in the vendored Lua 5.5.0; that it is set to `F2Ieq` (the "fractional silently becomes 0" behaviour) comes from the user's notes, not from a build-flag read this session.
5. **Behaviour of a config write while a finger is held on the pad.** Reasoned from the VM-restart semantics; it is on the prior art's open hardware checklist and should stay there.
6. **`self:glc`/`self:glp` no-op, `glp(n, layer, -1)` erroring, and the Mode-block Setup abort.** Taken from the user's notes; not re-verified against firmware this session. High prior credibility (they were found the hard way), but cite them as notes-sourced, not firmware-sourced.
7. **Whether a page with an open serial port is bfcache-eligible in current Chrome.** The WICG discussion contemplates blocklisting; I did not confirm the shipped behaviour. HANGAR should assume it is not cached and rebuild state on `pageshow`.

---
*Pitfalls research for: public static site writing configs to USB hardware over Web Serial, with a firmware-faithful 9x9 LED simulator*
*Researched: 2026-09-02*
