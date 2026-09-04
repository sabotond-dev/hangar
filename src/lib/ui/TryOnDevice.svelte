<!--
  TRY ON DEVICE: the one surface on the front door that touches hardware.

  It opens a port, listens until the module names itself, and stops. It cannot
  write. That is not a promise about intent, it is a property of the file: the
  symbols that would be needed to send anything - RequestQueue, hostHeartbeat,
  sendConfig, storePage - appear nowhere below this comment, and neither does
  any call to the transport's write method. Plan 04-04's src/lib/device/try-on.ts
  is the whole device path and its spec asserts the same absence twice, once
  dynamically against a transport that records every byte and once by reading
  its source (D-13, D-22).

  Nothing here compiles, costs or measures a configuration either: padReady and
  initLuaFormatter belong to Phase 5, where the first character budget is asked
  for. Loading a 628 KB WebAssembly formatter behind a button that never needs
  it would be waste, and holding it up in the click handler would burn the
  transient activation the port chooser depends on.

  THE ORDERING RULE. The chooser call is the first statement in the handler,
  with nothing held up in front of it. Transient user activation expires - about
  4.9 s in current engines - rather than being consumed, so a module fetched
  inside the handler makes the picker reject with something that reads to a
  visitor as a permissions bug. Every module the handler needs therefore arrives
  in onMount, dynamically, which also keeps the prerenderer from pulling a Web
  Serial reference into the server graph. src/routes/dev/skeleton/+page.svelte's
  connect() is the proven shape and this is a copy of it.

  DEGR-02. On a browser that cannot talk to hardware the control is present and
  really `disabled`, with the reason rendered in the panel beneath it - never
  aria-disabled alone, and never hidden, because a visitor who cannot install
  deserves to be told which browsers can rather than to see nothing at all. The
  reason is Phase 2's failureCopy, which names three browsers and no engine.

  The layout around all of this belongs to ChosenPanel.svelte. This component
  owns regions 1 to 3 of D-08's order and the state machine behind them.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import PadSpinner from "./PadSpinner.svelte";

  // Type-only references, so no static specifier here names a module that
  // touches a port. The three surfaces arrive through dynamic import() below.
  type Protocol = typeof import("$lib/protocol");
  type Transport = typeof import("$lib/transport");
  type Device = typeof import("$lib/device/try-on");
  type TryOnState = import("$lib/device/try-on").TryOnState;
  type FailureCopy = import("$lib/transport").FailureCopy;
  type Identity = import("$lib/transport").Identity;
  type GridTransport = import("$lib/transport").GridTransport;

  let {
    entry,
  }: {
    /**
     * The chosen configuration. Nothing on the device path reads it in this
     * phase - identification is about the module, not the pad - but it is
     * published as data-entry so that a step while chosen can be seen to
     * re-fill the panel WITHOUT resetting the connect state: the port belongs
     * to the session, not to the configuration (04-UI-SPEC W-20).
     */
    entry: FrontDoorEntry;
  } = $props();

  // ---------------------------------------------------------------------------
  // Copy. Every visitor-facing string is a const here rather than markup text,
  // because Prettier reflows element text and Phase 2 already lost a
  // load-bearing sentence to a line break that way (02-05-SUMMARY.md). Several
  // of these are asserted character for character.

  /**
   * The label before the device module has arrived. Once it has, the button
   * reads TRY_ON_LABEL from src/lib/device/try-on.ts, which is the single
   * definition the failure copy is also interpolated with - so the button and
   * the sentences that tell a visitor to click it cannot drift apart.
   */
  const PRIMARY = "TRY ON DEVICE";
  const CONNECTING = "CONNECTING…";
  // One literal, never a concatenation: the e2e suite and the acceptance
  // probe both look for this sentence whole, in the source and on the screen.
  const HONESTY =
    "Connects to your ZONA and identifies it. Writing arrives in the next release — this never writes.";
  const IDENTIFIED_REASON = "Your ZONA is already identified.";
  const DISCONNECT = "DISCONNECT ZONA";

  const STATUS_CHOOSING = "Pick the ZONA in the browser’s list.";
  const STATUS_OPENING = "Opening the port…";
  const STATUS_IDENTIFYING = "Listening for the module…";

  const IDENTIFIED_CAPTION = "ZONA IDENTIFIED";
  const identifiedBody = (id: Identity): string =>
    `Firmware ${id.zona.firmware.major}.${id.zona.firmware.minor}.` +
    `${id.zona.firmware.patch}, active page ${id.activePage}. Nothing was ` +
    "written, and nothing will be until install ships in the next release.";

  const NOT_ZONA_TITLE = "That module is not a ZONA";
  const notZonaBody = (type: string | undefined): string =>
    `It reported itself as ${type ?? "an unknown module"}. HANGAR only ` +
    "speaks to a ZONA, so nothing was sent.";
  const NOT_ZONA_STEPS = ["Disconnect", "Plug in a ZONA and try again"];

  const SILENT_TITLE = "Nothing answered on that port";
  const silentBody = (seconds: number): string =>
    `The port opened, but no Grid module reported itself within ${seconds} ` +
    "seconds. That usually means the port belongs to something else on your " +
    "machine.";
  const SILENT_STEPS = [
    "Unplug the ZONA and plug it back in",
    "Click TRY ON DEVICE again and pick a different port",
  ];

  const UNPLUGGED_AFTER = "The ZONA was unplugged. Nothing was written.";

  // ---------------------------------------------------------------------------
  // State.

  let P: Protocol | undefined = $state(undefined);
  let T: Transport | undefined = $state(undefined);
  let D: Device | undefined = $state(undefined);

  /**
   * UI-SPEC Screen 4s state machine, and it is called phase rather than state
   * for a compiler reason, not a stylistic one: a top-level variable named
   * state makes svelte2tsx read every $state(...) rune call in the file as a
   * store subscription on it, and svelte-check then reports eleven errors
   * about a missing subscribe method.
   *
   * undefined until onMount has resolved the capability.
   */
  let phase: TryOnState | undefined = $state(undefined);
  let failure: FailureCopy | null = $state(null);
  let identity: Identity | null = $state(null);
  let moduleType: string | undefined = $state(undefined);

  // Plain locals: none of these is rendered, so none needs to be reactive, and
  // an open transport must never be wrapped in a deep proxy.
  let grid: GridTransport | undefined;
  let detachHide: (() => void) | undefined;
  let capable = false;
  let mounted = false;

  /**
   * Both of these read a module through a helper rather than inline, and that
   * is a type-checking necessity rather than taste: at this point in the file
   * TypeScript has seen P, T and D assigned only undefined - they are filled
   * inside an async callback further down - so it narrows them to undefined
   * here and the other arm of the expression becomes never. A parameter is
   * not narrowed by the outer control flow, so the declared union survives.
   */
  const labelOf = (d: Device | undefined): string => d?.TRY_ON_LABEL ?? PRIMARY;
  const secondsOf = (p: Protocol | undefined): number =>
    p ? p.IDENTIFY_WINDOW_MS / 1000 : 0;

  const primaryLabel = $derived(labelOf(D));
  const connecting = $derived(
    phase === "choosing" || phase === "opening" || phase === "identifying",
  );
  const windowSeconds = $derived(secondsOf(P));
  /**
   * Disabled in every state where a click would be meaningless: before the
   * modules land, while a connection is in flight, once the module is already
   * identified, and on a browser that cannot do it at all. Each of those
   * renders a reason in the panel; none of them is aria-disabled alone.
   */
  const disabled = $derived(
    phase === undefined ||
      connecting ||
      phase === "identified" ||
      phase === "unsupported" ||
      phase === "insecure",
  );

  // ---------------------------------------------------------------------------
  // Mount: dynamic imports, then the capability.

  onMount(() => {
    mounted = true;
    void (async () => {
      const [protocol, transport, device] = await Promise.all([
        import("$lib/protocol"),
        import("$lib/transport"),
        import("$lib/device/try-on"),
      ]);
      if (!mounted) return;
      P = protocol;
      T = transport;
      D = device;

      // A capability test over an explicit environment record, never a browser
      // test: CONN-01, and the reason no string below names an engine.
      const capability = device.capabilityOf({
        hasSerial: "serial" in navigator,
        secure: isSecureContext,
      });
      if (capability === "unsupported") {
        failure = transport.failureCopy(
          "no-web-serial",
          undefined,
          device.TRY_ON_LABEL,
        );
        phase = "unsupported";
      } else if (capability === "insecure") {
        failure = transport.failureCopy(
          "insecure-context",
          undefined,
          device.TRY_ON_LABEL,
        );
        phase = "insecure";
      } else {
        capable = true;
        phase = "idle";
      }
    })();
  });

  onDestroy(() => {
    // The house guard: onDestroy runs on the server immediately after
    // rendering, where there is no port and no window (04-07-SUMMARY).
    if (!mounted) return;
    mounted = false;
    // A visitor who navigates away must not leave the port held away from Grid
    // Editor. This is the backstop under release(); both are idempotent.
    void closePort();
  });

  // ---------------------------------------------------------------------------
  // The port's lifetime. The transport is closed here and nowhere else.

  async function closePort(): Promise<void> {
    const open = grid;
    grid = undefined;
    detachHide?.();
    detachHide = undefined;
    if (open) await open.close().catch(() => undefined);
  }

  /**
   * Called by the row on every un-choose path (Escape, the browser Back button,
   * a click on a dimmed side pad, a step past the chosen entry). A visitor who
   * closes the panel is not still holding the port away from Grid Editor.
   * Idempotent, and safe to call when nothing was ever opened.
   */
  export async function release(): Promise<void> {
    await closePort();
    failure = capable ? null : failure;
    identity = null;
    moduleType = undefined;
    if (capable) phase = "idle";
  }

  async function disconnect(): Promise<void> {
    await closePort();
    identity = null;
    phase = "idle";
  }

  function refuse(err: unknown, port?: SerialPort): void {
    const surface = T!;
    const kind = surface.classifyOpenError(err, port);
    // The label is the THIRD argument, after raw. Passing it second would put
    // it in raw's place and surface the button's name inside the unknown
    // failure's detail (04-04-SUMMARY).
    failure = surface.failureCopy(
      kind,
      err instanceof Error ? err.message : String(err),
      D!.TRY_ON_LABEL,
    );
    phase = "failed";
  }

  // ---------------------------------------------------------------------------
  // The handler.

  async function tryOnDevice(): Promise<void> {
    // FIRST statement, with nothing in front of it. Transient user activation
    // EXPIRES (about 4.9 s in current engines) rather than being consumed, so
    // anything resolved ahead of this call makes the picker reject for a
    // reason that reads as a permissions bug. Every module this handler needs
    // was fetched in onMount for exactly that reason.
    const picking = navigator.serial.requestPort({ filters: [P!.ZONA_USB] });
    failure = null;
    phase = "choosing";

    const picked = await picking.catch((err: unknown) => {
      // A closed chooser is a NotFoundError, not a fault, and the copy says so.
      refuse(err);
      return undefined;
    });
    if (!picked) return;

    phase = "opening";
    try {
      await picked.open({
        baudRate: P!.BAUD_RATE,
        bufferSize: P!.READ_BUFFER_SIZE,
      });
    } catch (err) {
      refuse(err, picked);
      return;
    }

    const open = new T!.WebSerialTransport(picked);
    grid = open;
    detachHide = open.closeOnHide();
    open.onClose(() => {
      // The module left the cable. Only meaningful once it had named itself;
      // every other state already has its own sentence on screen.
      if (phase === "identified") phase = "unplugged-after";
      grid = undefined;
      detachHide?.();
      detachHide = undefined;
      identity = null;
    });

    phase = "identifying";
    const result = await D!.identifyOnly(open);
    if (result.kind === "identified") {
      identity = result.identity;
      phase = "identified";
      return;
    }

    // Both remaining outcomes put the button back within reach, and both sets
    // of steps tell the visitor to try again - which a port this page is still
    // holding would make impossible. identifyOnly deliberately never closes
    // what it did not open, so the close belongs here.
    if (result.kind === "not-zona") {
      moduleType = result.moduleType;
      phase = "not-zona";
    } else {
      phase = "silent";
    }
    await closePort();
  }
