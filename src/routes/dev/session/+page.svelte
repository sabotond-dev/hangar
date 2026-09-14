<!--
  The session probe (D-14): the device session's plain-text readout - the phase verbatim, the identity
  fields, the failure block for the header's label, the forget capability and the fake serial's write
  counter - so a browser test can assert on states the real chrome compresses. Linked from nowhere,
  prerendered; its siblings are described, not spelled (config-shape.spec.ts's probe scan reads
  comments). No production chrome and no ui component. The session is the singleton, started here as
  well as in the layout (start() is idempotent). Nothing is awaited in front of connect(): requestPort()
  runs first in the click's activation window. Three static specifiers, all on the chunk guard's list.
  The install store's phase is read here because it is the only signal on this page that implies the
  snapshot's round trips (four since 12-03, started after `connected` reaches the DOM) have finished.
  Decided at 06-06 / 07-08 / 11-08.1; see .planning/phases/07-install-flow/07-08-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { install } from "$lib/device/install.svelte";
  import { session } from "$lib/device/session.svelte";
  import {
    CONNECT_LABEL,
    PERMISSION_DECLINED,
    firmwareText,
  } from "$lib/device/session-copy";

  /** The failure block for the header's label, or null outside a named state. */
  const failure = $derived(session.failureFor(CONNECT_LABEL));

  /** `ZONA <type> fw <M.m.p> page <n> others <a, b>`, or `none`. */
  const identityLine = $derived.by(() => {
    const id = session.identity;
    if (!id) return "none";
    const others = id.otherModules.map((m) => m.moduleType ?? "unknown");
    return (
      `ZONA ${id.zona.moduleType ?? "unknown"} ` +
      `fw ${firmwareText(id.zona.firmware)} ` +
      `page ${id.activePage} ` +
      `others ${others.length > 0 ? others.join(", ") : "none"}`
    );
  });

  /**
   * The fake serial's write counter when a test installed one, else 0. Not a signal, so re-read on
   * every phase, every identity and - the dependency that makes it measure anything - every install
   * phase: the snapshot's writes go out after `connected`, and only `ready` says they are over, which
   * is what lets e2e/session.e2e.ts assert an equality rather than `0 <= shown <= 3`.
   */
  let writes = $state(0);
  $effect(() => {
    void session.phase;
    void session.identity;
    void install.phase;
    const shim = (
      window as unknown as { __hangarSerial?: { writes(): number } }
    ).__hangarSerial;
    writes = shim?.writes() ?? 0;
  });

  onMount(() => {
    session.start();
  });

  function connect(): void {
    // FIRST statement, nothing awaited. See the header.
    session.connect();
  }
</script>

<h1>ZONA device session</h1>

<p>
  A readout of the device session with no chrome in front of it. Every line is
  the session's own value, rendered verbatim.
</p>

<dl>
  <dt>phase</dt>
  <dd data-testid="session-phase">{session.phase}</dd>

  <!--
    The install store's phase, the one value this page renders from the install probe's row (that
    probe's path is described, not spelled): the only signal here that implies the snapshot's round trips are over.
  -->
  <dt>install phase</dt>
  <dd data-testid="install-phase">{install.phase}</dd>

  <dt>identity</dt>
  <dd data-testid="session-identity">{identityLine}</dd>

  <dt>failure title</dt>
  <dd data-testid="session-failure-title">{failure?.title ?? "none"}</dd>

  <dt>failure detail</dt>
  <dd data-testid="session-failure-detail">{failure?.detail ?? "none"}</dd>

  <dt>failure steps</dt>
  <dd data-testid="session-failure-steps">
    {#if failure && failure.steps.length > 0}
      <ol>
        {#each failure.steps as step (step)}<li>{step}</li>{/each}
      </ol>
    {:else}
      none
    {/if}
  </dd>

  <dt>permission declined</dt>
  <dd data-testid="session-permission-declined">
    {session.permissionDeclined ? PERMISSION_DECLINED : "none"}
  </dd>

  <dt>can forget</dt>
  <dd data-testid="session-can-forget">{session.canForget}</dd>

  <dt>writes</dt>
  <dd data-testid="session-writes">{writes}</dd>
</dl>

<p>
  <button type="button" data-testid="session-connect" onclick={connect}>
    {CONNECT_LABEL}
  </button>
  <button
    type="button"
    data-testid="session-disconnect"
    onclick={() => void session.disconnect()}
  >
    Disconnect
  </button>
  <button
    type="button"
    data-testid="session-forget"
    onclick={() => void session.forget()}
  >
    Forget
  </button>
</p>
