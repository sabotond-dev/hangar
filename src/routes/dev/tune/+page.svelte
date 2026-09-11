<!--
  TUNE-04 / TUNE-05: the over-budget probe.

  FOUR THINGS ABOUT THIS PAGE.

  1. IT IS LINKED FROM NOWHERE. It is prerendered (prerender.entries: ["*"] in
     vite.config.ts) and it is the fourth unlinked probe, beside the walking
     skeleton's, the fidelity one and the catalog one. e2e/fidelity.e2e.ts
     already asserts site-wide that the count of a[href*="/dev/"] on / is zero,
     so this route is covered by that assertion and needs no duplicate of its
     own.

     THE THREE SIBLING ROUTES ARE DESCRIBED RATHER THAN SPELLED. src/lib/
     config-shape.spec.ts's probe-route test reads every file under
     src/routes/ outside each probe's own directory and fails on any
     occurrence of a probe's path - comments included, because it is a plain
     substring scan and the property it guards ("a route nothing references
     cannot be reached by a visitor who did not type it") is worth more than
     the convenience of naming it here. It used to name the skeleton's
     directory alone; since Phase 6 (plan 06-05) it discovers every directory
     under the dev routes, so this page's siblings are all under it.
     OBSERVED: naming the skeleton's turned that test red in 05-12, and this
     page's own mention of the fidelity one turned it red in 06-05. This is
     TuningRegion.svelte's setInterval lesson again, answered the way
     e2e/tuning.e2e.ts answered it - by not writing the token.

  2. IT EXISTS BECAUSE OVER BUDGET IS UNREACHABLE IN THE SHIPPED UI, AND A
     GUARD NOBODY HAS WATCHED WORK IS A HOPE.
     src/lib/tune/reachability.sweep.spec.ts measures every knob state of every
     shelf card - 32,852 of them - and not one crosses 908. So the red meter,
     the disabled primary control, the named knob and the one-click back-off
     that TUNE-04 and TUNE-05 specify can never be seen by a visitor, and
     without this page they could never be seen by a browser either. Everything
     else about them is proven in node by src/lib/tune/ladder.spec.ts.

  3. THE OVER-BUDGET STATE IS PRODUCED BY A REAL `PadReserved`, NEVER BY A FAKE
     COST. `reserved` is charged by the vendored `cost()` itself, and
     `validate()` writes its own sentence about it - so what this page shows is
     a budget the compiler really refused, not a number injected into a view.
     It is the same mechanism Phase 7's install marker will use: the marker is
     characters the visitor's configuration does not get to spend, and that is
     exactly what a reserve is. No test-only prop exists anywhere in the tuning
     region for this, and none was added.

  4. `tpad` WAS CHOSEN BECAUSE IT IS THE TIGHTEST REAL BUDGET IN THE TREE AND IS
     NOT IN THE FRONT-DOOR ROW. It ships at Setup 902/908 and its whole
     reachable knob cross-product - 512 states - spans Setup 902 to 907, so a
     small reserve straddles 908 instead of drowning it. And because
     EXCLUDED_FROM_ROW carries it (it writes no LEDs, so it is a black square),
     there is no /playground/tpad/ page: mounting the region for it needs a probe, which
     is precisely why the probe can mount it without touching the front door.

     SINCE PLAN 12-10 IT IS NOT A CATALOG CARD AT ALL. The hand-authored
     TRACKPAD (`trackpad`) replaced it under the user's answer "selectable
     tuning options under Trackpad"; the preset stays on HANGAR's shelf as the
     compiler's over-budget fixture, and this page reaches it through
     `portedEntry` rather than `byId`. Every number below is unchanged,
     because the preset is.

  THE RESERVE, MEASURED. Every number below was measured on this tree with the
  pinned compiler, through $lib/pad, and is recorded in 05-12-SUMMARY.md:

      tpad at its defaults                       Setup 902 / 908
      the 512-state cross-product                Setup 902 .. 907
      Scroll at tap/pointer defaults    index 0..3 -> 904, 4 -> 902, 5 -> 906,
                                                 6..7 -> 907

  With RESERVE = 3 on Setup the band straddles the budget, which is what the
  page needs and what a bigger reserve would destroy:

      Scroll 0..3   907 / 908   in budget, 1 to spare
      Scroll 4      905 / 908   in budget (the card as published)
      Scroll 5      909 / 908   over by 1
      Scroll 6, 7   910 / 908   over by 2

  05-04 measured tpad + { setup: 20 } for the over-budget block and that reserve
  is still right for a unit test, but it puts EVERY knob state over 908 - so the
  knob branch, the back-off and the way back inside would all be unreachable
  from a page using it. This page needs both sides of the line, so it takes the
  smallest reserve that gives it both.

  THE OPENING POSITION IS OVER BUDGET, deliberately: Scroll at its last index,
  910/908. That is the ARRIVED branch - no knob has moved, so the block says the
  configuration started over rather than naming a culprit, and there is no
  back-off to offer, because tpad's only sheet is `sends` and the compiler
  refuses to shed sends (fit() returns no steps at any reserve). An empty
  back-off renders no control at all, which is the honest answer and the one
  corner of the over-budget block that has no button in it. Moving Scroll down
  and back up reaches the KNOB branch, which does have one.

  THE READOUT IS A SECOND OPINION, NOT A MIRROR. `probe-cost` recomputes the
  cost from the knob indices the region reports, through $lib/pad and the same
  `compilerKnobs` rack the model resolves - so a test can hold the numerals the
  region renders against the compiler's own answer instead of against a literal.
  Both branches write into the SAME element rather than throwing, exactly as
  the fidelity probe's page does, so a broken run produces a readable assertion
  diff instead of a Playwright timeout carrying no information.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { portedEntry } from "$lib/catalog";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import TryOnDevice from "$lib/ui/TryOnDevice.svelte";
  import TuningRegion from "$lib/ui/TuningRegion.svelte";

  const ENTRY_ID = "tpad";

  /** Measured. See the header for the whole table and for why it is this small. */
  const RESERVE = { setup: 3, timer: 0 };

  /** Scroll's last index: 907 + 3 = 910/908, and nobody moved it. */
  const OPENING_KNOBS: Readonly<Record<string, number>> = { scroll: 7 };

  const entry = portedEntry(ENTRY_ID);

  /**
   * The shape TryOnDevice takes. It is built here rather than looked up in
   * FRONT_DOOR because tpad is deliberately not in that row - which is the
   * fourth reason this page exists. `motion` is the value front-door.spec.ts
   * derives for tpad from golden-frames.json: it lights nothing at any sampled
   * tick.
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
   * The second opinion.
   *
   * It resolves the rack through `compilerKnobs`, which is the same function
   * `model.ts` resolves its own rack through, and it reproduces that module's
   * one special case: at every default the state is `resetAll(entry)` - the
   * card AS PUBLISHED, shelf preset and all - which is a genuinely cheaper
   * string than the same indices applied one at a time. Getting that wrong
   * would make this readout disagree with the meters for a reason that is not
   * a defect, which is the whole risk of a second opinion.
   *
   * Every import is dynamic and inside the function: this page is a probe, and
   * the compile surface is behind a 628 KB WASM gate that nothing may await
   * before a first paint.
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
   * One measurement per reported knob position, latest wins. A generation
   * counter rather than an abort: `costOf` is two crossings of the WASM
   * boundary and cannot be cancelled, so the answer to a superseded question is
   * discarded instead of pretended away.
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

<TryOnDevice entry={shown} {budgetReason} />

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
