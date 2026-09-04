<!--
  D-14: the production-build laziness proof.

  This page is prerendered (prerender.entries: ["*"] in vite.config.ts) and
  linked from nowhere. Its only job is to make the lazy seam observable from
  outside the process: the catalog is imported STATICALLY at module scope, so it
  is on the page from the first paint, while an engine is built only from an
  explicit click through a DYNAMIC import. That placement is load-bearing and
  not stylistic - it is the exact line e2e/catalog.e2e.ts measures, by counting
  .wasm responses before and after the click. A static import of $lib/sim/engine
  here would put the Lua VM's module graph, and with it the fingerprinted
  glue.wasm URL, into this page's chunk, and the cold-load assertion would go
  red for a reason that has nothing to do with the catalog.

  Both handlers write their failure branch into the same element rather than
  throwing, exactly as src/routes/dev/fidelity/+page.svelte does, so a broken
  run produces a readable assertion diff instead of a Playwright timeout
  carrying no information.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  // STATIC, at module scope, on purpose. The catalog is pure data and types by
  // construction - it names neither the compile surface nor the VM package -
  // and this page is what proves that end to end in a real browser.
  import { CATALOG } from "$lib/catalog";

  const TICKS = 30;

  let luaOut = $state("pending");
  let padsimOut = $state("pending");

  async function probe(preview: "lua" | "padsim"): Promise<string> {
    try {
      // DYNAMIC, inside the click handler. Never at module scope, never in
      // onMount: onMount runs on load, which is precisely the moment the
      // cold-load assertion is taken.
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
