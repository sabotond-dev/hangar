<!--
  The header's connection control: one control that reads the session in nine
  states (06-UI-SPEC, The nine slot states; Y-02, Y-03, Y-10, Y-18, Y-19,
  Y-22). Re-skinned by plan 13-11 to the PDF's bordered box and re-homed into
  the shell's header through ConnectionControl.svelte; every state and every
  rule below is Phase 6's. The WORDS are D-23's (13-18): the label is the
  PDF's `Connect ZONA` wherever a click connects, section 9's `Preview only`
  on the three summaries with no device (Phase 10's `NO ZONA` and its hover
  swap are retired - a control announces what it does, or the state it is
  in, never what it is not), and S4 reads the PDF's `ZONA connected` with
  the identity moved into Device actions, as 13-11 said it would.

  ONE RULE PRODUCES THE CONTRACT. The slot is a plain BUTTON whenever a click
  does something - S1, S2, S6 and S7 all connect - and a SUMMARY (a button
  that carries aria-expanded and toggles the disclosure) whenever it does not
  - S0a, S0b, S4, S5. S3 is disabled and busy. A control that both acts and
  expands announces a lie in one of its two jobs, so the two are never the
  same element in the same state, and the copy for the acting states lives
  inline rather than behind a summary the state cannot open. aria-expanded
  therefore appears in EXACTLY the four summary states, derived from the
  closed list EXPANDS below and from nothing else. Everything else the slot
  renders is decided by slotStateOf(phase): this file holds no list of
  session phases of its own, not even for `starting`, so the table
  session-copy.spec.ts tests is the only table.

  THE TWO 14px LINE BOXES. The caption and the label each sit in a 14px FIXED
  line box (Y-10) where everything else on the site keeps the type role's 1.2
  ratio. 1.2 at 12px computes to 14.4px, which gives 28.8px for two lines and a
  half-pixel asymmetry inside a 44px box that shifts by state - and THE HEADER
  ROW'S HEIGHT MUST NOT DEPEND ON WHICH SESSION STATE IS SHOWING. Two 14px
  boxes are 28px, centred in the 44px interactive floor, with the 8px dot
  (DeviceMark) 10px to their left: the box is 44px in every one of the nine
  states, so no transition moves the page. The PDF measures the box at 37px;
  the 44px floor is the site's rule on every control (section 14's target,
  device-ui.spec.ts test 3) and wins by 7px, recorded in 13-11's summary.

  THE ACCESSIBLE NAME IS THE LABEL, NEVER THE CAPTION. The caption line is
  aria-hidden and reaches the control through aria-describedby on a
  visually-hidden twin, so a speech-input user says what the button DOES
  rather than what it is not (WCAG 2.5.3). S1's describedby twin carries
  HIDDEN_NAME_IDLE - section 16's Disconnected line, the one fact the label
  alone does not say. S4's carries identityDescription(...): the firmware,
  the page as the visitor reads it, and that a click opens Device actions.

  S6 ACTS, IT DOES NOT EXPAND. A failure raised by the visitor's own header
  click puts its recovery in front of them because THE ARRIVING FAILURE OPENS
  THE DISCLOSURE, not because the button gained a second role: CONN-04's
  six-step recovery is worthless behind a second click. So S6 is a plain
  button with no aria-expanded, `armed` below remembers that the click was
  made here, and the effect opens the disclosure when S6 arrives while it is
  set, moving focus into the recovery (DeviceDetails.svelte).

  THE DISCLOSURE'S OPEN STATE LIVES IN device-drawer.svelte.ts SINCE 13-11.
  Phase 6 kept `open` here and mounted DeviceDetails beneath this button,
  anchored to the header's corner. The Bible puts the disclosure's content in
  the footer as `Device actions` (section 9; PDF pages 2-5), so the panel is
  now mounted ONCE, by DeviceActions.svelte, and has TWO openers - this
  summary and the footer's label - which cannot share a local. The closing
  rules are still written HERE and nowhere else: a transition into a state
  with no disclosure closes it, and a panel taking the prose closes it
  (Y-11). The summary names the panel in aria-controls; DeviceDetails uses the
  same attribute to tell an opener's click from a click outside.

  THE IDENTITY IS IN THE DISCLOSURE, NOT THE LABEL (13-18, D-23; 13-11 named
  the move). Phase 6's S4 label carried the firmware, the page and a
  multi-module tail that collapsed below 1024px in CSS (D-08, Y-19); the PDF
  draws `ZONA connected` and nothing else in the box, and Device actions
  already renders identitySentence and multiModuleLine at every width. This
  component reads no viewport width and registers no listener.

  WHY data-hydrated EXISTS. slotStateOf maps `starting` to S1, so a
  prerendered document already carries a rendered slot, and a browser test
  that waits only on markup - "the slot exists", "the note is absent" - can be
  answered before a single line of JavaScript has run and before any
  capability has been read. This slot sets data-hydrated="true" from onMount
  and NOWHERE else; it is not a style hook and no component reads it. It
  exists so plans 06-11 and 06-13 can wait for a state a prerendered document
  CANNOT satisfy, then for the settled caption. A later reader who moves the
  assignment to module scope, or copies the attribute onto the markup
  unconditionally, silently makes both of those waits satisfiable by a
  document that has not read the capability.

  Every string comes from session-copy; none is retyped here. The two static
  device specifiers below are the chunk guard's permitted paths
  (config-shape.spec.ts test 13): the session and its import-free copy module
  are free of the protocol package, which is what lets a header component name
  them on the first paint of /. The drawer module is a sibling under
  src/lib/ui/ and imports nothing.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { session } from "$lib/device/session.svelte";
  import {
    CAPTION_DETECTED,
    CAPTION_FAILED,
    CAPTION_INSECURE,
    CAPTION_UNPLUGGED,
    CAPTION_UNSUPPORTED,
    CONNECTED_LABEL,
    CONNECTING_LABEL,
    CONNECT_LABEL,
    HIDDEN_NAME_IDLE,
    PREVIEW_ONLY_LABEL,
    type SlotState,
    identityDescription,
    slotStateOf,
  } from "$lib/device/session-copy";
  import { PANEL_ID, drawer } from "./device-drawer.svelte";
  import DeviceMark from "./DeviceMark.svelte";

  let {
    panelOwnsProse = false,
  }: {
    /** True exactly when a chosen panel is open and rendering the session's prose
        (Y-11). The disclosure NEVER opens while it is true, and closes itself if
        it is already open when it becomes true. False on every route since
        13-09, where the workspace's panel is always on the page. */
    panelOwnsProse?: boolean;
  } = $props();

  /** A unique id for the describedby twin, so two mounts cannot collide. */
  const uid = $props.id();
  const descId = `${uid}-desc`;

  /**
   * The hydration marker. Set true ONLY here, from onMount, and read only by
   * the attribute below - see the header for why. A prerendered document
   * carries the slot without it; the running page has it.
   */
  let hydrated = $state(false);
  onMount(() => {
    hydrated = true;
  });

  /** The button itself, registered as the element focus returns to when the
      disclosure closes with nothing else focused - the S6 road, where S3's
      `disabled` has just blurred this control (DeviceDetails, `opener`). */
  let control = $state<HTMLButtonElement | null>(null);

  /** aria-expanded appears in EXACTLY these four states, and derives from this
      list alone: the four in which the slot is a summary rather than an action. */
  const EXPANDS: readonly SlotState[] = ["S0a", "S0b", "S4", "S5"];

  /** The five states that have a disclosure at all: the four summaries, plus
      S6, whose disclosure is opened by the failure rather than by the button. */
  const DISCLOSES: readonly SlotState[] = [...EXPANDS, "S6"];

  const slot = $derived(slotStateOf(session.phase));
  const isSummary = $derived(EXPANDS.includes(slot));
  const isBusy = $derived(slot === "S3");

  /**
   * True from a connecting click made HERE until the attempt settles. Read by
   * the effect below, which opens the disclosure only for a failure this
   * slot's own click produced. Deliberately not reactive: the effect already
   * re-runs on the slot state, and the flag is a fact about the last click,
   * not a value anything renders.
   */
  let armed = false;

  $effect(() => {
    // A transition into a state with no disclosure closes it - S1, S2 and S7
    // by the spec's table, and S3 because it is only ever reached from a
    // click, and a disclosure that survived S3 would pop open on the
    // connected identity unasked. A panel taking the prose closes it too
    // (Y-11).
    if (panelOwnsProse || !DISCLOSES.includes(slot)) drawer.open = false;
    // The arriving failure opens the disclosure, and only for a header click.
    if (slot === "S6" && armed && !panelOwnsProse) {
      drawer.opener = control;
      drawer.open = true;
    }
    if (slot !== "S3") armed = false;
  });

  const markShape = $derived.by(() => {
    switch (slot) {
      case "S2":
        return "detected" as const;
      case "S3":
        return "connecting" as const;
      case "S4":
        return "connected" as const;
      default:
        return "dark" as const;
    }
  });

  /** One line of text in every state since 13-18; kept as a data attribute for the tests that read it. */
  const labelKind = "text" as const;

  /** The verb where a click connects (S1, S2, S6, S7); the state where it does not (S0a, S0b, S5 - the summaries with no device); the identity in S4. */
  const labelText = $derived.by(() => {
    switch (slot) {
      case "S3":
        return CONNECTING_LABEL;
      case "S4":
        return CONNECTED_LABEL;
      case "S0a":
      case "S0b":
      case "S5":
        return PREVIEW_ONLY_LABEL;
      default:
        return CONNECT_LABEL; // S1, S2, S6, S7
    }
  });

  /** dim on the two terminal capability states, ink on the connected identity, quiet otherwise. */
  const labelTone = $derived.by(() => {
    if (slot === "S0a" || slot === "S0b") return "dim" as const;
    if (slot === "S4") return "ink" as const;
    return "quiet" as const;
  });

  const caption = $derived.by(() => {
    switch (slot) {
      case "S0a":
        return CAPTION_UNSUPPORTED;
      case "S0b":
        return CAPTION_INSECURE;
      case "S2":
        return CAPTION_DETECTED;
      case "S5":
        return CAPTION_UNPLUGGED;
      case "S6":
        return CAPTION_FAILED;
      default:
        return "";
    }
  });

  const identity = $derived(session.identity);

  /** The describedby twin's text: HIDDEN_NAME_IDLE where no ZONA is connected
      and the label alone cannot say so, the identity description while
      connected, the caption otherwise. */
  const description = $derived.by(() => {
    if (slot === "S1" || slot === "S7") return HIDDEN_NAME_IDLE;
    if (slot === "S4" && identity) {
      return identityDescription(identity.zona.firmware, identity.activePage);
    }
    return caption;
  });

  function handleClick(): void {
    if (isBusy) return;
    if (isSummary) {
      // Refuses to open while a panel owns the prose - one of the two guards
      // on that signal; DeviceDetails is the other.
      drawer.opener = control;
      drawer.open = !drawer.open && !panelOwnsProse;
      return;
    }
    armed = true;
    // Nothing awaited in front of connect(): the session's requestPort() has
    // to run inside the click's activation window. See session.svelte.ts.
    session.connect();
  }
