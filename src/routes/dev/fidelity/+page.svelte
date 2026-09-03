<!--
  D-12: the production-build WASM proof.

  This page is prerendered (prerender.entries: ["*"] in vite.config.ts) and
  linked from nowhere. Its only job is to run the vendored compiler in a real
  browser against the real static build, so that e2e/fidelity.e2e.ts can prove
  the lua_fmt WASM asset is emitted by Vite, served by worker/index.js and
  initialises under whatever headers the deployed site actually sends.

  The imports are DYNAMIC and inside onMount on purpose. At module scope the
  server build would also import grid-protocol, resolve @wasm-fmt/lua_fmt
  through its "node" export condition and read the wasm off disk during
  prerender - harmless, and completely meaningless as a browser proof.

  Everything goes through $lib/pad rather than the vendored functions, so the
  probe exercises the same FOUND-05 gate the browser build has to satisfy.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";

  let out = $state("pending");

  onMount(async () => {
    try {
      const { compilePreset, costOf, measureLua } = await import("$lib/pad");
      const built = await compilePreset("aurora");
      const c = await costOf(built);
      out = JSON.stringify({
        preset: "aurora",
        setupRawLength: built.setupLua.length,
        timerRawLength: built.timerLua.length,
        setupCompressedLength: await measureLua(built.setupLua),
        timerCompressedLength: await measureLua(built.timerLua),
        costSetupUsed: c.setup.used,
        costTimerUsed: c.timer.used,
      });
    } catch (error) {
      // The failure branch writes into the same element rather than throwing,
      // so a broken run produces a readable assertion diff instead of a
      // Playwright timeout carrying no information.
      out = `error: ${error instanceof Error ? error.message : String(error)}`;
    }
  });
</script>

<h1>Fidelity probe</h1>
<p data-testid="fidelity-probe">{out}</p>
