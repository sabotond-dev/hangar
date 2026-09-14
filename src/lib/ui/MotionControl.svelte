<!--
  The motion control: one checkbox under the footer's Help & shortcuts - do the
  previews move on their own; checked means still. No props. The shared simulator
  host stills every ambient preview under the flag and a pad animates only while
  a finger is on it (src/lib/sim/host.ts, active()). Additive to
  prefers-reduced-motion, never subtractive: when the OS asks for less motion the
  box is checked and disabled, and motion.svelte.ts reports os || still with no
  branch that turns the OS's true into false. The strings are the module's, both
  ledgered in 13-COPY-NEW.md.
  Decided at 13-04 (13-CONTEXT D-09); see .planning/phases/13-gui-overhaul/13-04-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import {
    chooseMotion,
    motion,
    MOTION_EXPLANATION,
    MOTION_LABEL,
    osQuery,
  } from "$lib/sim/motion.svelte";

  const EXPLANATION_ID = "motion-explanation";

  /** The OS half, as state so the box follows a mid-session toggle; read in onMount because matchMedia does not exist in the prerenderer. */
  let osReduced = $state(false);
  onMount(() => {
    const query = osQuery();
    if (query === undefined) return;
    const sync = (): void => {
      osReduced = query.matches;
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  });

  const still = $derived(osReduced || motion.choice === "still");
</script>

<div class="motion" data-testid="motion-control">
  <label class="row">
    <input
      type="checkbox"
      data-testid="motion-still"
      checked={still}
      disabled={osReduced}
      aria-describedby={EXPLANATION_ID}
      onchange={(event) =>
        chooseMotion(event.currentTarget.checked ? "still" : "animated")}
    />
    <span class="label">{MOTION_LABEL}</span>
  </label>
  <p class="explanation" id={EXPLANATION_ID}>{MOTION_EXPLANATION}</p>
</div>

<style>
  /* Its own line in the footer's wrapping row: a sentence beside four links would read as a fifth. */
  .motion {
    flex-basis: 100%;
  }

  /* The label is the touch target, 44px on the block axis (§14). */
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-block-size: 44px;
    cursor: pointer;
  }

  .row:has(input:disabled) {
    cursor: default;
  }

  input {
    inline-size: 16px;
    block-size: 16px;
    margin: 0;
    accent-color: var(--color-action);
  }

  .label {
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-ink);
  }

  .explanation {
    margin: 0;
    max-inline-size: 60ch;
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-ink-quiet);
  }
</style>
