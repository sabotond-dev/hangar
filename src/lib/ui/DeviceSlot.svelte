<!--
  The header's device slot: one control that reads the session in nine states
  (06-UI-SPEC, The nine slot states; Y-02, Y-03, Y-10, Y-18, Y-19, Y-22).

  ONE RULE PRODUCES THE CONTRACT. The slot is a plain BUTTON whenever a click
  does something - S1, S2, S6 and S7 all connect - and a SUMMARY (a button
  that carries aria-expanded and toggles the drawer) whenever it does not -
  S0a, S0b, S4, S5. S3 is disabled and busy. A control that both acts and
  expands announces a lie in one of its two jobs, so the two are never the
  same element in the same state, and the copy for the acting states lives
  inline in the header note (DeviceNote.svelte) rather than behind a summary
  the state cannot open. aria-expanded therefore appears in EXACTLY the four
  summary states, derived from the closed list EXPANDS below and from nothing
  else. Everything else the slot renders is decided by slotStateOf(phase):
  this file holds no list of session phases of its own, not even for
  `starting`, so the table session-copy.spec.ts tests is the only table.

  THE TWO 14px LINE BOXES. The caption and the label each sit in a 14px FIXED
  line box (Y-10) where everything else on the site keeps the type role's 1.2
  ratio. 1.2 at 12px computes to 14.4px, which gives 28.8px for two lines and a
  half-pixel asymmetry inside a 44px box that shifts by state - and THE HEADER
  ROW'S HEIGHT MUST NOT DEPEND ON WHICH SESSION STATE IS SHOWING. Two 14px
  boxes are 28px, centred in the 44px interactive floor, with the 24px
  DeviceMark 8px to their left: the box is 44px in every one of the nine
  states, so no transition moves the page.

  THE ACCESSIBLE NAME IS THE LABEL, NEVER THE CAPTION. The caption line is
  aria-hidden and reaches the control through aria-describedby on a
  visually-hidden twin, so a speech-input user says what the button DOES
  rather than what it is not (WCAG 2.5.3). In S1 the label swaps NO ZONA to
  CONNECT ZONA on hover, but the accessible name is CONNECT ZONA in both
  forms: the CONNECT ZONA span hides by OPACITY, which leaves it in the
  accessibility tree, and the resting NO ZONA is aria-hidden. S1's describedby
  twin carries HIDDEN_NAME_IDLE - the one fact the label alone cannot convey
  once it has swapped to its hovered form. The S4 identity wraps its middle
  dots in aria-hidden spans, so the name is the words in order and never three
  "middle dot"s, and its describedby twin carries identityDescription(...).

  S6 ACTS, IT DOES NOT EXPAND. A failure raised by the visitor's own header
  click puts its recovery in front of them because THE ARRIVING FAILURE OPENS
  THE DISCLOSURE, not because the button gained a second role: CONN-04's
  six-step recovery is worthless behind a second click. So S6 is a plain
  button with no aria-expanded, `armed` below remembers that the click was
  made here, and the effect opens the drawer when S6 arrives while it is set.
  A failure raised from the chosen panel's own control is not armed and opens
  nothing here - the panel renders the block itself (Y-11).

  THE MULTI-MODULE TAIL COLLAPSES IN CSS, NOT IN JAVASCRIPT (D-08, Y-19). When
  the identity carries other modules the S4 label ends with a trailing span
  built from moduleTail(...); it is hidden below 1024px by a media query on
  that span and by nothing else. Three reasons. A width read in script is
  wrong on the first paint of a prerendered page and would make the label
  jump; a resize listener is state that has to be torn down and one more thing
  to leak; and CSS already does this at the compositor with no frame of its
  own. The tail's content is ALSO in the disclosure at every width
  (multiModuleLine), so nothing is lost below 1024px - the tail is the least
  time-critical part of the identity and the disclosure is one click away.
  This component reads no viewport width and registers no listener.

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

  THE SLOT OWNS THE DRAWER'S OPEN STATE. `open` lives here and DeviceDetails
  renders it, so there is one source of truth for "is the drawer open".
  `panelOwnsProse` is threaded straight through and used for exactly one
  thing: the drawer is never opened while it is true, and closes if it is open
  when it becomes true. That is the same signal DeviceNote takes, from the
  same per-route expression, so the note and the drawer cannot disagree about
  whether a panel is open.

  Every string comes from session-copy; none is retyped here. The two static
  specifiers below are the chunk guard's permitted paths
  (config-shape.spec.ts test 13): the session and its import-free copy module
  are free of the protocol package, which is what lets a header component name
  them on the first paint of /.

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
    CONNECTING_LABEL,
    CONNECT_LABEL,
    HIDDEN_NAME_IDLE,
    NO_ZONA_LABEL,
    type SlotState,
    firmwareText,
    identityDescription,
    moduleTail,
    slotStateOf,
  } from "$lib/device/session-copy";
  import DeviceMark from "./DeviceMark.svelte";

  let {
    covered = false,
    panelOwnsProse = false,
  }: {
    /** True while the splash covers the header row on `/`. Carries the wordmark's
        `.covered` treatment verbatim - the same value DeviceNote takes, from the
        same place, so the two cannot rise at different times. False everywhere
        else; there is no splash on `/c/{id}/` or `/browse/`. */
    covered?: boolean;
    /** True exactly when a chosen panel is open and rendering the session's prose
        (Y-11). The disclosure NEVER opens while it is true, and closes itself if
        it is already open when it becomes true. Passed straight through to
        DeviceDetails and used nowhere else in this component. */
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

  /** The drawer's open state. Owned here; DeviceDetails is its only renderer. */
  let open = $state(false);

  /** aria-expanded appears in EXACTLY these four states, and derives from this
      list alone: the four in which the slot is a summary rather than an action. */
  const EXPANDS: readonly SlotState[] = ["S0a", "S0b", "S4", "S5"];

  /** The five states that have a disclosure at all: the four summaries, plus
      S6, whose drawer is opened by the failure rather than by the button. */
  const DISCLOSES: readonly SlotState[] = [...EXPANDS, "S6"];

  const slot = $derived(slotStateOf(session.phase));
  const isSummary = $derived(EXPANDS.includes(slot));
  const isBusy = $derived(slot === "S3");

  /**
   * True from a connecting click made HERE until the attempt settles. Read by
   * the effect below, which opens the drawer only for a failure this slot's
   * own click produced. Deliberately not reactive: the effect already re-runs
   * on the slot state, and the flag is a fact about the last click, not a
   * value anything renders.
   */
  let armed = false;

  $effect(() => {
    // A transition into a state with no disclosure closes it - S1, S2 and S7
    // by the spec's table, and S3 because it is only ever reached from a
    // click, and a drawer that survived S3 would pop open on the connected
    // identity unasked. A panel taking the prose closes it too (Y-11).
    if (panelOwnsProse || !DISCLOSES.includes(slot)) open = false;
    // The arriving failure opens the drawer, and only for a header click.
    if (slot === "S6" && armed && !panelOwnsProse) open = true;
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

  /** How the label renders: the S1 hover swap, the S4 identity, or one line of text. */
  const labelKind = $derived.by(() => {
    if (slot === "S1") return "swap" as const;
    if (slot === "S4") return "identity" as const;
    return "text" as const;
  });

  const labelText = $derived.by(() => {
    switch (slot) {
      case "S3":
        return CONNECTING_LABEL;
      case "S2":
      case "S6":
      case "S7":
        return CONNECT_LABEL;
      default:
        return NO_ZONA_LABEL; // S0a, S0b, S5
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
  const fw = $derived(identity ? firmwareText(identity.zona.firmware) : "");
  const page = $derived(identity ? identity.activePage : 0);
  /** The other modules' names, in the session's order; a module that named no type reads as unknown. */
  const tail = $derived(
    identity
      ? moduleTail(identity.otherModules.map((m) => m.moduleType ?? "unknown"))
      : undefined,
  );

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
      open = !open && !panelOwnsProse;
      return;
    }
    armed = true;
    // Nothing awaited in front of connect(): the session's requestPort() has
    // to run inside the click's activation window. See session.svelte.ts.
    session.connect();
  }
</script>

<div class="device-chrome">
  <button
    class="device-slot"
    class:covered
    type="button"
    data-testid="device-slot"
    data-slot={slot}
    data-hydrated={hydrated ? "true" : undefined}
    aria-describedby={descId}
    aria-expanded={isSummary ? open : undefined}
    aria-busy={isBusy ? "true" : undefined}
    disabled={isBusy}
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
        {#if labelKind === "swap"}
          <span class="swap">
            <span class="rest" aria-hidden="true">{NO_ZONA_LABEL}</span>
            <span class="hover">{CONNECT_LABEL}</span>
          </span>
        {:else if labelKind === "identity"}
          <!-- The spaces are non-breaking entities, not source whitespace:
               Svelte trims whitespace that touches an element boundary, so a
               plain space between these spans would vanish and leave
               "ZONA·fw...". The middle dots are bare "·" in aria-hidden spans
               and every space the eye and the accessible name need lives in a
               word span, so with the dots removed the name is
               "ZONA fw {fw} page {page}" and never a run of "middle dot"s. A
               {" "} would do the same but the lint rule bans it. -->
          <span class="word">ZONA&nbsp;</span><span
            class="sep"
            aria-hidden="true">·</span
          ><span class="word">&nbsp;fw&nbsp;</span><span class="mono">{fw}</span
          ><span class="word">&nbsp;</span><span class="sep" aria-hidden="true"
            >·</span
          ><span class="word">&nbsp;page&nbsp;</span><span class="mono"
            >{page}</span
          >{#if tail}<span class="tail"
              ><span class="word">&nbsp;</span><span
                class="sep"
                aria-hidden="true">·</span
              ><span class="word">&nbsp;</span>{tail}</span
            >{/if}
        {:else}
          {labelText}
        {/if}
      </span>
    </span>
  </button>
  <span id={descId} class="sr-only">{description}</span>
</div>

<style>
  /*
    The chrome wraps the button and the drawer, so the drawer's click-outside
    boundary is the whole device chrome rather than the button alone - a click
    on the control is the toggle's business, never a close followed by a
    reopen. position: relative anchors the non-modal drawer to it.
  */
  .device-chrome {
    position: relative;
    display: inline-flex;
  }

  /*
    The 44px interactive box: the touch floor on both axes, whatever the state.
    The mark is 24px and the two 14px lines are 28px, so the content never
    exceeds the floor and the box is 44px in every one of the nine states.
  */
  .device-slot {
    --slot-arrive-ms: var(--arrive-ms, 700ms);
    appearance: none;
    display: flex;
    align-items: center;
    gap: 8px;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    font-family: inherit;
    color: inherit;
    text-align: start;
    cursor: pointer;
    transition: opacity var(--slot-arrive-ms) cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  .device-slot:disabled {
    cursor: default;
  }

  /*
    The splash treatment, verbatim from the wordmark: invisible on the very
    first painted frame rather than faded out of one, and not transitioned into
    that state. On / only; false everywhere else.
  */
  .device-slot.covered {
    opacity: 0;
    transition: none;
  }

  /* Two stacked lines, each in a 14px fixed box (Y-10). */
  .lines {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* Micro (title): sentence case, nearly no tracking. */
  .caption {
    line-height: 14px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--color-ink-quiet);
    transition: opacity 160ms ease-out;
  }

  /* Micro (label): wide-tracked uppercase, the site's control-label form. */
  .label {
    line-height: 14px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--color-ink-quiet);
    transition:
      color 160ms ease-out,
      opacity 160ms ease-out;
  }

  /* The connected identity is Micro (title), not a shouted label (Y-18). */
  .label[data-kind="identity"] {
    letter-spacing: 0.01em;
    text-transform: none;
  }

  .label[data-tone="dim"] {
    color: var(--color-ink-dim);
  }

  .label[data-tone="ink"] {
    color: var(--color-ink);
  }

  /*
    The S1 label swap, sized by a twin so the box never changes width. Both
    labels occupy one grid cell, so the cell is always as wide as CONNECT ZONA
    - the longer of the two - and the hover swap moves opacity and colour
    only, never height and never width. The CONNECT ZONA span hides by OPACITY
    rather than visibility so it stays in the accessibility tree and is the
    accessible name in both forms; the resting NO ZONA is aria-hidden.
  */
  .swap {
    display: grid;
  }

  .swap > .rest,
  .swap > .hover {
    grid-area: 1 / 1;
    transition:
      color 160ms ease-out,
      opacity 160ms ease-out;
  }

  .swap > .rest {
    opacity: 1;
    color: var(--color-ink-quiet);
  }

  .swap > .hover {
    opacity: 0;
    color: var(--color-ink);
  }

  .device-slot:hover .swap > .rest,
  .device-slot:focus-visible .swap > .rest,
  .device-slot:active .swap > .rest {
    opacity: 0;
  }

  .device-slot:hover .swap > .hover,
  .device-slot:focus-visible .swap > .hover,
  .device-slot:active .swap > .hover {
    opacity: 1;
  }

  /*
    The numeric runs only (Y-18): monospace, weight 400, tabular figures, so the
    page digit does not jitter as the module reports it at 4 Hz. The words ZONA,
    fw, page and the middle-dot separators stay Quicksand 600. Prose is never
    monospaced - this is the one --font-mono use in the device components.
  */
  .mono {
    font-family: var(--font-mono);
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }

  /*
    The multi-module tail collapses BELOW 1024px in CSS and nowhere else - no
    width read, no matchMedia, no resize listener. display: none is deliberate
    and is the one place this component does not reserve: the tail is at the
    END of the line, so removing it shortens the label and moves nothing
    above, below or to its left, and its content is in the disclosure at every
    width (Y-19).
  */
  @media (max-width: 1023.98px) {
    .tail {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .device-slot {
      --slot-arrive-ms: var(--arrive-ms, 200ms);
    }

    .caption,
    .label,
    .swap > .rest,
    .swap > .hover {
      transition: none;
    }
  }
</style>