</script>

<button
  class="device-slot"
  type="button"
  data-testid="device-slot"
  data-slot={slot}
  data-hydrated={hydrated ? "true" : undefined}
  aria-describedby={descId}
  aria-expanded={isSummary ? drawer.open : undefined}
  aria-controls={isSummary ? PANEL_ID : undefined}
  aria-busy={isBusy ? "true" : undefined}
  disabled={isBusy}
  bind:this={control}
  onclick={handleClick}
>
  <DeviceMark shape={markShape} />
  <span class="lines">
    <span class="caption" data-testid="device-slot-caption" aria-hidden="true"
      >{caption}</span
    >
    <span
      class="label"
      data-testid="device-slot-label"
      data-kind={labelKind}
      data-tone={labelTone}
    >
      {labelText}
    </span>
  </span>
</button>
<span id={descId} class="sr-only">{description}</span>

<style>
  /*
    THE PDF'S BOX (pages 2-5, x 1260 to 1478): a 1px boundary on the
    workspace ground, the dot at the left, the words beside it. 44px on both
    axes is the touch floor and the height in every one of the nine states:
    the dot is 8px and the two 14px lines are 28px, so the content never
    exceeds the floor and nothing about the state can move the header. The
    boundary token is the control's border (section 12; identity.spec.ts
    test 5 forbids the divider here). No corner (D-01).
  */
  .device-slot {
    appearance: none;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 10px;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding: 0 16px;
    border: 1px solid var(--color-boundary);
    background: var(--color-workspace);
    font-family: var(--font-sans);
    color: var(--color-ink);
    text-align: start;
    cursor: pointer;
    transition: border-color 160ms ease-out;
  }

  .device-slot:hover:not(:disabled),
  .device-slot[aria-expanded="true"] {
    border-color: var(--color-ink);
  }

  .device-slot:disabled {
    cursor: default;
  }

  /* Two stacked lines, each in a 14px fixed box (Y-10). */
  .lines {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /*
    The caption: sentence case, the quiet ink, nearly no tracking - and ONE
    LINE, because its line box is a fixed 14px (Y-10) and a caption that
    wrapped inside it would stack two lines into one box and push the label
    to the floor. That happened once: 13.1-05 put the user's Clear box 12px
    to this control's left, and at 375 on the intro and at 768 on the app
    pages the zone was 9 to 23px short for the pair, so WebKit shrank this
    control and wrapped `Not in this browser` under the label (measured on
    the served build). The label already declared nowrap; the caption now
    does too, and where the zone is short the pair overflows it toward the
    gap beside it rather than folding.
  */
  .caption {
    line-height: 14px;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.01em;
    white-space: nowrap;
    color: var(--color-ink-quiet);
    transition: opacity 160ms ease-out;
  }

  /* The label: sentence case since 13-18 (D-05, D-23) - the PDF's box reads
     `Connect ZONA` and `ZONA connected` as words, not as a shouted label -
     at the weight and size Phase 6 gave the connected identity, which was
     the one sentence-case line the box already had (Y-18). */
  .label {
    line-height: 14px;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.01em;
    white-space: nowrap;
    color: var(--color-ink-quiet);
    transition:
      color 160ms ease-out,
      opacity 160ms ease-out;
  }

  .label[data-tone="dim"] {
    color: var(--color-ink-quiet);
  }

  .label[data-tone="ink"] {
    color: var(--color-ink);
  }

  @media (prefers-reduced-motion: reduce) {
    .device-slot,
    .caption,
    .label {
      transition: none;
    }
  }
</style>