</script>

<div class="try-on" data-entry={entry.id}>
  <button
    class="primary"
    type="button"
    data-testid="try-on-device"
    {disabled}
    aria-describedby="try-on-reason"
    onclick={tryOnDevice}
  >
    {#if connecting}<PadSpinner />{/if}
    <span class="label">{connecting ? CONNECTING : primaryLabel}</span>
  </button>

  <p class="honesty" id="try-on-reason">
    {phase === "identified" ? IDENTIFIED_REASON : HONESTY}
  </p>

  <div class="status" data-testid="connect-status" aria-live="polite">
    {#if phase === "choosing"}
      <p class="detail">{STATUS_CHOOSING}</p>
    {:else if phase === "opening"}
      <p class="detail">{STATUS_OPENING}</p>
    {:else if phase === "identifying"}
      <p class="detail">{STATUS_IDENTIFYING}</p>
    {:else if phase === "identified" && identity}
      <p class="caption">{IDENTIFIED_CAPTION}</p>
      <p class="detail">{identifiedBody(identity)}</p>
      <button
        class="disconnect"
        type="button"
        data-testid="disconnect"
        onclick={disconnect}
      >
        {DISCONNECT}
      </button>
    {:else if phase === "not-zona"}
      <p class="title">{NOT_ZONA_TITLE}</p>
      <p class="detail">{notZonaBody(moduleType)}</p>
      <ol class="steps">
        {#each NOT_ZONA_STEPS as step (step)}<li>{step}</li>{/each}
      </ol>
    {:else if phase === "silent"}
      <p class="title">{SILENT_TITLE}</p>
      <p class="detail">{silentBody(windowSeconds)}</p>
      <ol class="steps">
        {#each SILENT_STEPS as step (step)}<li>{step}</li>{/each}
      </ol>
    {:else if phase === "unplugged-after"}
      <p class="detail">{UNPLUGGED_AFTER}</p>
    {:else if failure}
      <p class="title">{failure.title}</p>
      <p class="detail">{failure.detail}</p>
      <ol class="steps">
        {#each failure.steps as step (step)}<li>{step}</li>{/each}
      </ol>
    {/if}
  </div>
</div>

<style>
  /* Micro role on an accent fill: 12px / 600 / 0.18em / uppercase, on black. */
  .primary {
    appearance: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    inline-size: 100%;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: var(--color-accent);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #000000;
    cursor: pointer;
    transition:
      filter 140ms ease-out,
      box-shadow 140ms ease-out;
  }

  .primary:hover:not(:disabled) {
    filter: brightness(1.12);
    box-shadow: 0 0 24px var(--color-glow);
  }

  .primary:active:not(:disabled) {
    filter: brightness(0.92);
  }

  /*
    Disabled is a real attribute, and it is still two colours: the fill goes to
    nothing, the border becomes the functional line, the label drops to the dim
    rung of the ladder. There is no grey here and no third hue.
  */
  .primary:disabled {
    background: transparent;
    border-color: var(--color-line);
    color: var(--color-ink-dim);
    cursor: not-allowed;
  }

  /* Body role, 8px under the button (04-UI-SPEC, Spacing, sm). */
  .honesty {
    margin: 8px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /* Empty while idle, and it takes no space then. */
  .status:not(:empty) {
    margin-block-start: 16px;
  }

  /* Micro, uppercase: a structural caption of two words. */
  .caption {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink);
  }

  /*
    Micro (title): the same size and weight, sentence case and nearly no
    tracking. Failure and state titles read as sentences, and a sentence in
    wide-tracked uppercase is shouting rather than labelling.
  */
  .title {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
    color: var(--color-ink);
  }

  /* Body role at full strength: this is what the visitor is here to read. */
  .detail {
    margin: 8px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }

  .caption + .detail,
  .title + .detail {
    margin-block-start: 8px;
  }

  .steps {
    margin: 8px 0 0;
    padding-inline-start: 24px;
    list-style: decimal;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /* A text button, deliberately quiet: it undoes, it does not act. */
  .disconnect {
    appearance: none;
    margin-block-start: 16px;
    min-block-size: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
    cursor: pointer;
  }

  .disconnect:hover {
    color: var(--color-accent);
  }
</style>
