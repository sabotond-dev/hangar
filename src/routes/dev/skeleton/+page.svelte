<!--
  FOUND-01: the walking skeleton's operator surface.

  Prerendered (prerender.entries: ["*"] in vite.config.ts) and linked from
  nowhere, exactly like /dev/fidelity/. Its only job is to drive one provable
  no-op against a real ZONA and to record every byte of it.

  D-05's "bare" rule is the reason this file looks the way it does: the only
  module specifiers anywhere in it are "svelte", "$lib/protocol" and
  "$lib/transport", and a spec in src/lib/config-shape.spec.ts asserts exactly
  that against the source. The two surfaces are loaded dynamically from
  onMount, so the server build never pulls the protocol package into the
  prerendered page's graph, and so the click handler below can call
  requestPort() with nothing awaited in front of it.

  Nothing here is styled beyond legibility. It is a diagnostic, and Phase 4
  owns the design system.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  type Protocol = typeof import("$lib/protocol");
  type Transport = typeof import("$lib/transport");
  type Identity = import("$lib/transport").Identity;
  type IdentifyState = import("$lib/transport").IdentifyState;
  type FetchedPair = import("$lib/transport").FetchedPair;
  type CaptureStep = import("$lib/transport").CaptureStep;
  type CaptureRecorder = import("$lib/transport").CaptureRecorder;
  type RequestQueue = import("$lib/transport").RequestQueue;
  type GridTransport = import("$lib/transport").GridTransport;
  type FailureCopy = import("$lib/transport").FailureCopy;

  let P: Protocol | null = $state(null);
  let T: Transport | null = $state(null);

  let ready = $state(false);
  let serialAvailable = $state(false);
  let degrade: FailureCopy | null = $state(null);
  let refusal: FailureCopy | null = $state(null);
  let grantedPorts: number | undefined = $state(undefined);

  let status = $state(
    "not connected - loading the protocol and transport modules",
  );
  let portOpen = $state(false);
  let identity: Identity | null = $state(null);
  let before: FetchedPair | null = $state(null);
  let after: FetchedPair | null = $state(null);
  let writeRefusal: string | null = $state(null);
  let writesAcknowledged = $state(false);
  let byteIdentical: boolean | undefined = $state(undefined);
  let steps: CaptureStep[] = $state([]);
  let log: string[] = $state([]);
  let captureExists = $state(false);

  /**
   * The falsifiable definition, kept as one string rather than as markup so
   * the four numbers cannot be reflowed apart from their units by a formatter
   * - the page's own acceptance greps read them, and so will the person
   * writing the results document.
   */
  const HEARTBEAT_REQUIRED =
    "With the host heartbeat off, within a 10 s window from connect: inbound " +
    "HEARTBEAT frames arrive at 3 per second or more; both CONFIG/FETCH " +
    "return a REPORT within 1000 ms; both CONFIG/EXECUTE return an " +
    "ACKNOWLEDGE within 500 ms; and PAGESTORE returns an ACKNOWLEDGE within " +
    "3000 ms. If all four hold, the host heartbeat is not required.";

  // Both toggles are recorded into the capture's run block, so an arm can
  // never be reported as the other one.
  let hostHeartbeatEnabled = $state(true);
  let pacedTenMs = $state(true);

  // Plain locals: none of these are rendered, so none of them needs to be
  // reactive state.
  let queue: RequestQueue | null = null;
  let recorder: CaptureRecorder | null = null;
  let keeperTimer: ReturnType<typeof setTimeout> | undefined;
  let keeperBeat = false;
  let detachHide: (() => void) | undefined;

  onMount(async () => {
    // Dynamic and inside onMount, exactly as /dev/fidelity/ does. Two reasons
    // agree: at module scope the SERVER build would pull the protocol package
    // into the prerendered page's graph for nothing, and a dynamic import
    // inside the CLICK handler would be a network round trip that could
    // outlast the transient activation requestPort() needs.
    P = await import("$lib/protocol");
    T = await import("$lib/transport");
    serialAvailable = T.webSerialAvailable();
    degrade = T.failureCopy("no-web-serial");
    ready = true;
    status = serialAvailable
      ? "not connected"
      : "not connected - this browser cannot talk to hardware";
    if (serialAvailable) {
      // An observation, and nothing else: the number is read for the runbook's
      // row P. No port is opened and no session is resumed here. Silent
      // reconnect from a granted port is CONN-06 and belongs to Phase 6.
      grantedPorts = (await navigator.serial.getPorts()).length;
    }
  });

  onDestroy(() => {
    stopKeeper();
    detachHide?.();
  });

  function note(line: string): void {
    // Bounded for the DOM only. The recorder keeps every frame; this list is
    // the last 200 of them so a 60 second run does not render 250 heartbeats
    // a minute into the document.
    log = [...log.slice(-199), `${Math.round(performance.now())} ms  ${line}`];
  }

  function showRefusal(err: unknown, port?: SerialPort): void {
    const surface = T;
    if (!surface) return;
    const kind = surface.classifyOpenError(err, port);
    refusal = surface.failureCopy(
      kind,
      err instanceof Error ? err.message : String(err),
    );
    status = `could not connect: ${refusal.title}`;
  }

  async function connect(): Promise<void> {
    // FIRST statement. Nothing is awaited before it. Transient activation
    // EXPIRES (about 4.9 s in current engines) rather than being consumed, so
    // an await here makes the picker reject for a reason that reads as a
    // permissions bug. Do not write the browser-family word here - this file's
    // own acceptance grep counts comments.
    const picked = await navigator.serial
      .requestPort({ filters: [P!.ZONA_USB] })
      .catch((err: unknown) => {
        // A closed chooser is a NotFoundError, not a fault, and the copy says so.
        showRefusal(err);
        return undefined;
      });
    if (!picked) return;
    await open(picked);
  }

  async function open(port: SerialPort): Promise<void> {
    const protocol = P!;
    const surface = T!;
    refusal = null;
    try {
      await port.open({
        baudRate: protocol.BAUD_RATE,
        bufferSize: protocol.READ_BUFFER_SIZE,
      });
    } catch (err) {
      showRefusal(err, port);
      return;
    }

    const grid = new surface.WebSerialTransport(port);
    detachHide = grid.closeOnHide();
    portOpen = true;

    const preSendDelayMs = pacedTenMs ? protocol.PRE_SEND_DELAY_MS : 0;
    const record = new surface.CaptureRecorder(
      {
        id: `${hostHeartbeatEnabled ? "a-hb-on" : "b-hb-off"}-pace-${preSendDelayMs}`,
        hostHeartbeat: {
          enabled: hostHeartbeatEnabled,
          intervalMs: protocol.HOST_HEARTBEAT_MS,
          type: 255,
        },
        pacing: { preSendDelayMs },
        timeouts: { ...protocol.TIMEOUTS },
        retries: protocol.RETRY_ATTEMPTS,
        userAgent: navigator.userAgent,
        origin: location.origin,
        protocolPin: protocol.PROTOCOL_PIN,
      },
      // The top-level capture field plan 05's gate reads. A capture that
      // cannot say where it came from costs a second hardware session.
      { source: "hardware" },
    );
    recorder = record;
    captureExists = true;

    // The queue writes through this, so every outbound frame is on the record
    // before it reaches the port.
    const recording: GridTransport = {
      get isOpen() {
        return grid.isOpen;
      },
      write: async (data) => {
        record.tx(data);
        await grid.write(data);
      },
      onData: (cb) => grid.onData(cb),
      onClose: (cb) => grid.onClose(cb),
      close: () => grid.close(),
    };

    queue = new surface.RequestQueue(recording, {
      preSendDelayMs,
      onStep: (step) => {
        // The keeper beat is ambient traffic, not a step of the run. Its bytes
        // are on the record as tx events either way; two hundred of them in
        // the step list would bury the eight transactions the results document
        // is written from.
        if (keeperBeat) return;
        record.step(step);
        steps = [...steps, step];
      },
    });

    const scanner = new protocol.FrameScanner();
    scanner.onOverflow = () =>
      note("rx buffer ceiling hit; the buffer was dropped");
    const state: IdentifyState = surface.newIdentifyState();

    grid.onData((chunk) => {
      record.rxChunk(chunk);
      for (const frame of scanner.push(chunk)) {
        const decoded = protocol.decodeFrame(frame);
        record.rxFrame(frame, decoded);
        if (!decoded.ok) {
          note(`frame refused: ${decoded.reason}`);
          continue;
        }
        // Identity first, then the queue - the order the desktop's message
        // stream uses (message-stream.store.ts:406).
        surface.absorbFrame(decoded.classes, state);
        for (const cls of decoded.classes) {
          queue?.deliver(cls);
          note(`rx ${cls.class_name}/${cls.class_instr}`);
        }
      }
    });
    grid.onClose((reason) => {
      portOpen = false;
      stopKeeper();
      queue?.abort(reason);
      status = `the port closed: ${reason}`;
    });

    status = "identifying - waiting for a heartbeat carrying the active page";
    if (hostHeartbeatEnabled) startKeeper();

    const found = await waitForIdentity(state);
    if (!found) {
      status =
        "no ZONA heartbeat carrying an active page arrived inside the identify window - this module may not be the one on the USB cable";
      return;
    }
    identity = found;
    const info = port.getInfo();
    record.setIdentity({
      usbVendorId: info.usbVendorId ?? protocol.ZONA_USB.usbVendorId,
      usbProductId: info.usbProductId ?? protocol.ZONA_USB.usbProductId,
      sx: found.zona.sx,
      sy: found.zona.sy,
      rot: found.zona.rot,
      hwcfg: found.zona.hwcfg,
      moduleType: found.zona.moduleType ?? "unknown",
      revision: found.zona.revision ?? "unknown",
      firmware: found.zona.firmware,
      heartbeatType: found.zona.heartbeatType,
      activePage: found.activePage,
      otherModules: found.otherModules.map((m) => ({
        sx: m.sx,
        sy: m.sy,
        hwcfg: m.hwcfg,
      })),
    });
    const identified: CaptureStep = {
      id: "identify",
      descr: `HEARTBEAT/EXECUTE TYPE ${found.zona.heartbeatType} with the active page beside it`,
      attempts: 1,
      outcome: "ok",
    };
    record.step(identified);
    steps = [...steps, identified];
    status = describe(found);
  }

  function waitForIdentity(
    state: IdentifyState,
  ): Promise<Identity | undefined> {
    const surface = T!;
    return new Promise((resolve) => {
      const look = () => {
        const found = surface.identify(state);
        if (found) {
          resolve(found);
          return;
        }
        if (surface.identifyTimedOut(state)) {
          resolve(undefined);
          return;
        }
        setTimeout(look, 50);
      };
      look();
    });
  }

  const describe = (id: Identity) =>
    `${id.zona.moduleType ?? "unknown module"} ${id.zona.revision ?? ""} ` +
    `firmware ${id.zona.firmware.major}.${id.zona.firmware.minor}.${id.zona.firmware.patch}, ` +
    `SX ${id.zona.sx} SY ${id.zona.sy}, heartbeat type ${id.zona.heartbeatType}, ` +
    `active page ${id.activePage}`;

  function startKeeper(): void {
    const beat = () => {
      keeperBeat = true;
      const sent = queue?.sendImmediate(
        P!.hostHeartbeat(),
        "restore-page-change",
      );
      void Promise.resolve(sent)
        .catch(() => undefined)
        .finally(() => {
          keeperBeat = false;
        });
      // One timer that schedules the next one, never a repeating timer: a
      // repeating chain is one of the intensive-throttling triggers a
      // backgrounded tab applies, which is also why the note below asks for
      // this tab to stay in front.
      keeperTimer = setTimeout(beat, P!.HOST_HEARTBEAT_MS);
    };
    keeperTimer = setTimeout(beat, P!.HOST_HEARTBEAT_MS);
  }

  function stopKeeper(): void {
    if (keeperTimer !== undefined) clearTimeout(keeperTimer);
    keeperTimer = undefined;
  }

  async function run(label: string, body: () => Promise<void>): Promise<void> {
    try {
      await body();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      status = `${label} stopped: ${message}`;
      note(`${label}: ${message}`);
    }
  }

  const doFetch = () =>
    run("fetch", async () => {
      before = await T!.fetchBoth(queue!, identity!);
      after = null;
      byteIdentical = undefined;
      writesAcknowledged = false;
      // D-09: the write buttons stay disabled unless both fetched strings are
      // trustworthy, and the page names the event and the reason.
      const guard = P!.canWriteBack([before.setup, before.timer]);
      writeRefusal = guard.ok ? null : guard.reason;
      status = guard.ok
        ? `fetched Setup ${before.setup.actionString?.length} and Timer ${before.timer.actionString?.length} characters`
        : `write back refused: ${guard.reason}`;
    });

  const doWriteBack = () =>
    run("write back", async () => {
      try {
        await T!.writeBack(queue!, identity!, before!);
        writesAcknowledged = true;
        status = "both write-backs acknowledged in RAM";
      } finally {
        // The same mandatory rule runNoOpCycle holds in its own finally: a
        // successful config write leaves the module unable to change page
        // until a type 255 heartbeat arrives.
        await T!.restorePageChange(queue!);
      }
    });

  const doRefetch = () =>
    run("re-fetch", async () => {
      const fresh = await T!.fetchBoth(queue!, identity!, "refetch");
      after = fresh;
      const first = before!;
      byteIdentical =
        first.setup.actionString === fresh.setup.actionString &&
        first.timer.actionString === fresh.timer.actionString;
      recorder!.setResults({
        setupBefore: first.setup.actionString ?? "",
        timerBefore: first.timer.actionString ?? "",
        setupAfter: fresh.setup.actionString ?? "",
        timerAfter: fresh.timer.actionString ?? "",
        byteIdentical,
      });
      status = byteIdentical
        ? "re-fetched: both strings are byte-identical to what was fetched"
        : "re-fetched: the strings differ - read the two panels below";
    });

  const doStore = () =>
    run("store", async () => {
      await T!.storeToFlash(queue!, identity!);
      status = "the store was acknowledged";
    });

  const doRestore = () =>
    run("restore heartbeat", async () => {
      await T!.restorePageChange(queue!);
      status = "restore heartbeat sent - the module can change page again";
    });

  const doBurst = () =>
    run("burst probe", async () => {
      const burst = await T!.runBurstProbe(queue!, identity!, {
        preSendDelayMs: pacedTenMs ? P!.PRE_SEND_DELAY_MS : 0,
      });
      recorder!.setBurst(burst);
      status =
        `burst: ${burst.n} fetches, ${burst.timeouts} timed out, ${burst.nacks} refused, ` +
        `min ${burst.latencyMs.min.toFixed(1)} ms, p50 ${burst.latencyMs.p50.toFixed(1)} ms, ` +
        `max ${burst.latencyMs.max.toFixed(1)} ms`;
    });

  function exportJson(): void {
    const capture = recorder!.toJSON();
    const blob = new Blob([JSON.stringify(capture, null, 1)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `hangar-skeleton-${capture.run.id}-${capture.capturedAt.replace(/[:.]/g, "-")}.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<h1>ZONA walking skeleton</h1>

<p data-testid="skeleton-status">{status}</p>

<section>
  <h2>Read this before the run</h2>
  <ol>
    <li>
      What <strong>required</strong> means for the host heartbeat, written down
      before the run so the experiment has an expectation it can falsify:
      <br />
      {HEARTBEAT_REQUIRED}
    </li>
    <li>
      Every run ends with one heartbeat carrying type 255. A successful config
      write leaves the module unable to change page - from its own script or
      from the outside - until that heartbeat arrives or the module is
      power-cycled. The <strong>Restore heartbeat</strong> button sends one at any
      time, and it stays available after any error.
    </li>
    <li>
      Keep this tab in front for the whole run. A backgrounded tab throttles
      timers and invalidates every latency on this page.
    </li>
    <li>
      While this page holds the port, Grid Editor cannot connect to the module.
      The port is closed when this page is hidden.
    </li>
    <li>
      During the store the module's border LEDs animate yellow-dim and then
      settle. That is the store working, not a fault. The store also reloads the
      page from flash, which restarts the module's script: the stored bytes are
      unchanged, the running script is restarted.
    </li>
    <li>
      Nothing is written without a click. Connect is one click, write back is a
      second, store to flash is a third.
    </li>
  </ol>
</section>

<section>
  {#if ready && !serialAvailable && degrade}
    <div data-testid="skeleton-degrade">
      <h2>{degrade.title}</h2>
      <p>{degrade.detail}</p>
      <ul>
        {#each degrade.steps as step (step)}<li>{step}</li>{/each}
      </ul>
    </div>
  {:else if ready}
    <button
      type="button"
      data-testid="skeleton-connect"
      disabled={portOpen}
      onclick={connect}
    >
      Connect
    </button>
  {/if}

  <p data-testid="skeleton-ports">
    previously granted ports: {grantedPorts ?? "not read"}
  </p>

  <div data-testid="skeleton-others">
    {#if identity && identity.otherModules.length > 0}
      <p>
        Other modules on the rig. The store is disabled because a page store is
        a global broadcast.
      </p>
      <ul>
        {#each identity.otherModules as other (`${other.sx},${other.sy}`)}
          <li>
            HWCFG {other.hwcfg} at SX {other.sx} SY {other.sy} - {other.moduleType ??
              "type not in the protocol package"}
          </li>
        {/each}
      </ul>
    {:else}
      <p>Other modules on the rig: none seen.</p>
    {/if}
  </div>
</section>

{#if refusal}
  <section>
    <h2>{refusal.title}</h2>
    <p>{refusal.detail}</p>
    <ol>
      {#each refusal.steps as step (step)}<li>{step}</li>{/each}
    </ol>
  </section>
{/if}

<section>
  <h2>Run settings</h2>
  <p>
    <label>
      <input
        type="checkbox"
        bind:checked={hostHeartbeatEnabled}
        disabled={portOpen}
      />
      send the host heartbeat while connected
    </label>
  </p>
  <p>
    <label>
      <input type="checkbox" bind:checked={pacedTenMs} disabled={portOpen} />
      pace sends 10 ms apart (off = 0 ms)
    </label>
  </p>
</section>

<section>
  <h2>Controls</h2>
  <p>
    <button
      type="button"
      data-testid="skeleton-fetch"
      disabled={!identity}
      onclick={doFetch}
    >
      Fetch
    </button>
    <button
      type="button"
      data-testid="skeleton-write"
      disabled={!before || writeRefusal !== null}
      onclick={doWriteBack}
    >
      Write back (RAM)
    </button>
    <button
      type="button"
      data-testid="skeleton-store"
      disabled={!writesAcknowledged || !identity?.storeAllowed}
      onclick={doStore}
    >
      Store to flash - writes the config that is already there
    </button>
    <button
      type="button"
      data-testid="skeleton-refetch"
      disabled={!before}
      onclick={doRefetch}
    >
      Re-fetch
    </button>
    <button
      type="button"
      data-testid="skeleton-restore"
      disabled={!portOpen}
      onclick={doRestore}
    >
      Restore heartbeat
    </button>
    <button
      type="button"
      data-testid="skeleton-burst"
      disabled={!identity}
      onclick={doBurst}
    >
      Run burst probe
    </button>
    <button
      type="button"
      data-testid="skeleton-export"
      disabled={!captureExists}
      onclick={exportJson}
    >
      Export JSON
    </button>
  </p>
  {#if writeRefusal}
    <p>Write back refused: {writeRefusal}</p>
  {/if}
</section>

<section>
  <h2>Fetched strings</h2>
  {#if before}
    <p>
      Setup, {before.setup.actionString?.length} characters, ACTIONLENGTH {before
        .setup.actionLength}
    </p>
    <pre>{before.setup.actionString}</pre>
    <p>
      Timer, {before.timer.actionString?.length} characters, ACTIONLENGTH {before
        .timer.actionLength}
    </p>
    <pre>{before.timer.actionString}</pre>
  {:else}
    <p>Nothing fetched yet.</p>
  {/if}
  {#if after}
    <p>
      Re-fetched. Byte-identical: {byteIdentical}
    </p>
    <pre>{after.setup.actionString}</pre>
    <pre>{after.timer.actionString}</pre>
  {/if}
</section>

<section>
  <h2>Steps</h2>
  <ol>
    {#each steps as step, i (i)}
      <li>
        {step.id} - {step.descr} - {step.outcome} - {step.attempts} attempt(s)
        {#if step.latencyMs !== undefined}- {step.latencyMs.toFixed(1)} ms{/if}
        {#if step.error}- {step.error}{/if}
      </li>
    {/each}
  </ol>
</section>

<section>
  <h2>Frame log</h2>
  <ol>
    {#each log as line, i (i)}<li>{line}</li>{/each}
  </ol>
</section>
