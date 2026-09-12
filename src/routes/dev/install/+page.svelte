<!--
  Phase 7 (plan 07-08): the install store's readout, with a trace - the probe
  the real chrome will compress.

  FOUR THINGS ABOUT THIS PAGE.

  1. IT IS LINKED FROM NOWHERE. Prerendered (prerender.entries: ["*"] in
     vite.config.ts), trailing slash, and the sixth unlinked probe beside the
     walking skeleton's, the fidelity one, the catalog one, the tuning one and
     the device session's. e2e/fidelity.e2e.ts asserts site-wide that the
     count of a[href*="/dev/"] on / is zero, and src/lib/config-shape.spec.ts's
     probe-route test reads every file under src/routes/ outside each probe's
     OWN directory and fails on any occurrence of a probe's path - comments
     included, because it is a plain substring scan. That test discovers every
     directory under the dev routes, so this one came under it the moment the
     directory existed, and plan 07-08 planted this page's path in the front
     door and watched the test go red. The five siblings are described here
     rather than spelled, for the same reason the tuning probe describes them.

  2. IT RENDERS NO PRODUCTION CHROME, AND IT KEEPS A TRACE. The panel, the
     inline flash confirmation and the header lock are waves 9 to 11 of this
     phase. This page is a plain-text readout of what the install store
     publishes - the phase verbatim, the action, the leg, the cause, the
     snapshot, the two closed decisions the components will render
     (keepReason, putBackState), the last action's steps - plus one thing no
     component will ever show: EVERY phase the store has been in since load,
     in order. A round trip through the scripted module takes tens of
     milliseconds, so `snapshotting` and `writing` never stay on screen long
     enough for a browser test to see them; the trace makes those transients
     assertable, and it is why the fourteen states can be walked in a browser
     BEFORE a component exists to hide a transition in. No design system, no
     component from the ui directory: giving this page chrome would make it a
     second implementation of the panel.

  3. BOTH STORES ARE THE SINGLETONS, AND BOTH ARE STARTED HERE. One instance
     per page load is D-05; the root layout starts the session (06-09) and,
     since this plan, the install store too, and both start() calls are
     idempotent on the instance - so the two calls in this page's own onMount
     attach nothing twice and exist only so the page reads true if the layout
     ever stops starting one of them. Every node test constructs its own
     DeviceSession and InstallStore; this page reads the singletons.

  4. NOTHING IS AWAITED IN FRONT OF connect(). The handler calls the session's
     connect() as its first and only statement, so requestPort() is the first
     thing that runs inside the click's activation window. The session's own
     header explains why that is load-bearing.

  The FIVE strings TRY ON DEVICE writes come from five textareas on this page,
  so the probe needs no tuner and no formatter: the strings are short, printable
  and different from anything a scripted module holds at connect. The third one -
  install-system, added by plan 12-03 - is the SYSTEM element s page-init slot
  (255/0). The fourth - install-system-timer, added by plan 12.1-08 - is the
  SYSTEM element s timer slot (255/6), the first box on the page, and it goes on
  the wire FIRST of all, ahead of the page init (sequence.ts s SLOTS order). It
  is the sure route for pasting an arbitrary page timer at a module, which is
  what the runbook s page-load row (12.1 D-04) needs: a way to put the library s
  second half into 255/6 without the tuner. The fifth - install-system-utility,
  added by plan 13-17 (13-CONTEXT D-18 / D-19) - is the SYSTEM element s utility
  slot (255/4), the third box on the page and the third on the wire, after the
  page init and before the touch pair; it is the sure route for pasting an
  arbitrary utility body at a module, which is what the runbook s surface row
  (M) can fall back on. The two static specifiers below are on the permitted
  list of the chunk guard (src/lib/config-shape.spec.ts test 13): the session,
  and the install store whose own three specifiers are two zero-import modules
  and the session. Nothing else is imported; the fourth and fifth textareas
  added none.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { install } from "$lib/device/install.svelte";
  import { session } from "$lib/device/session.svelte";

  /** The name TRY ON DEVICE announces. A test asserting the settled sentence spells the same word. */
  const NAME = "Probe";

  /**
   * THE PAGE TIMER AND THE PAGE INIT, AND THE TWO LITERALS ON THIS PAGE THAT
   * ARE THE HONEST CHOICE.
   *
   * Everywhere else in HANGAR a firmware default is READ FROM THE PINNED
   * PACKAGE and never typed (D-20 s rule; constants.ts). Here it is typed,
   * because this page exists to paste ARBITRARY strings at a module: this is a
   * starting value a visitor overwrites, not a claim about what the firmware
   * ships. Reading the real default would also mean naming $lib/protocol from
   * a route file that deliberately names exactly two specifiers. The page
   * timer (12.1-08) and the utility (13-17) follow the same rule for the same
   * reason; none is the firmware s own text, and an empty box means "none of
   * its own" - the store substitutes the real default in one place per slot
   * (#pageInit, #pageTimer, #pageUtility).
   */
  let systemTimer = $state("--[[@cb]]--[[page timer]]");
  let system = $state("--[[@cb]]--[[page init]]");
  let systemUtility = $state("--[[@cb]]--[[utility]]");
  /** The page the request and confirm buttons below ask for (13-12). */
  let page = $state(0);
  let setup = $state("--[[@cb]]print(3)");
  let timer = $state("--[[@cb]]print(4)");
  /**
   * What the RAM clicks and observeConfig read: the five textareas, verbatim,
   * in WRITE ORDER. Still called pair() - the name is what every button below
   * already says, and it is five strings now (12.1-07 carried an empty
   * systemTimer here; 12.1-08 replaced it with the box; 13-17 added the
   * utility's). The order of this object is for the reader: the wire order is
   * SLOTS' in sequence.ts, and the store reads the fields by name.
   */
  const pair = () => ({ systemTimer, system, systemUtility, setup, timer });

  /**
   * THE TRACE. Every phase the store has been in since load, appended from an
   * effect on install.phase. The list itself is plain and only ever pushed
   * to; the rendered string is the reactive value, so the effect writes a
   * value it does not read.
   */
  const phases: string[] = [];
  let trace = $state("");
  $effect(() => {
    phases.push(install.phase);
    trace = phases.join(" > ");
  });

  /** The session can write at all: what keepReason() is asked with. */
  const capable = $derived(
    session.phase !== "unsupported" && session.phase !== "insecure",
  );
  const keepReason = $derived(install.keepReason(capable) ?? "live");
  const putBack = $derived(install.putBackState());

  /**
   * `durable` / `session` / `none`, then the FIVE lengths in write order
   * (the page timer, the page init, the utility, then the pair), then the
   * record's key when it predates a slot: `v1` for a Phase 7 record (all
   * three system strings are the firmware defaults), `v2` for a Phase 12
   * record (the page timer and the utility are), `v3` for a Phase 12.1
   * record (the utility is), nothing for a v4 record. The flags are the
   * store's own, rendered separately because this page renders values
   * verbatim; a sentence that says "the record predates the utility slot" is
   * true of ANY of the three and is the panel's to say (13-18), not this
   * readout's.
   */
  const snapshotLine = $derived.by(() => {
    const s = install.snapshot;
    if (!s) return "none";
    const kind = install.snapshotDurable ? "durable" : "session";
    const lengths = `${s.systemTimer.length} ${s.system.length} ${s.systemUtility.length} ${s.setup.length} ${s.timer.length}`;
    const from = install.snapshotFromV1
      ? " v1"
      : install.snapshotFromV2
        ? " v2"
        : install.snapshotFromV3
          ? " v3"
          : "";
    return `${kind} ${lengths}${from}`;
  });

  /**
   * The last action's steps, one per line: id, outcome, attempts. `lastSteps`
   * is a plain array written from the queue's onStep and is not a signal, so
   * it is re-read whenever the store publishes a phase or the session's
   * write lock moves - the lock is released in each leg's finally, after the
   * restore heartbeat's step has been recorded.
   */
  let steps = $state("none");
  $effect(() => {
    void install.phase;
    void session.phase;
    void session.writeLock;
    const lines = install.lastSteps.map(
      (s) => `${s.id} ${s.outcome} ${s.attempts}`,
    );
    steps = lines.length > 0 ? lines.join("\n") : "none";
  });

  onMount(() => {
    session.start();
    install.start();
  });

  function connect(): void {
    // FIRST statement, nothing awaited. See the header.
    session.connect();
  }
