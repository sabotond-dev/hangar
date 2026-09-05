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

  The pair TRY ON DEVICE writes comes from two textareas on this page, so the
  probe needs no tuner and no formatter: the strings are short, printable and
  different from anything a scripted module holds at connect. The two static
  specifiers below are on the permitted list of the chunk guard
  (src/lib/config-shape.spec.ts test 13): the session, and the install store
  whose own three specifiers are two zero-import modules and the session.
  Nothing else is imported.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { install } from "$lib/device/install.svelte";
  import { session } from "$lib/device/session.svelte";

  /** The name TRY ON DEVICE announces. A test asserting the settled sentence spells the same word. */
  const NAME = "Probe";

  let setup = $state("--[[@cb]]print(3)");
  let timer = $state("--[[@cb]]print(4)");
  /** What the two RAM clicks and observeConfig read: the textareas, verbatim. */
  const pair = () => ({ setup, timer });

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

  /** `durable` / `session` / `none`, then the two lengths. */
  const snapshotLine = $derived.by(() => {
    const s = install.snapshot;
    if (!s) return "none";
    const kind = install.snapshotDurable ? "durable" : "session";
    return `${kind} ${s.setup.length} ${s.timer.length}`;
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
