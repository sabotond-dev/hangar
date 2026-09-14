<!--
  The catalog probe: D-14's production-build laziness proof, prerendered and linked from nowhere.
  The catalog is imported statically at module scope (on the page from the first paint); an engine
  is built only from an explicit click through a dynamic import - the exact line e2e/catalog.e2e.ts
  measures by counting .wasm responses before and after the click. A static import of $lib/sim/engine
  here would put the VM's module graph and the glue.wasm URL into this chunk. Both handlers write
  their failure branch into the same element rather than throwing, as the fidelity probe does (that
  sibling is described, not spelled: config-shape.spec.ts's probe scan reads comments).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  // Static, at module scope, on purpose: the catalog names neither the compile surface nor the VM package.
  import { CATALOG } from "$lib/catalog";

  const TICKS = 30;

  let luaOut = $state("pending");
  let padsimOut = $state("pending");

  async function probe(preview: "lua" | "padsim"): Promise<string> {
    try {
      // Dynamic, inside the click handler; never in onMount, which runs at the moment the cold-load assertion is taken.
      const { createEngine } = await import("$lib/sim/engine");
      const entry = CATALOG.find((e) => e.preview === preview);
      if (entry === undefined)
        return `error: no ${preview} entry in the catalog`;
      const engine = await createEngine(entry);
      engine.run(TICKS);
      const frame = engine.frame;
      let nonZeroBytes = 0;
      for (const byte of frame) if (byte !== 0) nonZeroBytes += 1;
      return JSON.stringify({
        id: entry.id,
        frameLength: frame.length,
        nonZeroBytes,
        animating: engine.animating,
      });
    } catch (error) {
      return `error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
</script>

<h1>Catalog probe</h1>

<p data-testid="catalog-count">{CATALOG.length}</p>

<ul data-testid="catalog-list">
  {#each CATALOG as entry (entry.id)}
    <li>{entry.id} | {entry.name} | {entry.preview} | {entry.knobs.length}</li>
  {/each}
</ul>

<button
  type="button"
  data-testid="start-lua"
  onclick={async () => {
    luaOut = await probe("lua");
  }}>Open a Lua configuration</button
>
<p data-testid="lua-probe">{luaOut}</p>

<button
  type="button"
  data-testid="start-padsim"
  onclick={async () => {
    padsimOut = await probe("padsim");
  }}>Open a simulator configuration</button
>
<p data-testid="padsim-probe">{padsimOut}</p>