</script>

<h1>ZONA install store</h1>

<p>
  A readout of the install store with no chrome in front of it, and a trace of
  every phase it has passed through. Every line is the store's own value,
  rendered verbatim.
</p>

<dl>
  <dt>session phase</dt>
  <dd data-testid="session-phase">{session.phase}</dd>

  <!--
    THE PAGE TARGET'S READOUT (13-12): the four fields the store mirrors and
    the one condition, verbatim, so a browser test can watch reported,
    requested and switching / unverified without any chrome in front of them.
  -->
  <dt>page target</dt>
  <dd data-testid="install-page-status">{install.pageStatus}</dd>
  <dt>page reported</dt>
  <dd data-testid="install-page-reported">{install.pageReported ?? "none"}</dd>
  <dt>page requested</dt>
  <dd data-testid="install-page-requested">
    {install.pageRequested ?? "none"}
  </dd>
  <dt>pages</dt>
  <dd data-testid="install-pages">{install.pages.join(" ") || "none"}</dd>
  <dt>apply ready</dt>
  <dd data-testid="install-apply-ready">{install.applyReady}</dd>

  <dt>install phase</dt>
  <dd data-testid="install-phase">{install.phase}</dd>

  <dt>trace</dt>
  <dd data-testid="install-trace">{trace}</dd>

  <dt>action</dt>
  <dd data-testid="install-action">{install.action ?? "none"}</dd>

  <dt>leg</dt>
  <dd data-testid="install-leg">{install.leg ?? "none"}</dd>

  <dt>cause</dt>
  <dd data-testid="install-cause">{install.cause ?? "none"}</dd>

  <dt>snapshot</dt>
  <dd data-testid="install-snapshot">{snapshotLine}</dd>

  <dt>module</dt>
  <dd data-testid="install-module">{install.moduleId ?? "none"}</dd>

  <dt>armed</dt>
  <dd data-testid="install-armed">{install.armed}</dd>

  <dt>confirm open</dt>
  <dd data-testid="install-confirm">{install.confirmOpen}</dd>

  <dt>slow</dt>
  <dd data-testid="install-slow">{install.slow}</dd>

  <dt>pacing escalated</dt>
  <dd data-testid="install-pacing">{install.pacingEscalated}</dd>

  <dt>keep reason</dt>
  <dd data-testid="install-keep-reason">{keepReason}</dd>

  <dt>put back</dt>
  <dd data-testid="install-put-back">{putBack}</dd>

  <dt>speech</dt>
  <dd data-testid="install-speech">{session.speech}</dd>

  <dt>steps</dt>
  <dd><pre data-testid="install-steps">{steps}</pre></dd>
