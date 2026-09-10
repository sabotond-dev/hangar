<!--
  TRY ON DEVICE: the chosen panel's primary control, a CONSUMER of the device
  session (06-CONTEXT D-01, 06-UI-SPEC Y-17) and, since plan 07-10, the one
  control on the page that asks the install store to write.

  Phase 4 built this component around a port it opened itself: it held the
  phase, the failure and the identity, closed the port on release(), on
  onDestroy and on pagehide, and carried a careful header about ordering and
  transient activation. All of that is now the session's story, and the
  header that told it lives at the top of src/lib/device/session.svelte.ts -
  requestPort() as the first statement of connect(), the heavy modules
  awaited after the chooser has been asked for, the replug identity trap, and
  why start() never opens a port. This file reads session.phase,
  session.identity and session.failureFor(PRIMARY), reads the install store's
  phase, action and config, calls session.connect() or install.tryOnDevice()
  from its click and session.disconnect() from DISCONNECT ZONA, and holds no
  state of its own. There is no port here to close, so release() and the
  component's teardown close nothing: a visitor who presses Escape, steps the
  row past the chosen entry, chooses another card, goes Back or switches tabs
  keeps their connection, and the header and this button cannot disagree
  because they are reading one object.

  IT WRITES, ON A CLICK, AND NOTHING ELSE ON THE PAGE CAN (07-CONTEXT D-01,
  D-02; SAFE-01). Phase 4's header said "It cannot write" and two of its
  literals promised so on screen; both were retired by plan 07-10 as the
  second of D-18's two named edits, because from this wave on the sentence
  would be false. What is still a property of the file rather than a promise
  about intent: RequestQueue, hostHeartbeat, sendConfig and storePage appear
  nowhere below this comment, and neither does any call to a transport's
  write method. The click hands the tuner's pair to install.tryOnDevice(),
  which writes it VERBATIM (D-10) through the session's one queue - or, when
  no session is open, calls session.connect() as its first statement. The
  store refuses a pair it has not been handed (the 120 ms measuring window
  after a knob move, D-17), a phase a write may not start from, and either
  string at or over the module's limit; this component disables the control
  for the first of those and the budget reason covers the last.

  THE LABEL. PRIMARY below is the definition of TRY ON DEVICE for this
  surface. It is passed to session.failureFor() and to InstallState so every
  recovery step that says "Click ... again" names the button the visitor is
  looking at (Y-13), and it stays HERE for two reasons a reader will otherwise
  reach past. It is not imported from $lib/device/try-on, because that
  specifier is not one the chunk guard permits under src/lib/ui/ and would
  drag the protocol chunk onto the first paint for one string
  (config-shape.spec.ts test 13). And it is not exported from session-copy,
  because session-copy.spec.ts test 4 holds that module free of this literal -
  that gate is what proves the recovery steps interpolate the calling
  surface's label instead of hard-coding the panel's. The two busy labels,
  WRITING… and KEEPING…, are install-copy's.

  THE THREE LABELS THE BUTTON CAN WEAR, and which leg puts each on it (07-UI-SPEC
  I3). WRITING… during a RAM leg started from THIS button (action `try`);
  KEEPING… during the store leg started from the confirmation's commit
  (action `keep`), because the control that was clicked has left the screen
  and the row's KEEP ON DEVICE is a quiet disabled control that cannot carry
  it; the resting label, disabled, during a put-back, whose busy label is PUT
  BACK's own. Whichever label is a busy one, the button carries
  aria-busy="true", and the swap has NO TRANSITION: a RAM leg is roughly 40 ms
  end to end and a 140 ms crossfade on a 40 ms state renders as a smear. The
  only transitions on this control are its hover filter and glow, which are
  Phase 4's and are untouched. No spinner during a write - the 9x9 motif is
  the port chooser's, which takes as long as a human takes.

  THE CONNECT-STATE REGION, by session phase. Resting (idle, detected,
  forgotten): EMPTY since plan 10-03. It carried CONN-03's pre-click
  explanation in a second mount of PickerExplainer; R-02 retires the string
  and the component, because the browser's own chooser explains itself the
  instant it appears. What the visitor needed from it - that nothing goes to
  the module until they click - is SAFE_NOTE beneath the primary, in every
  state rather than in three. In flight (choosing, opening,
  identifying): the status line from session-copy, which the note likewise
  yields. Connected: InstallState, which renders whichever of the install
  store's twelve blocks the phase names - ZONA IDENTIFIED with the body that
  names PUT BACK in `ready` (Z-07), READING ZONA in `snapshotting`, PLAYING
  NOW, KEPT, RESTORED and the seven failure blocks - and after it DISCONNECT
  ZONA, at the block's end where Phase 4 put it. Every named session state,
  the two capability states included: the one FailureBlock, with this
  surface's label in its steps. The region carries no aria-live - see the
  comment on the element - and carries aria-busy="true" while the store is
  `writing`, on every leg, so assistive technology knows the block it holds
  is about to change. It is a programmatic focus target (tabindex="-1"): the
  panel moves focus here when the confirmation commits, because the row's
  KEEP ON DEVICE returns disabled and cannot hold it (07-UI-SPEC, Focus
  management).

  DEGR-02. On a browser that cannot talk to hardware the control is present
  and really `disabled`, with the reason rendered twice: the capability
  sentence in the honesty slot (precedence 1 - Z-06, an amendment to Phase
  6's behaviour, which kept the standing line there because the standing
  line then ended "this never writes") and the transport's failureCopy in the
  connect-state region beneath it, which names three browsers and no engine.
  Never aria-disabled alone, and never hidden, because a visitor who cannot
  install deserves to be told which browsers can rather than to see nothing
  at all. The block stays in THIS panel as well as in the header disclosure
  because there are two disabled controls and the reason belongs beside each
  (e2e/first-experience.e2e.ts reads it here).

  The layout around all of this belongs to ChosenPanel.svelte. This component
  owns regions 1 to 3 of D-08's order: the button, the honesty slot and the
  connect-state region.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { untrack } from "svelte";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import { install } from "$lib/device/install.svelte";
  import {
    HONESTY_INCAPABLE,
    HONESTY_NO_SESSION,
    HONESTY_READY,
    HONESTY_SNAPSHOTTING,
    KEEPING_LABEL,
    WRITING_LABEL,
  } from "$lib/device/install-copy";
  import { session } from "$lib/device/session.svelte";
  import {
    CONNECTING_LABEL,
    DISCONNECT_LABEL,
    SAFE_NOTE,
    STATUS_CHOOSING,
    STATUS_IDENTIFYING,
    STATUS_OPENING,
  } from "$lib/device/session-copy";
  import { tryOnBudgetReason } from "$lib/tune/copy";
  import FailureBlock from "./FailureBlock.svelte";
  import InstallState from "./InstallState.svelte";
  import PadSpinner from "./PadSpinner.svelte";

  let {
    entry,
    budgetReason,
    config,
  }: {
    /**
     * The chosen configuration. Its name is what the install store is handed
     * at the click (the settled and kept sentences carry it), and it is
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
    /**
     * The compiled Setup and Timer the meters measured, or undefined while the
     * tuner is measuring (07-CONTEXT D-10, D-17). Declared STRUCTURALLY, never
     * as a type imported from $lib/tune/model: that module reaches the
     * compiler, and no file under src/lib/ui/ may name it in a static import
     * (config-shape.spec.ts test 13). Handed to the install store as it
     * arrives (observeConfig below), which writes it verbatim on the click and
     * treats undefined as "not ready to write", so a click inside the 120 ms
     * debounce window writes nothing rather than the previous strings.
     */
    config?: { system: string; setup: string; timer: string };
  } = $props();

  // ---------------------------------------------------------------------------
  // Copy. Every visitor-facing string is a const here rather than markup text,
  // because Prettier reflows element text and Phase 2 already lost a
  // load-bearing sentence to a line break that way (02-05-SUMMARY.md). Several
  // of these are asserted character for character.

  /**
   * The control's label, and after plan 06-12 its ONE definition on this
   * surface. It is what the button shows at rest, what session.failureFor() is
   * handed, and what InstallState interpolates into the lost block's steps, so
   * the label on the control and the label inside the recovery steps are the
   * same identifier. It is deliberately neither a static import from
   * $lib/device/try-on (not a permitted specifier under src/lib/ui/ -
   * config-shape.spec.ts test 13) nor an export of session-copy
   * (session-copy.spec.ts test 4 holds that module free of this literal). See
   * the header.
   */
  const PRIMARY = "TRY ON DEVICE";
  /**
   * The sizing twin for the budget string, and the reason this component
   * imports from $lib/tune/copy at all. The slot has to reserve room for the
   * budget reason BEFORE one exists, or the reservation would arrive at the
   * same moment as the jump it prevents. tryOnBudgetReason's longest form is
   * the "Setup and Timer" one, so that is what the hidden twin is sized on -
   * and it is the real function rather than a transcription, so the two
   * cannot drift. $lib/tune/copy imports nothing at all, compiler included,
   * which is what makes a static import of it safe here (config-shape.spec.ts
   * test 13).
   */
  const BUDGET_SIZING = tryOnBudgetReason("Setup and Timer");

  // ---------------------------------------------------------------------------
  // What the component reads. All of it is the session's or the store's; none
  // of it is held.

  const connecting = $derived(
    session.phase === "choosing" ||
      session.phase === "opening" ||
      session.phase === "identifying",
  );
  const connected = $derived(session.phase === "connected");
  const incapable = $derived(
    session.phase === "unsupported" || session.phase === "insecure",
  );
  /** The one block for this surface, with this surface's label (Y-13). */
  const block = $derived(session.failureFor(PRIMARY));
  //
  // `explaining` WAS HERE, and its absence is R-02 rather than a gap. It named
  // the three resting states - idle, detected, forgotten - in which this
  // region carried CONN-03's pre-click explanation. Plan 10-03 retires
  // PICKER_EXPLAINER and PickerExplainer.svelte with it: the browser's own
  // chooser explains itself the instant it appears, and SAFE_NOTE beneath the
  // primary now says the part that mattered - that nothing is written without
  // a click - in every state rather than in three. The region is simply empty
  // in those three states now, and `.status:not(:empty)` already means an
  // empty region costs no space.
  //

  const writing = $derived(install.phase === "writing");
  /** WRITING… belongs to a RAM leg started here; KEEPING… to the confirmation's store leg (I3). */
  const writingTry = $derived(writing && install.action === "try");
  const keeping = $derived(writing && install.action === "keep");
  const busy = $derived(writingTry || keeping);
  const label = $derived(
    connecting
      ? CONNECTING_LABEL
      : writingTry
        ? WRITING_LABEL
        : keeping
          ? KEEPING_LABEL
          : PRIMARY,
  );

  /**
   * The tuner's pair reaches the store the moment it changes - and reaches it
   * as undefined the moment a knob moves, which is what disables the control
   * for the measuring window below (D-17). The effect writes a value it never
   * reads, so there is no loop.
   */
  $effect(() => {
    const pair = config;
    // untrack: observeConfig reads the store's own fields to recompute what
    // "armed" means, and this effect must re-run on the PROP alone.
    untrack(() => install.observeConfig(pair));
  });

  /**
   * Disabled in every state where a click would be meaningless or unsafe:
   * before the session has read the capability, while a connection is in
   * flight, on a browser that cannot do it at all, over budget, while the
   * store is reading the module or writing to it, and - once connected - while
   * the tuner is still measuring and there is nothing to write. Each of those
   * renders a reason in the panel or is a state of at most 120 ms; none of
   * them is aria-disabled alone. `starting` is also the server-rendered state,
   * so a prerendered document ships the control disabled and hydration enables
   * it. It is ENABLED in `connected` once the store is `ready` - Phase 6
   * disabled it there, because then it could only identify.
   */
  const disabled = $derived(
    session.phase === "starting" ||
      connecting ||
      incapable ||
      budgetReason !== undefined ||
      install.phase === "snapshotting" ||
      writing ||
      (connected && install.config === undefined),
  );

  /**
   * Which of the honesty slot's FIVE strings is the visible one. The other
   * four are still rendered, as sizing twins - see the style block.
   *
   * PRECEDENCE (07-UI-SPEC I9). A browser that cannot install at all outranks
   * everything: the permanent obstacle is the honest one to state, and the
   * standing line now promises a write, which on that browser would be a lie
   * (Z-06 - an amendment to Phase 6, where the standing line stayed because
   * it ended "this never writes"). Then the snapshot in flight, then Phase
   * 5's budget reason, then the ready form once a session is open, and the
   * pre-connect form otherwise. `writing` swaps nothing (I3, rule 4): the
   * slot holds whatever string it was holding.
   */
  const shown:
    | "incapable"
    | "snapshotting"
    | "budget"
    | "ready"
    | "no-session" = $derived(
    incapable
      ? "incapable"
      : install.phase === "snapshotting"
        ? "snapshotting"
        : budgetReason !== undefined
          ? "budget"
          : connected
            ? "ready"
            : "no-session",
  );

  // ---------------------------------------------------------------------------
  // The two actions.

  /**
   * The click. When no session is open, session.connect() is the FIRST
   * statement with nothing awaited in front of it: the session's requestPort()
   * has to run inside this click's activation window (see session.svelte.ts).
   * When one is, the install store writes the pair - from `snapshot-failed` it
   * reads the module again first and writes only if that lands (I9 cause 4).
   */
  function tryOnDevice(): void {
    if (session.phase !== "connected") {
      session.connect();
      return;
    }
    void install.tryOnDevice(config, entry.name);
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
    class="primary pill"
    type="button"
    data-testid="try-on-device"
    {disabled}
    aria-busy={busy ? "true" : undefined}
    aria-describedby="try-on-reason"
    onclick={tryOnDevice}
  >
    {#if connecting}<PadSpinner />{/if}
    <span class="label">{label}</span>
  </button>

  <!--
    SAFE-01's guarantee, on the control that would do the writing (R-03,
    10-UI-SPEC 10.1). UNCONDITIONAL: no {#if}, no state test, no alternate
    form. It is on the screen while the panel is idle, while it is writing,
    under every failure and on a browser that cannot write at all - which is
    more states than the 88-character paragraph it replaces ever reached, and
    it is beneath the button rather than in a header note or a disclosure.
  -->
  <p class="safe-note" data-testid="safe-note">{SAFE_NOTE}</p>

  <div class="honesty" id="try-on-reason">
    <p
      class="line"
      class:twin={shown !== "no-session"}
      aria-hidden={shown !== "no-session"}
    >
      {HONESTY_NO_SESSION}
    </p>
    <p
      class="line"
      class:twin={shown !== "ready"}
      aria-hidden={shown !== "ready"}
    >
      {HONESTY_READY}
    </p>
    <p
      class="line"
      class:twin={shown !== "snapshotting"}
      aria-hidden={shown !== "snapshotting"}
    >
      {HONESTY_SNAPSHOTTING}
    </p>
    <p
      class="line"
      class:twin={shown !== "incapable"}
      aria-hidden={shown !== "incapable"}
    >
      {HONESTY_INCAPABLE}
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
    twice. Phase 4's aria-live="polite" on this element is the one Phase 6
    removed (06-UI-SPEC Y-16); device-ui.spec.ts test 7 holds it absent.

    Its first branch is now `choosing`: the resting branch went with R-02 and
    the region is empty in idle, detected and forgotten. `:not(:empty)` is
    what makes an empty region cost nothing, so nothing moved when it went.

    tabindex="-1" makes it the focus target the confirmation's commit lands
    on; aria-busy while writing says the block inside is about to change.
  -->
  <div
    class="status"
    data-testid="connect-status"
    tabindex="-1"
    aria-busy={writing ? "true" : undefined}
  >
    {#if session.phase === "choosing"}
      <p class="detail">{STATUS_CHOOSING}</p>
    {:else if session.phase === "opening"}
      <p class="detail">{STATUS_OPENING}</p>
    {:else if session.phase === "identifying"}
      <p class="detail">{STATUS_IDENTIFYING}</p>
    {:else if connected}
      <InstallState name={entry.name} label={PRIMARY} />
      <!--
        Phase 4's, at the block's end. A real `disabled` while the store is
        writing, on every leg: pulling the port out from under a RAM write is
        the one way a visitor can create `partial` with their own hand, and
        under a store it is the way to create `unconfirmed` - the hazard Z-15
        names for the header's pair, from the panel's side. The disabling is
        protective rather than explanatory (I3, rule 4): region 3 is aria-busy
        at that moment and the write settles inside two frames.
      -->
      <button
        class="disconnect"
        type="button"
        data-testid="disconnect"
        disabled={writing}
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
  /*
    Micro role on an accent fill: 12px / 600 / 0.18em / uppercase, on black.

    PRIMARY TAKES THE PILL'S RADIUS AND NOT ITS PAINT (10-UI-SPEC 19.1b, A-41).
    The class on the button applies the shape; the two declarations below
    OVERRIDE the pill's outline and its transparent fill, because this is the
    one control on a panel that owns a fill and A-41's ruling is that Primary
    keeps it. A Svelte-scoped class outranks the global one, so the override is
    a property of specificity rather than of source order - which is the failure
    mode 10-10 hit when a rule placed beside the element it described lost to a
    competing declaration further down its file.
  */
  .primary {
    appearance: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    inline-size: 100%;
    min-block-size: 44px;
    border: 1px solid transparent;
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
    SAFE_NOTE. Micro (title): 12px, 600, a 14px line box, 0.01em, sentence
    case, --color-ink at 9.26:1 - a safety statement is not quiet, and the
    honesty slot 8px below it is. 8px beneath the primary (04-UI-SPEC,
    Spacing, sm).

    IT IS EXPLICITLY NOT A SIZING TWIN, and that is the whole difference
    between this line and every other line in this file. No grid-area, no
    hidden sibling, no candidate list: nothing is ever swapped into its place,
    so there is nothing to reserve for. It costs one 14px line box,
    permanently, and it never changes height. device-ui.spec.ts asserts that
    shape here rather than trusting it.
  */
  .safe-note {
    margin: 8px 0 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 14px;
    letter-spacing: 0.01em;
    color: var(--color-ink);
  }

  /*
    THE RESERVED HONESTY SLOT, and it is the other half of "the primary control
    never moves".

    This slot holds one of FIVE sentences (07-UI-SPEC Z-06): the pre-connect
    form, the ready form, the snapshotting form, the capability form and Phase
    5's over-budget reason. All five are Body 16px/1.5 and they wrap to a
    different number of lines at the panel's width. Swapping one for another
    would therefore change the slot's height and shove everything below it -
    the whole tuning region, the rack, the meters, the thing the visitor is
    looking at - by roughly 24px, at the exact instant a knob crosses 908.
    That is the worst possible moment for the page to jump.

    THE REASON IT EXISTS IS SAFETY, NOT TIDINESS (Z-18). Any of the panel's
    reserved cells changing line count would shift the site's destructive
    controls vertically under a hand already reaching for them.

    The reservation is two declarations and one piece of markup:

      1. min-block-size: 48px - TWO Body lines at 16px/1.5, the floor.
      2. a ONE-CELL GRID: all five sentences occupy grid-area 1 / 1, so the
         cell is sized on the TALLEST OF THE FIVE at whatever width the panel
         currently is, not only at the 372px the floor was derived at.
      3. the four inactive ones carry visibility: hidden, which already removes
         them from the accessibility tree; aria-hidden makes that explicit
         rather than incidental.

    48px AND NOT 72px SINCE PLAN 10-03, and it is arithmetic rather than an
    adjustment. A reservation is `ceil(longest / CH_PER_LINE) x 24`, and
    CH_PER_LINE is a Body line box's capacity in this column: 43, measured in
    Inter Variable over thirty-six full line boxes in two engines by plan 10-01.
    R-05 and R-06 rewrite the two longest candidates and the fifth,
    tryOnBudgetReason's worst form, is shortened to its cap, so the longest of
    the five is now 85 - `ceil(85 / 43) x 24 = 48`. Three lines became two.

    install-copy.spec.ts holds every string under HONESTY_CAP - 2 x 43 = 86,
    down from 129 - so the floor cannot silently grow, and device-ui.spec.ts and
    tune-ui.spec.ts hold this declaration to 48px with the arithmetic in their
    failure messages.

    Five and not fewer. Every one of them is rendered even while its state is
    unreachable - the budget twin while the configuration fits, the capability
    twin on a browser that can write - or the reservation would arrive at the
    same instant as the jump it prevents.
  */
  .honesty {
    display: grid;
    margin-block-start: 8px;
    min-block-size: 48px;
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

  /* Phase 4's ring, on the programmatic focus target too. */
  .status:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
  }

  /*
    Body role at full strength: this is what the visitor is here to read. The
    failure title, detail and steps that used to sit beside this moved into
    FailureBlock.svelte, declaration for declaration, and the identified block
    into InstallState.svelte; what is left here is the status line.
  */
  .detail {
    margin: 8px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
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

  .disconnect:hover:not(:disabled) {
    color: var(--color-accent);
  }

  .disconnect:disabled {
    color: var(--color-ink-dim);
    cursor: not-allowed;
  }
</style>
