<!--
  TRY ON DEVICE: the chosen panel's connect control, and a CONSUMER of the
  device session rather than its owner (06-CONTEXT D-01, 06-UI-SPEC Y-17).

  Phase 4 built this component around a port it opened itself: it held the
  phase, the failure and the identity, closed the port on release(), on
  onDestroy and on pagehide, and carried a careful header about ordering and
  transient activation. All of that is now the session's story, and the
  header that told it lives at the top of src/lib/device/session.svelte.ts -
  requestPort() as the first statement of connect(), the heavy modules
  awaited after the chooser has been asked for, the replug identity trap, and
  why start() never opens a port. This file reads session.phase,
  session.identity and session.failureFor(PRIMARY), calls session.connect()
  from its click and session.disconnect() from DISCONNECT ZONA, and holds no
  state of its own. There is no port here to close, so release() and the
  component's teardown close nothing: a visitor who presses Escape, steps the
  row past the chosen entry, chooses another card, goes Back or switches tabs
  keeps their connection, and the header and this button cannot disagree
  because they are reading one object.

  It cannot write. That is still a property of the file rather than a promise
  about intent: RequestQueue, hostHeartbeat, sendConfig and storePage appear
  nowhere below this comment, and neither does any call to a transport's
  write method. The session it consumes is held to the same absence by
  session.spec.ts, twice.

  THE LABEL. PRIMARY below is the definition of TRY ON DEVICE for this
  surface. It is passed to session.failureFor() so every recovery step that
  says "Click ... again" names the button the visitor is looking at (Y-13),
  and it stays HERE for two reasons a reader will otherwise reach past. It is
  not imported from $lib/device/try-on, because that specifier is not one of
  the five the chunk guard permits under src/lib/ui/ and would drag the
  protocol chunk onto the first paint for one string (config-shape.spec.ts
  test 13). And it is not exported from session-copy, because
  session-copy.spec.ts test 4 holds that module free of this literal - that
  gate is what proves the recovery steps interpolate the calling surface's
  label instead of hard-coding the panel's.

  THE CONNECT-STATE REGION, by session phase. Resting (idle, detected,
  forgotten): the pre-click explanation, PickerExplainer, in its second mount
  - the header note hides its own copy while this panel is open, so the line
  is never on screen twice (06-UI-SPEC Y-11). In flight (choosing, opening,
  identifying): the status line from session-copy, which the note likewise
  yields. Connected: ZONA IDENTIFIED, the firmware sentence and DISCONNECT
  ZONA, verbatim Phase 4. Every named state, the two capability states
  included: the one FailureBlock, with this surface's label in its steps.
  The region carries no aria-live - see the comment on the element.

  DEGR-02. On a browser that cannot talk to hardware the control is present
  and really `disabled`, with the reason rendered in the connect-state region
  beneath it - never aria-disabled alone, and never hidden, because a visitor
  who cannot install deserves to be told which browsers can rather than to
  see nothing at all. The reason is the transport's failureCopy, which names
  three browsers and no engine, and it stays in THIS panel as well as in the
  header disclosure because there are two disabled controls and the reason
  belongs beside each (e2e/first-experience.e2e.ts reads it here).

  The layout around all of this belongs to ChosenPanel.svelte. This component
  owns regions 1 to 3 of D-08's order: the button, the honesty slot and the
  connect-state region.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import { session } from "$lib/device/session.svelte";
  import {
    CONNECTING_LABEL,
    DISCONNECT_LABEL,
    STATUS_CHOOSING,
    STATUS_IDENTIFYING,
    STATUS_OPENING,
    identitySentence,
  } from "$lib/device/session-copy";
  import { tryOnBudgetReason } from "$lib/tune/copy";
  import FailureBlock from "./FailureBlock.svelte";
  import PadSpinner from "./PadSpinner.svelte";
  import PickerExplainer from "./PickerExplainer.svelte";

  let {
    entry,
    budgetReason,
  }: {
    /**
     * The chosen configuration. Nothing on the device path reads it in this
     * phase - identification is about the module, not the pad - but it is
     * published as data-entry so that a step while chosen can be seen to
     * re-fill the panel WITHOUT resetting the connect state: the port belongs
     * to the session, not to the configuration (04-UI-SPEC W-20).
     */
    entry: FrontDoorEntry;
    /**
     * Phase 5's over-budget reason, or undefined while the configuration fits.
     * When it is present the control is a real `disabled` button and this
     * sentence is what the honesty slot shows. It arrives ALREADY WRITTEN, from
     * $lib/tune/copy's tryOnBudgetReason - this component authors no sentence
     * about a budget it cannot measure.
     */
    budgetReason?: string;
  } = $props();

  // ---------------------------------------------------------------------------
  // Copy. Every visitor-facing string is a const here rather than markup text,
  // because Prettier reflows element text and Phase 2 already lost a
  // load-bearing sentence to a line break that way (02-05-SUMMARY.md). Several
  // of these are asserted character for character.

  /**
   * The control's label, and after plan 06-12 its ONE definition on this
   * surface. It is what the button shows and what session.failureFor() is
   * handed, so the label on the control and the label interpolated into the
   * recovery steps are the same identifier. It is deliberately neither a
   * static import from $lib/device/try-on (not a permitted specifier under
   * src/lib/ui/ - config-shape.spec.ts test 13) nor an export of
   * session-copy (session-copy.spec.ts test 4 holds that module free of this
   * literal). See the header.
   */
  const PRIMARY = "TRY ON DEVICE";
  // One literal, never a concatenation: the e2e suite and the acceptance
  // probe both look for this sentence whole, in the source and on the screen.
  const HONESTY =
    "Connects to your ZONA and identifies it. Writing arrives in the next release — this never writes.";
  const IDENTIFIED_REASON = "Your ZONA is already identified.";
  /**
   * The sizing twin for the third string, and the reason this component imports
   * from $lib/tune/copy at all. The slot has to reserve room for the budget
   * reason BEFORE one exists, or the reservation would arrive at the same
   * moment as the jump it prevents. tryOnBudgetReason's longest form is the
   * "Setup and Timer" one, so that is what the hidden twin is sized on - and it
   * is the real function rather than a transcription, so the two cannot drift.
   * $lib/tune/copy imports nothing at all, compiler included, which is what
   * makes a static import of it safe here (config-shape.spec.ts test 13).
   */
  const BUDGET_SIZING = tryOnBudgetReason("Setup and Timer");

  const IDENTIFIED_CAPTION = "ZONA IDENTIFIED";
  /**
   * The second sentence of the identified body. The first is session-copy's
   * identitySentence - the lifted one, so the panel and the disclosure cannot
   * word the firmware line differently. This tail is the panel's own Phase 4
   * promise and is retired with the rest of them when install ships.
   */
  const IDENTIFIED_TAIL =
    "Nothing was written, and nothing will be until install ships in the next release.";

  // ---------------------------------------------------------------------------
  // What the component reads. All of it is the session's; none of it is held.

  const connecting = $derived(
    session.phase === "choosing" ||
      session.phase === "opening" ||
      session.phase === "identifying",
  );
  /** The one block for this surface, with this surface's label (Y-13). */
  const block = $derived(session.failureFor(PRIMARY));
  /**
   * The three resting states in which the connect-state region carries the
   * pre-click explanation (CONN-03): a picker is ahead of the visitor and
   * nothing has been asked yet. `starting` is deliberately not one of them -
   * a browser that turns out to be `unsupported` would otherwise show the
   * explanation for a frame and replace it with the capability block.
   */
  const explaining = $derived(
    session.phase === "idle" ||
      session.phase === "detected" ||
      session.phase === "forgotten",
  );
  const identity = $derived(session.identity);
  const identifiedBody = $derived(
    identity
      ? `${identitySentence(identity.zona.firmware, identity.activePage)} ${IDENTIFIED_TAIL}`
      : "",
  );

  /**
   * Disabled in every state where a click would be meaningless: before the
   * session has read the capability, while a connection is in flight, once the
   * module is already connected, and on a browser that cannot do it at all.
   * Each of those renders a reason in the panel; none of them is aria-disabled
   * alone. `starting` is also the server-rendered state, so a prerendered
   * document ships the control disabled and hydration enables it.
   */
  const disabled = $derived(
    session.phase === "starting" ||
      connecting ||
      session.phase === "connected" ||
      session.phase === "unsupported" ||
      session.phase === "insecure" ||
      budgetReason !== undefined,
  );

  /**
   * Which of the honesty slot's three strings is the visible one. The other two
   * are still rendered, as sizing twins - see the style block.
   *
   * PRECEDENCE, and it is the UI spec's rule extended by one step. A browser
   * that cannot install at all outranks the budget: the permanent obstacle is
   * the honest one to state, and its own words are already in the connect-state
   * region below, so the slot keeps the standing honesty line. `connected`
   * outranks it too, because in THIS phase the control does nothing but
   * identify - once it has, the budget is not what is stopping it, and the
   * over-budget configuration still has the message block beside the knobs
   * saying so in full.
   */
  const shown: "honesty" | "identified" | "budget" = $derived(
    session.phase === "unsupported" || session.phase === "insecure"
      ? "honesty"
      : session.phase === "connected"
        ? "identified"
        : budgetReason !== undefined
          ? "budget"
          : "honesty",
  );

  // ---------------------------------------------------------------------------
  // The two actions, both the session's.

  function tryOnDevice(): void {
    // Nothing awaited in front of it: the session's requestPort() has to run
    // inside this click's activation window. See session.svelte.ts.
    session.connect();
  }

  function disconnect(): void {
    void session.disconnect();
  }

  /**
   * Still called by the row on every un-choose path (Escape, the browser Back
   * button, a click on a dimmed side pad, a step past the chosen entry) through
   * Coverflow.svelte's bind:this, and still idempotent - but since plan 06-12
   * it closes nothing, because there is nothing here to close. The port, the
   * phase and the failure belong to the session and survive the panel (Y-17);
   * a visitor who closes the panel keeps their connection.
   */
  export function release(): void {
    // Nothing to clear: this component holds no state of its own.
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
    <span class="label">{connecting ? CONNECTING_LABEL : PRIMARY}</span>
  </button>

  <div class="honesty" id="try-on-reason">
    <p
      class="line"
      class:twin={shown !== "honesty"}
      aria-hidden={shown !== "honesty"}
    >
      {HONESTY}
    </p>
    <p
      class="line"
      class:twin={shown !== "identified"}
      aria-hidden={shown !== "identified"}
    >
      {IDENTIFIED_REASON}
    </p>
    <p
      class="line"
      class:twin={shown !== "budget"}
      aria-hidden={shown !== "budget"}
    >
      {budgetReason ?? BUDGET_SIZING}
    </p>
  </div>

  <!--
    The connect-state region. It is NOT a live region: the session's one
    announcer (SessionAnnouncer.svelte, mounted once in the layout) speaks
    every transition, and a second aria-live here would say each of them
    twice. Phase 4's aria-live="polite" on this element is the one this phase
    removes (06-UI-SPEC Y-16); device-ui.spec.ts test 7 holds it absent.

    The panel's PickerExplainer names its OWN testid because the header note
    keeps the default one on a hidden sizing twin while this panel is open
    (DeviceNote.svelte, panelOwnsProse) - so a test can tell which of the
    two mounts is the visible one.
  -->
  <div class="status" data-testid="connect-status">
    {#if explaining}
      <PickerExplainer testid="try-on-explainer" />
    {:else if session.phase === "choosing"}
      <p class="detail">{STATUS_CHOOSING}</p>
    {:else if session.phase === "opening"}
      <p class="detail">{STATUS_OPENING}</p>
    {:else if session.phase === "identifying"}
      <p class="detail">{STATUS_IDENTIFYING}</p>
    {:else if session.phase === "connected" && identity}
      <p class="caption">{IDENTIFIED_CAPTION}</p>
      <p class="detail">{identifiedBody}</p>
      <button
        class="disconnect"
        type="button"
        data-testid="disconnect"
        onclick={disconnect}
      >
        {DISCONNECT_LABEL}
      </button>
    {:else if block}
      <FailureBlock {block} />
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

    THE ALARM RED IS NEVER APPLIED TO THIS BUTTON, and the over-budget state is
    where the temptation is: X-01 scopes that token to three uses, all of them
    inside a meter or the message beside the knobs, and a red primary control
    would say "dangerous" when the truth is "not yet". This paragraph names the
    token it forbids, which is exactly why the gate over it strips comments
    before it counts - a raw grep would fail on the sentence documenting the
    rule.
  */
  .primary:disabled {
    background: transparent;
    border-color: var(--color-line);
    color: var(--color-ink-dim);
    cursor: not-allowed;
  }

  /*
    THE RESERVED HONESTY SLOT, and it is the other half of "the primary control
    never moves".

    This slot holds one of THREE sentences: the standing honesty line, the
    already-identified line, and Phase 5's over-budget reason. All three are
    Body 16px/1.5 and all three wrap to a different number of lines at the
    panel's width. Swapping one for another would therefore change the slot's
    height and shove everything below it - the whole tuning region, the rack,
    the meters, the thing the visitor is looking at - by roughly 24px, at the
    exact instant a knob crosses 908. That is the worst possible moment for the
    page to jump.

    The reservation is two declarations and one piece of markup:

      1. min-block-size: 72px - three Body lines at 16px/1.5, the floor.
      2. a ONE-CELL GRID: all three sentences occupy grid-area 1 / 1, so the
         cell is sized on the TALLEST OF THE THREE at whatever width the panel
         currently is, not only at the 372px the 72px floor was derived at.
      3. the two inactive ones carry visibility: hidden, which already removes
         them from the accessibility tree; aria-hidden makes that explicit
         rather than incidental.

    Three and not two. The component swapped between the first two long before
    Phase 5 existed, so sizing on two of the three would leave the IDENTIFY path
    free to resize the slot - the same jump, moved to a different moment. And
    the third twin is rendered even while no budget reason exists, or the
    reservation would arrive at the same instant as the jump it prevents.
  */
  .honesty {
    display: grid;
    margin-block-start: 8px;
    min-block-size: 72px;
  }

  /* Body role, 8px under the button (04-UI-SPEC, Spacing, sm). */
  .line {
    grid-area: 1 / 1;
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  .twin {
    visibility: hidden;
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
    Body role at full strength: this is what the visitor is here to read. The
    failure title, detail and steps that used to sit beside this moved into
    FailureBlock.svelte, declaration for declaration; what is left here is
    the status line and the identified sentence.
  */
  .detail {
    margin: 8px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }

  .caption + .detail {
    margin-block-start: 8px;
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
