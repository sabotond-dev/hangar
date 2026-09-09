# The flake was two bugs, and the second one is a product defect

Diagnosed 2026-09-09 after a Playwright flake recurred across two execution
waves. Recorded here rather than fixed in place, because one half belongs to a
plan and the other half is a real gap in shipped behaviour.

**The comfortable wrong answer was "it's just parallelism."** It is not. The two
failures do not share a root, and treating them as one family is what kept both
alive for two waves.

---

## Failure 1 — `session.e2e.ts:770` — a harness ordering bug

**The assertion is taken before the thing it counts has happened.**

`session.svelte.ts:753` sets `phase = "connected"` — which is what the probe page
renders and what the test waits on — and only *then* fires the connection event.
`install.svelte.ts:436` receives it and calls `void this.#attach(...)`,
fire-and-forget by design. `#attach` → `#snapshot` issues one
`SERIALNUMBER/FETCH` and then `fetchBoth`, which `sequence.ts:234-241` runs
**strictly sequentially**: the timer fetch is not issued until the setup fetch
has been answered.

So `phase === "connected"` in the DOM means **three protocol round trips are
about to start**, not that they finished. `onlyReads` then asserts exact totals
with no polling at all. The observed failure — *expected 4, received 3* — is
exactly the middle of `fetchBoth` on the second connect.

Each round trip here is a full page→Node CDP hop. The test spends about four of
them between `connected` and its assertion; the product spends three. Under
`--workers 3` on a loaded machine those two numbers cross.

**This is a harness bug, not a product one.** Every await in `#snapshot` is
correctly generation-guarded and the abort path is covered. What is wrong is that
the test asserts a *completion* condition using a signal that does not imply it.
**It reproduces at `--workers=1` too — just rarely enough that nobody has seen
it.**

### The fix

Wait on the completion signal before reading the safety counters, in that order,
so a late write is still caught:

```ts
await expect.poll(() => zona.seen("CONFIG", "FETCH")).toBe(2 * connects);
await expect.poll(() => zona.seen("SERIALNUMBER", "FETCH")).toBe(connects);
// only now are the must-be-zero counts meaningful
expect(zona.seen("CONFIG", "EXECUTE"), "config writes").toBe(0);
```

The timer fetch is the last thing `#snapshot` issues, so reaching `2 * connects`
*is* "the snapshot is done". Better still: expose `install.phase` on
`/dev/session/` the way `/dev/install/` already does, and wait on the store
leaving `snapshotting` — that makes the assertion **causal rather than
timing-based**, and it also retires the vacuous pair described below.

---

## Failure 2 — `browse-webkit.e2e.ts:202` — an amplifier hiding a product gap

### Ruled out by reading the tree, not by guessing

Every `getContext` in `src/` and `e2e/` is `"2d"` — no second context type. No
`transferControlToOffscreen` anywhere, which is the one documented cause of
`InvalidStateError` from `getContext`. The zero-width window in
`SimHost.unregister`/`destroy` is not observable, because the sampler checks
`canvas.width !== 9` inside the same synchronous `page.evaluate`.

**No code path in this repository produces that throw.** It is the engine
declining to return a rendering context for a canvas that is in the document at
9×9 — the WebKit backing-store path, and it correlates with load. `/browse/`
mounts **27** canvases, each a compositor layer scaled up by
`image-rendering: pixelated`, and three such pages live at once under
`--workers 3`.

`.planning/research/PITFALLS.md:465` predicted exactly this and was never acted
on: *"…dozens of `<canvas>` elements each with a backing store are megabytes…
also release the backing store for long-offscreen cards."*

### The amplifier, which is certain

**`expect.poll` does not retry a callback that throws.** Playwright evaluates the
callback *outside* its try block; only a matcher failure continues polling. So
one transient exception anywhere in a 30-second budget kills the test outright,
and the 30 seconds are illusory against the failure mode most likely to occur.

**There are eleven `expect.poll` sites over `page.evaluate` in `e2e/` and every
one has this hole.** `litCells` also has no `try`, so the raw error escapes with
no attribution — which is why two waves of summaries could only describe the
flake's shape.

