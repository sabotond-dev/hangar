<!--
  The fidelity probe: D-12's production-build WASM proof, prerendered and linked from nowhere. It runs
  the vendored compiler in a real browser against the real static build so e2e/fidelity.e2e.ts can
  prove the lua_fmt WASM asset is emitted by Vite, served by worker/index.js and initialises under
  the deployed headers. The imports are dynamic and inside onMount: at module scope the server build
  would read the wasm off disk during prerender, meaningless as a browser proof. Everything goes
  through $lib/pad, the same FOUND-05 gate the browser build has to satisfy.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";

  let out = $state("pending");

  onMount(async () => {
    try {
      const { compileState, costOf, measureLua } = await import("$lib/pad");
      // DIAL, not AURORA, since 11-06: DIAL is untouched by 11-04's fast-tap guard (which moved PINWHEEL,
      // RADAR, JOYSTICK and FADERS by +7 against a fixture never recaptured) and by 11-06, at 646 / 55 on
      // src/lib/fidelity/preset-baseline.json and on the compiler alike. The state compiled is the
      // VENDORED shelf's since 12.1-09: HANGAR's nine carry `state.touchLibrary` (12.1-08b) and diverge
      // by declaration (src/lib/catalog/divergence.ts), while the fixture is BOTOR's compiler over
      // BOTOR's states - so the probe compiles the vendored PRESETS' DIAL through $lib/pad's
      // compileState (the FOUND-05 gate) and `shelf` says which state; e2e/fidelity.e2e.ts asserts it.
      const { PRESETS: vendored } = await import("../../../vendor/botor/_pad");
      const dial = vendored.find((p) => p.id === "dial");
      if (!dial) throw new Error("the vendored shelf has no dial");
      const built = await compileState(dial.state);
      const c = await costOf(built);
      out = JSON.stringify({
        preset: "dial",
        shelf: "vendored",
        setupRawLength: built.setupLua.length,
        timerRawLength: built.timerLua.length,
        setupCompressedLength: await measureLua(built.setupLua),
        timerCompressedLength: await measureLua(built.timerLua),
        costSetupUsed: c.setup.used,
        costTimerUsed: c.timer.used,
      });
    } catch (error) {
      // The failure branch writes into the same element rather than throwing: a readable assertion diff, not a timeout.
      out = `error: ${error instanceof Error ? error.message : String(error)}`;
    }
  });
</script>

<h1>Fidelity probe</h1>
<p data-testid="fidelity-probe">{out}</p>