</dl>

<p>
  <!-- In write order: the page timer first, then the page init, then the utility, as writeAll sends them. -->
  <label>
    Page timer
    <textarea
      data-testid="install-system-timer"
      bind:value={systemTimer}
      rows="2"
    ></textarea>
  </label>
  <label>
    Page init
    <textarea data-testid="install-system" bind:value={system} rows="2"
    ></textarea>
  </label>
  <label>
    Utility
    <textarea
      data-testid="install-system-utility"
      bind:value={systemUtility}
      rows="2"
    ></textarea>
  </label>
  <label>
    Setup
    <textarea data-testid="install-setup" bind:value={setup} rows="2"
    ></textarea>
  </label>
  <label>
    Timer
    <textarea data-testid="install-timer" bind:value={timer} rows="2"
    ></textarea>
  </label>
</p>

<p>
  <button type="button" data-testid="install-connect" onclick={connect}>
    Connect
  </button>
  <button
    type="button"
    data-testid="install-observe"
    onclick={() => install.observeConfig(pair())}
  >
    Observe pair
  </button>
  <button
    type="button"
    data-testid="install-stale"
    onclick={() => install.observeConfig(undefined)}
  >
    Observe undefined
  </button>
  <button
    type="button"
    data-testid="install-try"
    onclick={() => void install.tryOnDevice(pair(), NAME)}
  >
    Try on device
  </button>
  <!--
    Not `install-put-back`: that testid is the READOUT of putBackState() above,
    and a locator must resolve to one element (the plan's table gave both the
    same name; the readout keeps it, the click does not).
  -->
  <button
    type="button"
    data-testid="install-put-back-click"
    onclick={() => void install.putBack()}
  >
    Put back
  </button>
  <button
    type="button"
    data-testid="install-keep"
    onclick={() => install.openConfirm()}
  >
    Keep on device
  </button>
  <button
    type="button"
    data-testid="install-keep-yes"
    onclick={() => void install.keepOnDevice()}
  >
    Keep, yes
  </button>
  <button
    type="button"
    data-testid="install-keep-no"
    onclick={() => install.dismissConfirm()}
  >
    Not now
  </button>
  <button
    type="button"
    data-testid="install-retry"
    onclick={() => void install.retrySnapshot()}
  >
    Retry snapshot
  </button>
</p>

<!--
  THE PAGE TARGET'S CONTROLS (13-12; 13-CONTEXT D-06; 13.1-CONTEXT D-05). The
  request sets the target and sends nothing; the confirm sends and is the
  ONE method that puts a switch on the wire; the cancel takes the target
  back - the three halves the store still exposes, driven one at a time. The
  fourth button is the SHIPPED path: install.switchPage(page), the request
  and the confirm in one call, as the Target select's change calls it on
  /playground/[id]/ and in the Sandbox (no review, by the user's word), so
  the bench can drive it here against hardware and read the status beside
  it. The page asked for is the field. THE DISCARD is the firmware-native revert
  (PAGEDISCARD), written and UNPROVEN: this button is its only caller on the
  site until docs/INSTALL-RUNBOOK.md row I says what a module does with it.
-->
<p>
  <label>
    Page
    <input
      type="number"
      data-testid="install-page-field"
      bind:value={page}
      min="0"
    />
  </label>
  <button
    type="button"
    data-testid="install-page-request"
    onclick={() => install.requestPage(page)}
  >
    Request page
  </button>
  <button
    type="button"
    data-testid="install-page-confirm"
    onclick={() => void install.confirmPage()}
  >
    Switch page
  </button>
  <button
    type="button"
    data-testid="install-page-cancel"
    onclick={() => install.cancelPage()}
  >
    Keep this page
  </button>
  <button
    type="button"
    data-testid="install-page-switch"
    onclick={() => void install.switchPage(page)}
  >
    Switch (one call)
  </button>
  <button
    type="button"
    data-testid="install-discard"
    onclick={() => void install.revertToStored()}
  >
    Revert to what is stored (unproven)
  </button>
</p>