### The product gap — this is the part that matters

- `BrowseGrid.svelte:242` — `if (started.has(id)) return;` — a card's engine is
  built and registered **exactly once, ever**.
- `host.ts:266` — `register()` takes the 2D context **once** and caches it.
- `host.ts:559` — `paint()` returns silently when `entry.ctx` is undefined, and
  otherwise writes through the cached context forever.
- **There is no `contextlost`, `contextrestored` or `isContextLost` handler
  anywhere in `src/`.**

So if WebKit drops a pad's backing store — which is what it does on a
memory-constrained iOS device with 27 live canvas layers — **HANGAR never
notices and never recovers.** The `started` set forbids a rebuild, `register()`
is never called again, and `paint()` keeps drawing into a dead context.

The visitor gets permanently black pads **on the one screen that is the entire
product for them**: iOS can never install (DEGR-01), so the shelf is all they
get.

The e2e failure is the desktop, load-induced echo of that.

### The fix, in two separate parts that must not be conflated

1. **Diagnostic, first, about four lines.** Wrap `litCells`'s body in
   `try`/`catch` returning `null` and put the engine's own error name into the
   failure message. The test still goes red — but at an attributable assertion
   instead of an unattributable stack. One run then settles whether this really
   is backing-store loss.
2. **Product.** Give `SimHost` a per-canvas `contextlost` listener that clears
   `entry.ctx`, and a `contextrestored` path (or a `paint()` guard that retries
   `getContext`) that re-acquires and repaints from `entry.engine.frame`.
   `BrowseGrid`'s `started` set must not block it. `host.ts:342`'s `repaintAll()`
   already does the repaint half; what is missing is **noticing**.

---

## The wrong fixes, named so they can be refused

**`retries: 2`.** Touches neither mechanism. For failure 1 it turns a genuine
assertion-ordering defect into invisible noise and leaves it in all seven
`onlyReads` call sites. For failure 2 it deletes the only signal this repository
has ever produced about WebKit canvas backing stores. **A retry turns the best
finding of this phase into a green tick.**

**`workers: 1`.** Does not fix failure 1 at all — the window exists at any worker
count; single-worker just makes the coin land the same way most days, which is
worse than a visible flake because it looks settled. And it suppresses failure 2
by removing the load that surfaces it, on a machine that is not the one iOS
visitors have.

**A `waitForTimeout` before `onlyReads`.** Same class as retries, tuned to
today's machine. `first-experience.e2e.ts:245` already says it in this
repository's own words: *"waitForTimeout is a flake generator on a busy
machine"*.

**Catching the throw in `litCells` and calling it done.** Correct as a
diagnostic, wrong as a fix. It improves the message and changes nothing about
the product having no recovery.

---

## Two hazards found on the way

**`artifacts.e2e.ts:19` runs `git rev-parse HEAD` at module load in each worker**
and asserts `build/source-<sha>.tar.gz` exists. **Committing while the suite runs
turns it red for a reason unrelated to the code.** Combined with
`reuseExistingServer: !process.env.CI`, a stale server from an earlier run is
reused and `npm run build` never re-runs — so the whole suite can silently test a
stale `build/`. That is the Phase 10 EPERM trap by another route.

**`session.e2e.ts:684-686` passes while measuring nothing**, and it is the same
race already noticed and papered over:

```ts
expect(shown).toBeGreaterThanOrEqual(0);
expect(shown).toBeLessThanOrEqual(await writes(page));
```

The first line is vacuous over a count. The second asserts `0 ≤ shown ≤ 3`. It
would pass with the readout wired to a constant zero — and it is *structurally*
guaranteed to measure nothing, because the probe re-reads the shim only when
`phase` or `identity` changes, and every write it is about happens after the last
such change. Somebody hit the race that fails at line 770, understood it, and
weakened the assertion instead of waiting for the event. **Line 770 is the same
defect where the value could not be weakened.**

**`browse.e2e.ts:669`** — `settled()` returns true at `built >= 4` of 27, so the
assertion may run against a grid that is 15% built. The floor should be named
against the listing length.
