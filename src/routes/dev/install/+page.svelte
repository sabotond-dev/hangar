<!--
  The install probe (07-08): the install store's plain-text readout with a trace - every phase the
  store has been in since load, in order, so `snapshotting` and `writing` are assertable in a browser.
  Linked from nowhere, prerendered; its five siblings are described, not spelled (config-shape.spec.ts's
  probe scan reads comments). No production chrome and no ui component: chrome here would be a second
  panel. Both stores are the singletons, started here as well as in the layout (start() is idempotent).
  Nothing is awaited in front of connect(): requestPort() runs first in the click's activation window.
  The five strings a write sends come from five textareas in write order - the page timer (255/6,
  12.1-08), the page init (255/0, 12-03), the utility (255/4, 13-17), then the touch pair - so the
  probe needs no tuner and no formatter; it is the sure route for pasting an arbitrary string at a
  module (the runbook's page-load and surface rows). Two static specifiers, both on the chunk guard's list.
  Decided at 07-08 / 12.1-08 / 13-17; see .planning/phases/13-gui-overhaul/13-17-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { install } from "$lib/device/install.svelte";
  import { session } from "$lib/device/session.svelte";

  /** The name TRY ON DEVICE announces. A test asserting the settled sentence spells the same word. */
  const NAME = "Probe";

  /**
   * The three system literals on this page are typed, not read from the pinned package (D-20's rule
   * everywhere else): they are starting values a visitor overwrites, and reading the real default
   * would name $lib/protocol from a route that names exactly two specifiers. An empty box means "none
   * of its own" - the store substitutes the real default in one place per slot (#systemStringOr, keyed by the event number).
   */
  let systemTimer = $state("--[[@cb]]--[[page timer]]");
  let system = $state("--[[@cb]]--[[page init]]");
  let systemUtility = $state("--[[@cb]]--[[utility]]");
  /** The page the request and confirm buttons below ask for (13-12). */
  let page = $state(0);
  let setup = $state("--[[@cb]]print(3)");
  let timer = $state("--[[@cb]]print(4)");
  /**
   * What the RAM clicks and observeConfig read: the five textareas, verbatim. Still called pair() -
   * every button below says so; the wire order is SLOTS' in sequence.ts, the store reads the fields by name.
   */
  const pair = () => ({ systemTimer, system, systemUtility, setup, timer });

  /** The trace: every phase since load, appended from an effect on install.phase that writes a value it does not read. */
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
   * `durable` / `session` / `none`, the five lengths in write order, then the record's key when it
   * predates a slot (`v1` a Phase 7 record, `v2` a Phase 12 one, `v3` a Phase 12.1 one, nothing for
   * v4). The flags are the store's own, rendered separately: this page renders values verbatim and
   * the sentence is the panel's to say (13-18).
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
   * The last action's steps, one per line: id, outcome, attempts. `lastSteps` is a plain array, not
   * a signal, so it is re-read whenever the store publishes a phase or the session's write lock moves.
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

  <!-- The page target's readout (13-12): the four fields the store mirrors and the one condition, verbatim. -->
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
  <!-- Not `install-put-back`: that testid is the readout of putBackState() above, and a locator must resolve to one element. -->
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
  The page target's controls (13-12; 13.1-CONTEXT D-05): the request sets the target and sends nothing,
  the confirm is the one method that puts a switch on the wire, the cancel takes the target back; the
  fourth button is the shipped path, install.switchPage(page), as the Target select's change calls it
  (no review, by the user's word). The discard is the firmware-native revert (PAGEDISCARD), written and
  unproven: this button is its only caller until docs/INSTALL-RUNBOOK.md row I says what a module does with it.
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
