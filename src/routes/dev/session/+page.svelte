<!--
  D-14: the device session's readout - the probe the real chrome will compress.

  FOUR THINGS ABOUT THIS PAGE.

  1. IT IS LINKED FROM NOWHERE. Prerendered (prerender.entries: ["*"] in
     vite.config.ts), trailing slash, and the fifth unlinked probe beside the
     walking skeleton's, the fidelity one, the catalog one and the tuning one.
     e2e/fidelity.e2e.ts asserts site-wide that the count of a[href*="/dev/"]
     on / is zero, and src/lib/config-shape.spec.ts's probe-route test reads
     every file under src/routes/ outside each probe's OWN directory and fails
     on any occurrence of a probe's path - comments included, because it is a
     plain substring scan. That test discovers every directory under the dev
     routes, so this one came under it the moment the directory existed; plan
     06-05 recorded that the scan could not see this route before it did, and
     plan 06-06 re-ran that mutation and watched it go red. The four siblings
     are described here rather than spelled, for the same reason the tuning
     probe describes them.

  2. IT RENDERS NO PRODUCTION CHROME. The header slot, the disclosure, the
     note and the live region are waves 8 to 12 of this phase. This page is a
     plain-text readout of what the session publishes - the phase verbatim,
     the identity fields, the failure block for the header's label, the forget
     capability and the fake serial's write counter - so a browser test can
     assert on states the real chrome deliberately compresses (a cancelled
     chooser and a declined permission are one slot state; here they are two
     readouts), and so the session is proven in a browser BEFORE a component
     exists to hide a bug in. No design system, no component from the ui
     directory: giving this page chrome would make it a second implementation
     of the header.

  3. THE SESSION IS THE SINGLETON, NOT A FRESH INSTANCE, AND IT IS STARTED
     HERE. One instance per page load is D-05, and this page starts it from
     its own onMount because nothing else does yet; plan 06-09 moves the start
     into the root layout for the whole site, at which point start() here is
     the second call, and start() is idempotent on the instance precisely so
     that second call attaches nothing twice. Every node test constructs its
     own DeviceSession; this page is the one reader of `session` until the
     components arrive.

  4. NOTHING IS AWAITED IN FRONT OF connect(). The handler calls the session's
     connect() as its first and only statement, so requestPort() is the first
     thing that runs inside the click's activation window. The session's own
     header explains why that is load-bearing; this page just does not get in
     the way.

  The two static specifiers below are on the permitted list of the chunk guard
  (src/lib/config-shape.spec.ts test 13): the session and its copy module,
  both free of the protocol package. Nothing else is imported.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
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
   * The fake serial's write counter when a test installed one, else 0. It is
   * not a signal, so it is re-read whenever the session publishes a phase or
   * an identity - which is every moment a write could have happened.
   */
  let writes = $state(0);
  $effect(() => {
    void session.phase;
    void session.identity;
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
