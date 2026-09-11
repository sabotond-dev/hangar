<!--
  MIX TWO: two candidates, four results, one button (TUNE-04, 10-UI-SPEC §11.6).

  Genetic exploration exists in synths and in no controller-configuration editor,
  and the state model on both routes here is already an index vector - so the
  whole idea is `child[k] = coin() ? a[k] : b[k]` plus one redrawn knob, and all
  of that lives in src/lib/tune/mix.ts where a property test can reach it. This
  file is the two slots, the four results, the take, and nothing else.

  NO GENETICS METAPHOR REACHES THE INTERFACE (A-15). Not "breed", not "parent",
  not "mutate", not "DNA", and not "child" as a word anybody reads - the four
  strings this component renders are MIX TWO, its line, THIS ONE and THAT ONE,
  every one of them a constant in src/lib/tune/copy.ts, and copy.spec.ts scans
  every string that module can produce for the whole vocabulary by stem.
  `mix-child-0` is a test id and `child` is an identifier; both are code, and
  the scan reads rendered strings rather than code, which is the distinction
  that lets the algorithm keep its own honest name.

  THE PARENTS ARE TEXT AND THE RESULTS ARE PADS, AND THAT IS THE CANVAS BUDGET
  RATHER THAN A STYLE. §11.6 costs this component at FOUR PadCanvas instances
  beside the hero and the picker's one result: six on the worst entry in the
  catalog, which is inside the front door's seven. Two more canvases for the two
  candidates would be eight and would spend on repetition - THIS ONE is already
  running as the hero, six centimetres up the same panel. So each slot lists its
  settings as words, which is also the only form in which a difference between
  two configurations can be read at a glance.

  NOTHING IS SENT TO THE ZONA, and the line says so because this is exactly
  where a visitor would wonder: four new configurations appearing beside
  TRY ON DEVICE. `mixIndices` composes index vectors. There is no port here, no
  writer, no `install`, and taking a result calls one callback that moves the
  panel's own state.

  NON-DESTRUCTIVE. The configuration on the screen survives until a result is
  clicked: `ontake` has exactly ONE call site in this file, inside `take`.
  Rolling again, or clearing the results, changes nothing at all - so there is
  nothing to restore, which is why there is no "undo" here and no snapshot.
  Taking one makes it the state and moves the previous state into THAT ONE, so
  the next mix has a second candidate without any bookkeeping a visitor can see.

  RANDOMNESS IS INJECTED. `rng` is a required prop with no default and
  `Math.random` appears nowhere under src/lib/ui/ - the plan greps for it - so
  what a visitor sees is what a seeded test sees.

  HELD KNOBS ARE NEVER CROSSED AND NEVER MUTATED (T1, §11.5). The set arrives
  from the region, which owns it, and goes straight to `mixIndices`.

  NO TEAR ON THIS SURFACE (§8.4). The tune panel is a Product surface and the
  reroll firing is retired by name: a `clip-path` on a block that renders its
  own words would translate and clip them. The results arrive on 160 ms
  `ease-out`, OPACITY ONLY, no transform, and `aesthetic.spec.ts` scan 1 asserts
  that this file is not an allowlisted CRT file and names none of the CRT
  vocabulary.

  THE INSTRUMENT REGISTER (D-15 / A-41). MIX TWO is Secondary tier, so it is a
  pill OUTLINE - fully rounded, 1px, transparent fill, 24px inline padding. That
  is the whole of the register's reach into this file: nothing else here is
  pilled, nothing is filled, no accent is declared (the focus ring is app.css's
  and belongs to every control on the site) and no `--font-mono` is spent -
  A-44's seventh use is reserved for §19.1c's metadata block and this component
  displays no number that moves under a pointer.

  WHAT IS NOT WIRED YET, AND IT IS THE SAME LAST HOP THE PICKER'S RESULT PAD IS
  WAITING ON. The results render their live 9x9 minis only when a consumer
  supplies `onchild`, because the one thing on the page that owns a `SimHost` is
  Coverflow.svelte, which this phase promises not to edit. An unregistered
  canvas has no backing store and paints nothing, and four empty boxes claiming
  to show four configurations would be worse than none. deferred-items.md
  carries the three lines that close it for both components at once.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import {
    MIX_LINE,
    MIX_THAT,
    MIX_THIS,
    MIX_TWO,
    SHARE_FALLBACK_FIELD_NAME,
    mixChildName,
    stampOlder,
    stampUnreadable,
  } from "$lib/tune/copy";
  import { mixIndices } from "$lib/tune/mix";
  import type { KnobView } from "$lib/tune/view";
  import PadCanvas from "./PadCanvas.svelte";

  let {
    entry,
    knobs,
    held,
    candidate,
    rng,
    ontake,
    onchild,
  }: {
    /** The configuration these results run. Structural, never a catalog import. */
    entry: { id: string; name: string };
    /** The rack as it stands. Its indices ARE `THIS ONE`. */
    knobs: readonly KnobView[];
    /** The ids a lock protects. Never crossed, never redrawn. */
    held: ReadonlySet<string>;
    /**
     * `THAT ONE` as the region supplies it: the last `SURPRISE ME` roll.
     *
     * A link pasted into the slot below, and the state a taken result
     * replaced, both override it - see `that`, where the precedence is
     * written out.
     */
    candidate?: Readonly<Record<string, number>>;
    /**
     * The randomness, INJECTED. No default on purpose: a component that
     * reached for `Math.random` would make its own behaviour untestable, and
     * `mixIndices` refuses a default for the same reason.
     */
    rng: () => number;
    /** One result was taken. The only thing in this file that changes anything. */
    ontake: (indices: Record<string, number>) => void;
    /** Hands a result's canvas to whoever owns the page's SimHost. */
    onchild?: (id: string, canvas: HTMLCanvasElement) => void;
  } = $props();

  /** A pasted link that decoded under THIS entry. */
  let pasted = $state<Record<string, number> | undefined>(undefined);
  /** The state a taken result replaced. It becomes the next mix's second candidate. */
  let previous = $state<Record<string, number> | undefined>(undefined);
  /** The four results, or none. Empty until MIX TWO is pressed. */
  let results = $state<Record<string, number>[]>([]);
  /** What the link field is holding, and the refusal if it did not decode. */
  let link = $state("");
  let refusal = $state<string | undefined>(undefined);

  /**
   * The second candidate, and the precedence is the order a visitor produced
   * them in: the state a take replaced is the freshest, then a pasted link,
   * then whatever the region last rolled.
   */
  const that = $derived(previous ?? pasted ?? candidate);

  /** THIS ONE: the rack's own indices, read fresh so a knob turn moves it. */
  const mine = $derived(
    Object.fromEntries(knobs.map((knob) => [knob.id, knob.index])),
  );

  const ready = $derived(knobs.length > 0 && that !== undefined);

  // Derived rather than captured: the panel re-fills with a different entry
  // on a coverflow step without this component being torn down (W-20).
  const mixId = $derived(`mix-two-${entry.id}`);
  const linkId = $derived(`mix-link-${entry.id}`);
  const resultId = (at: number) => `${entry.id}-mix-${at}`;

  /** One knob's value as the rack words it, or nothing if the index is unread. */
  const valueOf = (knob: KnobView, at: number | undefined) =>
    at === undefined ? undefined : knob.values[at]?.label;

  /** A candidate's settings as words. The slots carry no canvas; see the header. */
  function settingsOf(
    indices: Readonly<Record<string, number>> | undefined,
  ): string {
    if (indices === undefined) return "";
    return knobs
      .map((knob) => `${knob.label} ${valueOf(knob, indices[knob.id]) ?? ""}`)
      .join(" · ");
  }

  /**
   * A result's accessible name: what taking it would change, and nothing else.
   *
   * Four pictures of 81 lights have no text of their own, so this IS what a
   * screen reader gets. `mixChildName` writes the sentence; this composes the
   * changes from the knobs whose position differs from the rack's.
   */
  function nameOf(result: Readonly<Record<string, number>>): string {
    const changes = knobs
      .filter((knob) => result[knob.id] !== knob.index)
      .map((knob) => `${knob.label} ${valueOf(knob, result[knob.id]) ?? ""}`);
    return mixChildName(changes);
  }

  /**
   * The rack as `mixIndices` needs it. Built on the click rather than derived,
   * because a lattice colour knob carries 4,096 positions and only their COUNT
   * is ever read - by the coin, and by `surpriseIndices`'s one draw.
   */
  const rackOf = () =>
    knobs.map((knob) => ({
      id: knob.id,
      label: knob.label,
      kind: knob.kind,
      options: knob.values.map((value) => value.label),
      default: knob.default,
    }));

  function roll(): void {
    const theirs = that;
    if (theirs === undefined || knobs.length === 0) return;
    results = mixIndices(mine, theirs, held, rackOf(), rng);
  }

  /**
   * Take one. The ONLY thing in this file that changes the configuration, and
   * the previous state becomes the second candidate on the way past.
   */
  function take(result: Record<string, number>): void {
    previous = { ...mine };
    results = [];
    ontake(result);
  }

  /**
   * A pasted link, read by THE STAMP MACHINERY THAT ALREADY EXISTS.
   *
   * `parseHash` and `decodeFor` are Phase 5's, imported lazily because
   * `stamp.ts` reaches the vendored compiler and D-18 keeps that off the front
   * door's first paint. There is no second decoder here and no second format
   * table: a stamp this entry's knobs cannot reproduce comes back `unreadable`
   * from the same guard a landing goes through, and it is refused with the
   * landing vocabulary rather than with a new sentence.
   */
  async function readLink(): Promise<void> {
    const text = link.trim();
    refusal = undefined;
    if (text === "") return;

    const { parseHash, decodeFor } = await import("$lib/share/stamp");
    const { byId } = await import("$lib/catalog");
    const source = byId(entry.id);
    const hash = text.indexOf("#");
    const payload = hash < 0 ? undefined : parseHash(text.slice(hash));

    if (source === undefined || payload === undefined) {
      refusal = stampUnreadable(entry.name);
      return;
    }
    const landing = decodeFor(source, payload);
    if (landing.kind === "restored") {
      pasted = landing.indices;
      return;
    }
    refusal =
      landing.kind === "older"
        ? stampOlder(entry.name)
        : stampUnreadable(entry.name);
  }
