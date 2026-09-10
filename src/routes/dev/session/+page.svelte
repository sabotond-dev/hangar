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

  The THREE static specifiers below are on the permitted list of the chunk
  guard (src/lib/config-shape.spec.ts test 13, PERMITTED_SPECIFIERS): the
  session, its copy module, and - since plan 11-08.1 - `$lib/device/install
  .svelte`, which 07-08 added to that list when the root layout began starting
  the install store for the whole site. All three are free of the protocol
  package. Nothing else is imported.

  WHY THE INSTALL STORE IS READ HERE AT ALL, ON A PAGE ABOUT THE SESSION.
  src/routes/+layout.svelte starts it site-wide, so it has ALWAYS been live on
  this route; it was merely invisible. And its phase is the only signal on this
  page that IMPLIES the snapshot's round trips have finished.
  session.svelte.ts sets `phase = "connected"` and only THEN fires the
  connection event; install.svelte.ts receives it and calls `void #attach(...)`,
  fire-and-forget by design; #snapshot issues one SERIALNUMBER/FETCH and then
  fetchAll, which sequence.ts runs strictly sequentially - THREE fetches since
  12-03, so FOUR round trips are ABOUT TO START when `connected` reaches the
  DOM. e2e/session.e2e.ts's onlyReads asserted exact totals against that, and
  the observed "expected 4, received 3" was the middle of those fetches on the
  second connect. `install-phase` leaving `snapshotting` is the causal signal
  that was missing.

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
   * The fake serial's write counter when a test installed one, else 0. It is
   * not a signal, so it is re-read whenever the session publishes a phase or
   * an identity - which is every moment a write could have happened.
   *
   * `void install.phase` IS THE THIRD DEPENDENCY AND IT IS WHAT MAKES THIS
   * READOUT MEASURE ANYTHING. The session's last publication on a connect is
   * `connected`, and every chunk of the snapshot goes out AFTER it - so with
   * only the two session dependencies this counter was structurally guaranteed
   * to be read before the writes it is about, and e2e/session.e2e.ts had
   * weakened its assertion to `0 <= shown <= 3` to live with that. It would
   * have passed with this line wired to a constant zero. The install store
   * publishes `snapshotting` and then `ready`, i.e. after all three round
   * trips, so the readout is now the shim's own count and the test asserts an
   * EQUALITY.
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
    The install store's phase, the same row the install probe publishes - and
    that probe's path is DESCRIBED rather than spelled, for the reason point 1
    of the header gives: the sibling scan in src/lib/config-shape.spec.ts is a
    plain substring match over every file outside a probe's own directory, and
    it counts comments. Writing the path here was tried and it went red.

    Not a second implementation of that probe: this page renders exactly one of
    its values, and it renders it because it is the only signal here that
    IMPLIES the snapshot's three round trips are over. See the header.
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
