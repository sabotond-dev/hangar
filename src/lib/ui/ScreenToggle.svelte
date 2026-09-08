<!--
  SCREEN - the CRT's visible off switch (10-UI-SPEC 8.6, D-07 confirmed).

  THE OS SETTING IS NOT ENOUGH, AND THE REASON IS NOT POLITENESS.
  `prefers-reduced-motion` is a MOTION preference, and two of the four CRT
  layers do not move: the page ground and the pad frames' scanlines are static
  textures whose cost is legibility and taste, not motion. A visitor with low
  vision, or on a weak machine, or who simply does not want the texture, has no
  operating-system setting that reaches them. So there is a control, it is on
  every route, and FLAT turns off all four layers rather than the two that move.

  ONE ATTRIBUTE, NOT A HUNT. This component's only effect on the page is
  `data-screen` on <html>. Every layer's presence and motion derives from that
  attribute and from the `--crt` property src/app.css sets from it. The
  reference implementation spread its motion across two components'
  pseudo-elements, which is exactly why its own reduced-motion block missed its
  own scanline sweep; a single attribute is what makes that mistake unavailable
  here.

  THE WORD ROW IS PHASE 5's, UNCHANGED IN MARKUP AND BEHAVIOUR. A
  role="radiogroup" over real <input type="radio"> inside <label>s: one tab
  stop, arrow keys that move AND select, all of it the browser's own radio
  behaviour rather than a keydown handler. The same widget carries SORT in
  BrowseToolbar.svelte and the three rails in the tune picker, and reusing the
  knob vocabulary for a page control is this site's established move.

  BOTH 44px AXES, AND THE INLINE ONE IS LOAD-BEARING HERE RATHER THAN FREE.
  FLAT is four characters at 12px with 0.18em of tracking - about 38 pixels -
  so without `min-inline-size: 44px` this control would ship the one word row
  on the site that fails the touch floor on the axis nobody checks.

  THE READ IS GUARDED, EXACTLY AS THE SNAPSHOT STORE IS. A browser configured
  to refuse storage can throw on the PROPERTY ACCESS and not only on use, so
  every touch of it sits inside a try of its own and every failure degrades to
  "no preference recorded". A missing courtesy may never be the reason a
  visitor has no page. Nothing here reads or writes `hangar.snapshot.v1`.

  ONE FRAME IS NOT COVERED, AND IT WAS OBSERVED RATHER THAN REASONED ABOUT.
  Every route is prerendered, and the static HTML carries no `data-screen`, so
  a visitor who chose FLAT sees a frame or two of texture on a COLD arrival
  before this module runs - src/app.css's `--crt: 1` default is what stands
  until then. e2e/aesthetic.e2e.ts caught it: a single read of the attribute
  straight after a reload came back null on webkit-phone and "flat" on
  chromium, purely on timing, which is why that assertion is a poll and says
  "once this page has hydrated". Closing the window entirely means a BLOCKING
  INLINE SCRIPT in src/app.html, which would put a second copy of the default
  rule (recorded choice, else reduced motion, else textured) in a file no test
  reads. That is a drift hazard this phase has spent three plans refusing to
  accept elsewhere, so the window is recorded rather than papered over.

  THE DEFAULT IS READ ONCE AND NEVER SUBSCRIBED TO. `prefers-reduced-motion`
  picks the default at first paint and nothing more: a live subscription would
  flip a visitor's own explicit choice out from under them the moment the
  operating system's setting changed. The LIVE half of that preference is
  entirely in CSS, where `@media (prefers-reduced-motion: reduce)` needs no
  JavaScript to stay current - see FrontDoor.svelte's Layers R and T.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script module lang="ts">
  /** One key, versioned in its name so a `.v2` can sit beside it. */
  export const SCREEN_KEY = "hangar.screen.v1";

  export type ScreenChoice = "textured" | "flat";

  /** DOM order, and therefore arrow-key order. TEXTURED is the default. */
  export const SCREEN_CHOICES: readonly ScreenChoice[] = ["textured", "flat"];

  const SCREEN_LABELS: Record<ScreenChoice, string> = {
    textured: "TEXTURED",
    flat: "FLAT",
  };

  /**
   * The store, or undefined. The property ACCESS is inside the try, not just
   * the call: 07-RESEARCH pitfall 9, and the same shape src/lib/device/
   * snapshot.ts uses.
   */
  function storage(): Storage | undefined {
    try {
      return typeof localStorage === "undefined" ? undefined : localStorage;
    } catch {
      return undefined;
    }
  }

  /** The recorded choice, or undefined for anything that is not one of the two. */
  function recorded(): ScreenChoice | undefined {
    const store = storage();
    if (store === undefined) return undefined;
    let raw: string | null;
    try {
      raw = store.getItem(SCREEN_KEY);
    } catch {
      return undefined;
    }
    return SCREEN_CHOICES.find((choice) => choice === raw);
  }

  /** Never throws. A full quota or a refusing store loses the preference and nothing else. */
  function remember(choice: ScreenChoice): void {
    const store = storage();
    if (store === undefined) return;
    try {
      store.setItem(SCREEN_KEY, choice);
    } catch {
      /* A preference that could not be written is still the live preference. */
    }
  }

  /** A ONE-SHOT read. See the header: this picks a default, it does not track one. */
  function asksForLessMotion(): boolean {
    if (typeof window === "undefined") return false;
    if (typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function firstChoice(): ScreenChoice {
    return recorded() ?? (asksForLessMotion() ? "flat" : "textured");
  }

  /** Write the one attribute the whole treatment derives from. */
  function apply(choice: ScreenChoice): void {
    if (typeof document === "undefined") return;
    // setAttribute rather than dataset.screen, and the difference is not style:
    // `dataset.screen` does not contain the string "data-screen" anywhere, so
    // the file that writes the switch would not NAME the switch, and
    // aesthetic.spec.ts scan 1's walk over src/ would not see it here.
    document.documentElement.setAttribute("data-screen", choice);
  }

  /**
   * The live choice, shared. FrontDoor.svelte reads it to decide whether Layer
   * R mounts at all, which CSS cannot do: 10-UI-SPEC 8.7's browser gate 2
   * requires the roll bar to be ABSENT FROM THE DOM under FLAT, not merely
   * hidden, and `display: none` would leave that assertion checking a
   * composited element that is still there.
   *
   * `const` and a property rather than an exported `let`: reassigning an
   * exported binding from another module is not something Svelte can track.
   */
  export const screen = $state<{ value: ScreenChoice }>({
    value: "textured",
  });

  /**
   * Settled at MODULE SCOPE rather than in onMount, and the difference is one
   * painted frame. +layout.svelte imports this file, so this runs before
   * hydration rather than after it, and a visitor who chose FLAT does not watch
   * the texture arrive and leave again. On the server both guards above return
   * early and the default stands, which is what the prerendered HTML carries -
   * and src/app.css keys its rules off `flat` alone for exactly that reason.
   */
  if (typeof document !== "undefined") {
    screen.value = firstChoice();
    apply(screen.value);
  }

  export function chooseScreen(choice: ScreenChoice): void {
    screen.value = choice;
    apply(choice);
    remember(choice);
  }
</script>

<script lang="ts">
  const CAPTION_ID = "screen-caption";
</script>

<div class="screen">
  <span class="caption" id={CAPTION_ID}>SCREEN</span>
  <div
    class="options"
    data-testid="screen-toggle"
    role="radiogroup"
    aria-labelledby={CAPTION_ID}
  >
    {#each SCREEN_CHOICES as option (option)}
      <label class="option" class:selected={option === screen.value}>
        <input
          class="sr-only"
          type="radio"
          name="screen"
          value={option}
          checked={option === screen.value}
          onchange={() => chooseScreen(option)}
        />
        <span class="word">{SCREEN_LABELS[option]}</span>
      </label>
    {/each}
  </div>
</div>

<style>
  /* The caption sits on the same line as its options in the footer row. */
  .screen {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Micro: 12px / 600 / 1.2 / 0.18em, uppercase, quiet. BrowseToolbar's. */
  .caption {
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
  }

  /* Phase 5's word row: wraps, never scrolls, 4px gaps, a 44px floor. */
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    min-block-size: 44px;
  }

  /*
    BOTH AXES. FLAT is about 38px wide at this size and tracking, so the inline
    floor is what this control would otherwise fail (10-UI-SPEC 8.6,
    device-ui.spec.ts:278-306).
  */
  .option {
    position: relative;
    display: grid;
    place-items: center;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 12px;
    border-radius: 6px;
    cursor: pointer;
  }

  /*
    The radio is visually hidden, so Phase 4's ring is drawn on the option - the
    same relocation Knob.svelte and BrowseToolbar.svelte make. No control here
    is focusable without one.
  */
  .option:has(:focus-visible) {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
    border-radius: 6px;
  }

  /* Micro: the selected option is accent under reserved-list entry 8. */
  .word {
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
    transition: color 140ms ease-out;
  }

  .option:hover .word {
    color: var(--color-ink);
  }

  .option.selected .word,
  .option.selected:hover .word {
    color: var(--color-accent);
  }
</style>
