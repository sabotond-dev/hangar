<!--
  The tune probe (TUNE-04 / TUNE-05): over budget is unreachable in the shipped UI
  (reachability.sweep.spec.ts: not one of the 32,852 knob states crosses 908), so this page mounts the
  tuning region for `tpad` - the tightest real budget in the tree, Setup 902/908, not a catalog card
  since 12-10 and reached through `portedEntry` - with a real `PadReserved` charged by the vendored
  `cost()` itself, never a fake cost: RESERVE 3 on Setup straddles 908 across Scroll's indices.
  Linked from nowhere, prerendered; its siblings are described, not spelled (config-shape.spec.ts's
  probe scan reads comments; naming one turned it red in 05-12 and 06-05). The opening position is
  over budget with no knob moved (the ARRIVED branch: no back-off, since tpad's only sheet is `sends`);
  moving Scroll down and back reaches the KNOB branch. `probe-cost` is a second opinion through $lib/pad
  and the same `compilerKnobs` rack; both branches write into the same element rather than throwing.
  Decided at 05-12 / 12-10 / 13.1-06; see .planning/phases/05-tuning-budgets-and-shareable-links/05-12-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { portedEntry } from "$lib/catalog";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import DestinationZone from "$lib/ui/DestinationZone.svelte";
  import TuningRegion from "$lib/ui/TuningRegion.svelte";

  const ENTRY_ID = "tpad";

  /**
   * Measured on this tree with the pinned compiler through $lib/pad (05-12-SUMMARY.md): tpad at its
   * defaults Setup 902 / 908; the 512-state cross-product 902 .. 907; Scroll index 0..3 -> 904, 4 ->
   * 902, 5 -> 906, 6..7 -> 907. With 3 on Setup: Scroll 0..3 907 (in budget), 4 905, 5 909 (over by
   * 1), 6 and 7 910 (over by 2). 05-04's { setup: 20 } puts every state over, so no way back inside.
   */
  const RESERVE = { setup: 3, timer: 0 };

  /** Scroll's last index: 907 + 3 = 910/908, and nobody moved it. */
  const OPENING_KNOBS: Readonly<Record<string, number>> = { scroll: 7 };

  const entry = portedEntry(ENTRY_ID);

  /**
   * The entry's shape as the front door carries one, built here because tpad is not in that row. Since
   * 13.1-06 only its name is read: the disabled control over budget is the context bar's Store on ZONA
   * (DestinationZone.svelte), which takes the name, the pair (none here - this probe never writes) and
   * the refusal. `motion` is the value front-door.spec.ts derives for tpad: it lights nothing.
   */
  const shown: FrontDoorEntry = {
    id: ENTRY_ID,
    name: entry?.name ?? ENTRY_ID,
    description: entry?.description ?? "",
    motion: "dark",
  };

  let budgetReason: string | undefined = $state(undefined);
  let indices: Readonly<Record<string, number>> = $state(OPENING_KNOBS);
  let stamp: string | undefined = $state(undefined);
  let previews = $state(0);
  let cost = $state("pending");

  /**
   * The second opinion: the rack through `compilerKnobs` (model.ts's own), with that module's one special
   * case reproduced - at every default the state is `resetAll(entry)`, the card as published, a
   * genuinely cheaper string than the same indices applied one at a time. Every import is dynamic and
   * inside the function: the compile surface is behind a 628 KB WASM gate nothing awaits before a first paint.
   */
  async function measure(
    at: Readonly<Record<string, number>>,
  ): Promise<string> {
    try {
      const { compileState, costOf } = await import("$lib/pad");
      const { compilerKnobs } = await import("$lib/share/stamp");
      const { applyKnob, baseStateFor, resetAll } = await import(
        "$lib/tune/state"
      );
      if (!entry) return `error: no catalog entry ${ENTRY_ID}`;
      const knobs = compilerKnobs(entry);
      if (knobs.length === 0) return `error: ${ENTRY_ID} has no compiler knobs`;
      const indexOf = (id: string, fallback: number) => at[id] ?? fallback;
      let state;
      if (
        knobs.every((knob) => indexOf(knob.id, knob.default) === knob.default)
      ) {
        state = resetAll(entry);
      } else {
        state = baseStateFor(entry);
        for (const knob of knobs) {
          state = applyKnob(state, knob, indexOf(knob.id, knob.default));
        }
      }
      const measured = await costOf(await compileState(state), RESERVE);
      return JSON.stringify({
        entry: ENTRY_ID,
        reserve: RESERVE,
        knobs: knobs.map(
          (knob) => `${knob.id}=${indexOf(knob.id, knob.default)}`,
        ),
        setup: measured.setup.used,
        timer: measured.timer.used,
        fits: measured.fits,
      });
    } catch (error) {
      return `error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * One measurement per reported knob position, latest wins; a generation counter, not an abort, since
   * `costOf` cannot be cancelled - a superseded answer is discarded.
   */
  let generation = 0;
  $effect(() => {
    const at = indices;
    const mine = ++generation;
    void measure(at).then((next) => {
      if (mine === generation) cost = next;
    });
  });
</script>

<h1>Tuning probe</h1>

<p data-testid="probe-entry">{shown.id} | {shown.name}</p>
<p data-testid="probe-reserve">setup {RESERVE.setup} | timer {RESERVE.timer}</p>
<p data-testid="probe-cost">{cost}</p>
<p data-testid="probe-budget-reason">{budgetReason ?? "in budget"}</p>
<p data-testid="probe-stamp">{stamp ?? "none"}</p>
<p data-testid="probe-previews">{previews}</p>

<DestinationZone name={shown.name} refusal={budgetReason} />

<TuningRegion
  entryId={ENTRY_ID}
  name={shown.name}
  knobs={OPENING_KNOBS}
  reserved={RESERVE}
  onknobs={(next) => {
    indices = next;
  }}
  onpreview={() => {
    // The engine is deliberately not held: this page has no canvas and no
    // SimHost, and nothing that owns an engine belongs in a rune (model.ts).
    previews += 1;
  }}
  onstamp={(next) => {
    stamp = next;
  }}
  onbudget={(reason) => {
    budgetReason = reason;
  }}
/>