</script>

<section class="mix" data-testid="mix-two">
  <div class="head">
    <button
      class="mix-two pill"
      type="button"
      id={mixId}
      data-testid="mix-roll"
      disabled={!ready}
      onclick={roll}
    >
      {MIX_TWO}
    </button>
  </div>

  <p class="line">{MIX_LINE}</p>

  <div class="candidates">
    <div class="slot" data-testid="mix-this">
      <span class="caption">{MIX_THIS}</span>
      <span class="settings">{settingsOf(mine)}</span>
    </div>

    <div class="slot" data-testid="mix-that">
      <span class="caption">{MIX_THAT}</span>
      {#if that}
        <span class="settings">{settingsOf(that)}</span>
      {:else}
        <label class="sr-only" for={linkId}>{SHARE_FALLBACK_FIELD_NAME}</label>
        <input
          class="link"
          id={linkId}
          type="text"
          data-testid="mix-link"
          bind:value={link}
          onchange={() => void readLink()}
        />
      {/if}
      {#if refusal}
        <span class="refusal" data-testid="mix-refusal">{refusal}</span>
      {/if}
    </div>
  </div>

  {#if results.length > 0}
    <!--
      The group is labelled BY THE CONTROL THAT PRODUCED IT rather than by a
      sentence of its own: §13.4 gives this component four strings and a group
      label would be a fifth, saying what the button above it already says.
    -->
    <div
      class="results"
      data-testid="mix-results"
      role="group"
      aria-labelledby={mixId}
    >
      {#each results as result, at (at)}
        <button
          class="child"
          type="button"
          data-testid="mix-child-{at}"
          aria-label={nameOf(result)}
          onclick={() => take(result)}
        >
          {#if onchild}
            <PadCanvas
              entry={{ id: resultId(at), name: entry.name }}
              onready={onchild}
            />
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</section>

<style>
  .mix {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .head {
    display: flex;
    align-items: center;
    min-block-size: 44px;
  }

  /*
    SECONDARY TIER, AND THE PILL IS ITS SHAPE (§10.3 as amended by A-41).
    Fully rounded, 1px --color-boundary, transparent fill, 24px inline padding -
    at the 44px block floor the radius resolves to 22px per end, so 24px clears
    the curve by 2px. Bordered, NEVER filled: a filled pill here is Primary's,
    and there is one Primary control per panel and it is TRY ON DEVICE.

    10-13.1 MOVED THOSE FOUR DECLARATIONS TO src/app.css's .pill AND LEFT THE
    ARGUMENT HERE. This file authored the shape first, in 10-11, and by the time
    ten more controls wanted it there were eleven copies of it across nine
    files. The class on the button above is what applies it now; what stays in
    this rule is the 44px floor, which is this control's own and is read off
    this rule by tune-ui.spec.ts.
  */
  .mix-two {
    min-inline-size: 44px;
    min-block-size: 44px;
    color: var(--color-ink);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
    transition: border-color 140ms ease-out;
  }

  .mix-two:hover:not(:disabled) {
    border-color: var(--color-ink-quiet);
  }

  /* 13-03: the disabled border is --color-boundary, not the divider - the
     divider fails 3:1 and identity.spec.ts test 5 forbids it on a control. The
     softened-border channel this state used to carry is gone; its label is
     already the quiet rung. This component was never mounted and 13-10
     deletes it (D-12). */
  .mix-two:disabled {
    color: var(--color-ink-quiet);
    border-color: var(--color-boundary);
    cursor: default;
  }

  /* Body, quiet: one sentence, and its second half is the load-bearing one. */
  .line {
    margin: 0;
    font-size: 16px;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /*
    Two slots that WRAP rather than scroll (D-11). `min-inline-size: 0` on the
    cell is what lets a long settings line shrink instead of pushing the row
    wider than the panel.
  */
  .candidates {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .slot {
    display: flex;
    flex: 1 1 140px;
    flex-direction: column;
    gap: 4px;
    min-inline-size: 0;
  }

  /* Micro: 12px / 600 / 1.2 / 0.18em, uppercase, quiet. The rack's own. */
  .caption {
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
  }

  .settings,
  .refusal {
    font-size: 12px;
    line-height: 1.4;
    color: var(--color-ink-quiet);
    overflow-wrap: anywhere;
  }

  .link {
    min-inline-size: 44px;
    min-block-size: 44px;
    inline-size: 100%;
    padding-inline: 8px;
    border: 1px solid var(--color-boundary);
    border-radius: 6px;
    background: transparent;
    color: var(--color-ink);
    font-size: 12px;
  }

  /* A WRAPPING ROW, never a scrolling one. Four results at any width. */
  .results {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  /*
    A result is a real button whose whole content is a picture of 81 lights.
    44px on BOTH axes is Phase 4's floor and 64px is what makes a 9x9 legible;
    the floors are declared anyway, because the walk that checks them reads
    declarations rather than resolved boxes.

    THE ARRIVAL IS OPACITY AND NOTHING ELSE (§14, and §8.4's retirement of the
    reroll firing). 160 ms, ease-out, no transform: a transform here would be
    the tear by another name, on a Product surface that renders its own words.
  */
  .child {
    inline-size: 64px;
    block-size: 64px;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding: 0;
    /* 13-03: a button is bounded by --color-boundary (identity.spec.ts test 5);
       the hover below therefore no longer lifts the border. 13-10 deletes this
       file (D-12). */
    border: 1px solid var(--color-boundary);
    border-radius: 2px;
    background: transparent;
    cursor: pointer;
    animation: mix-arrive 160ms ease-out;
  }

  .child:hover {
    border-color: var(--color-boundary);
  }

  @keyframes mix-arrive {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .child {
      animation: none;
    }
  }
</style>
