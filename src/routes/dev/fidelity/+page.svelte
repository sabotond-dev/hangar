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
      const { compileState, costOf, measureLua } = await import("$lib/pad");
      // DIAL AND NOT AURORA SINCE PLAN 11-06, AND THE SECOND CHOICE RATHER
      // THAN THE FIRST. compilePreset resolves through $lib/pad, which plan
      // 11-05 pointed at HANGAR's own nine, and e2e/fidelity.e2e.ts holds the
      // result against src/lib/fidelity/preset-baseline.json - BOTOR's
      // compiler's output over BOTOR's states, captured before plan 11-04.
      //
      // Two things can put the probe and that fixture out of step, and the
      // preset has to be clean on BOTH:
      //
      //   1. HANGAR changing the card's STATE. AURORA took sends.kind = "xy"
      //      from the 2026-09-09 bench and the probe went to 415 against the
      //      fixture's 250. e2e/fidelity.e2e.ts asserts this axis mechanically
      //      against src/lib/catalog/divergence.ts, so it never has to be
      //      trusted to a comment.
      //   2. The VENDORED COMPILER moving, which the fixture predates. Plan
      //      11-04's class-B fast-tap guard moved PINWHEEL, RADAR, JOYSTICK
      //      and FADERS by +7 each and preset-baseline.json was never
      //      recaptured, so it still reads 305 / 438 / 535 / 513 against a
      //      compiler that now emits 312 / 445 / 542 / 520. RADAR was tried
      //      here first and failed at "expected 438, received 445" for exactly
      //      that reason.
      //
      // DIAL is clean on both: untouched by 11-04 and untouched by 11-06, at
      // 646 / 55 on the fixture and on the compiler alike.
      //
      // THE STATE IS THE VENDORED SHELF'S SINCE PLAN 12.1-09 (2026-09-12).
      // Plan 12.1-08b put `state.touchLibrary` - the measured knots - on all
      // nine of HANGAR's presets, so every HANGAR card now diverges from
      // BOTOR's state by declaration (src/lib/catalog/divergence.ts) and DIAL
      // compiles to 592 through HANGAR's shelf against the fixture's 646. The
      // fixture is BOTOR's compiler's output over BOTOR's states, so the probe
      // compiles BOTOR's own DIAL state - the vendored PRESETS array, which
      // plan 11-05 kept exported for exactly the fidelity fixtures - and still
      // does it through $lib/pad's compileState, so the FOUND-05 gate is the
      // one the browser build exercises. The `shelf` field says which state
      // was compiled; e2e/fidelity.e2e.ts asserts it. compilePreset is no
      // longer used here because it resolves to HANGAR's nine.
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
      // The failure branch writes into the same element rather than throwing,
      // so a broken run produces a readable assertion diff instead of a
      // Playwright timeout carrying no information.
      out = `error: ${error instanceof Error ? error.message : String(error)}`;
    }
  });
</script>

<h1>Fidelity probe</h1>
<p data-testid="fidelity-probe">{out}</p>
