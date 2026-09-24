<!--
  Mirror ZONA (change 20, docs/MIRROR.md section 6): one outlined toggle on the name row beside the
  mode switch, on the Playground workspace and in the Sandbox's Play. It exists only while a ZONA is
  connected - the session's phase, the capability, never the browser - and is off on every page
  load; a click turns the plate over to the module's own lights and the monitor to its own MIDI,
  a second click hands both back to the simulator. aria-pressed carries the state; the words do
  not change. Square (D-01). Props: none - it reads the site's one session and one mirror.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { session } from "$lib/device/session.svelte";
  import { MIRROR_HELPER, MIRROR_LABEL } from "$lib/mirror/copy";
  import { mirror } from "$lib/mirror/mirror.svelte";

  const pressed = $derived(mirror.state !== "off");
</script>

{#if session.phase === "connected"}
  <button
    class="toggle"
    class:pressed
    type="button"
    data-testid="mirror-toggle"
    aria-pressed={pressed}
    title={MIRROR_HELPER}
    onclick={() => mirror.toggle()}
  >
    {MIRROR_LABEL}
  </button>
{/if}

<style>
  /* The mode switch's segment, as a pressed / not-pressed pair: 44px on both axes, the action colour when on. */
  .toggle {
    appearance: none;
    display: inline-flex;
    align-items: center;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 20px;
    border: 1px solid var(--color-boundary);
    background: transparent;
    font-family: var(--font-sans);
    font-size: 15px;
    color: var(--color-ink);
    cursor: pointer;
    transition: border-color 140ms ease-out;
  }

  .toggle:hover {
    border-color: var(--color-action);
  }

  .toggle.pressed {
    border-color: var(--color-action);
    color: var(--color-action);
  }

  .toggle:focus-visible {
    outline: 2px solid var(--color-action);
    outline-offset: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    .toggle {
      transition: none;
    }
  }
</style>
