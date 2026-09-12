<!--
  CLEAR: the header's control, top right, beside the connection control
  (13.1-05; 13.1-CONTEXT D-04, bench line 4 of 2026-09-12: "CLEAR button. we
  need a CLEAR button it should live all the time in the top right corner
  next to ZONA connected."). Re-homed from the foot of the workspace's install
  column (10-13, A-45 to A-52; 13-18 D-23), not rebuilt: the script below is
  the column's, line for line; the markup and the style are the header's.

  WHERE IT LIVES. The layout hands this component to Header.svelte's `clear`
  snippet on every page and in both header variants - the intro's header too,
  because the user said "all the time" - and the header renders it inside
  the connection zone BEFORE the connection control, 12px to its left. One
  mount on the site; one `clear` test id on any page; the column has none
  since this plan (13.1-06 removes the rest of the column).

  ONE CLICK SENDS. There is NO CONFIRMATION and there is no ClearConfirm
  component: A-45's shipped behaviour, KEPT by the user's word - they asked
  for a button - and batch row I.6.5 (section 16's confirmation, approved and
  owed) is DECLINED by Phase 13.1 and recorded in 13.1-CONTEXT D-04; the
  gate's bench row asks whether a confirmation is wanted. What the click
  writes is RAM only: a power cycle brings back whatever is in flash, and
  Store on ZONA's confirmation stays the site's only one, because that one
  is genuinely irreversible. With Put back leaving (D-07, 13.1-06) this is the
  way back HANGAR keeps after an Apply.

  WHAT IT WRITES IS NOT EMPTINESS (A-48, D-20). The store sends the firmware's
  own defaultConfig for the touch element - Setup 641, Timer 22, read from the
  pinned protocol package by event number - so after a clear the pad runs a
  proximity-weighted touch highlight rather than nothing. The label is the
  user's one word; the description says exactly what the click restores and
  never says clear, empty or remove as a verb about the page; every string is
  install-copy's and its stems are scanned there.

  THE BOX IS THE CONNECTION CONTROL'S (DeviceSlot.svelte, 13-11): a 1px
  boundary on the workspace ground, 44px on both axes - the site's floor on
  every control (section 14; device-ui.spec.ts test 3) - 16px of inline
  padding, and two 14px fixed line boxes inside: the label over a caption.
  The caption is the disabled REASON, from install-copy's closed record of
  three, and it is empty when the control is live - the two-line shape is
  fixed, as DeviceSlot's is, so the header's row cannot move with the state,
  and it is aria-hidden so the accessible name is the label alone (WCAG
  2.5.3). The sr-only span beneath the button carries the description the
  button points at through aria-describedby: clearLine(page) when live - the
  firmware default, the draft untouched, the page named as the visitor reads
  it (numbered from one, 13-18 I.3.1) - and the reason when not, so a screen
  reader hears why a disabled control is disabled at every width.

  THE CAPTION SHOWS WHERE THE ROW HAS ROOM FOR IT. The reasons were written
  for a 372px column and run 173 to 254px at 12px, so the box is 207 to
  288 wide with one inside; the header's row has 88px of slack beside the
  connection control at 1024 and none at 768 (measured on the served build,
  13.1-05-SUMMARY.md), so a box that always carried its reason would push
  the header sideways in the compact and stacked bands. The connection zone
  is therefore a size container that takes the row's remaining space
  (Header.svelte), and the caption is rendered only when the zone is wide
  enough for the widest reason beside the widest connection label - the
  container query below, whose number is the arithmetic in the comment on
  it. Below that width the box carries the label alone, and the reason is
  still in the description. The description is never conditional.

  DISABLED WITH ITS REASON, NEVER HIDDEN (DEGR-02). On a browser that cannot
  write the control renders with `incapable`; with no session, `no-session`;
  before the snapshot, `no-snapshot`. A real `disabled` attribute, never
  aria-disabled alone. The accessible name is the visible label.

  WHY THE LINE IS HELD THROUGH A WRITE (I3, rule 4). The store's clearReason()
  reads `no-session` for the `writing` phase - `writing` is outside
  WRITABLE_PHASES while the snapshot and the session are both still in hand -
  so a derived caption would flip to the needs-a-ZONA sentence for as long as
  a 40 ms RAM leg takes, which is both false and noise. The last non-writing
  reason is held in a local written from an effect, and the control is
  disabled through the leg regardless. The same hold covers a page target
  that is not at rest (13-12): the destination zone carries that state's own
  line, and this box keeps whatever it was saying rather than inventing a
  fourth reason.

  WHY THE BUSY LABEL SWAPS WITH NO TRANSITION (Z-09). `Resetting Page 2…`
  replaces `Clear` the instant install.clearToDefault() starts and is
  replaced the instant its one leg settles, with aria-busy on the button. A
  crossfade on a 40 ms state renders as a smear rather than as a change, so
  nothing in this file animates or transitions - the hover's boundary colour
  is instant too. The 2000 ms line is the store's and is rendered by the
  context bar, not here.

  No radius (D-01). Every string is install-copy's and the three reasons are
  read from its closed record, never retyped: a fourth reason is a type error
  there, and this file cannot disagree with it about the count.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { install } from "$lib/device/install.svelte";
  import {
    CLEAR_LABEL,
    CLEAR_REASONS,
    clearLine,
    clearingLabel,
    type ClearReason,
  } from "$lib/device/install-copy";
  import { session } from "$lib/device/session.svelte";

  /** The session can write at all: its two capability phases say no. */
  const capable = $derived(
    session.phase !== "unsupported" && session.phase !== "insecure",
  );
  /** Why the control is disabled, or undefined when it is live - the store's one rule. */
  const reason = $derived(install.clearReason(capable));
  const writing = $derived(install.phase === "writing");
  /** The busy label belongs to a clear and to nothing else, through its one leg. */
  const busy = $derived(writing && install.action === "clear");
  /** 13-12: and the page target at rest - the store's one condition, mirrored; clearEnabled() refuses too. */
  const pending = $derived(
    session.phase === "connected" && !install.applyReady,
  );
  const disabled = $derived(reason !== undefined || writing || pending);

  /**
   * The reason on screen: held through a write. Written from an effect on
   * the phase and read by the markup; the effect never reads it, so there is
   * no loop. See the header.
   */
  let held = $state<ClearReason | undefined>(undefined);
  $effect(() => {
    if (install.phase !== "writing" && !pending) held = reason;
  });
  /* Held through a write AND through a pending page target (13-12): the
     destination zone carries that state's own line, and this box keeps
     whatever it was saying rather than inventing a fourth reason. */
  const shown = $derived(writing || pending ? held : reason);

  /** The page the description and the busy label name, as the module reports it (the copy adds one); 0 is never read before a snapshot exists. */
  const page = $derived(install.snapshotPage ?? 0);

  /** The caption: the shown reason from the closed record, or nothing when live. */
  const caption = $derived(shown === undefined ? "" : CLEAR_REASONS[shown]);
  /** The description: what the click restores when live, the reason when not. */
  const description = $derived(
    shown === undefined ? clearLine(page) : CLEAR_REASONS[shown],
  );

  function clear(): void {
    void install.clearToDefault();
  }
</script>

<div class="clear" data-testid="clear-control">
  <button
    class="control"
    type="button"
    data-testid="clear"
    {disabled}
    aria-busy={busy ? "true" : undefined}
    aria-describedby="clear-line"
    onclick={clear}
  >
    <span class="lines">
      <span class="label" data-testid="clear-label"
        >{busy ? clearingLabel(page) : CLEAR_LABEL}</span
      >
      <span class="caption" data-testid="clear-caption" aria-hidden="true"
        >{caption}</span
      >
    </span>
  </button>
  <span id="clear-line" class="sr-only" data-testid="clear-line"
    >{description}</span
  >
</div>

<style>
  .clear {
    display: flex;
    align-items: center;
  }

  /*
    DeviceSlot.svelte's box, declaration for declaration where the two share
    a fact: 44px on both axes, 16px of inline padding, the boundary token as
    the border (identity.spec.ts test 5 forbids the divider here), the
    workspace ground as the fill, the sans face. No corner. No transition -
    see the header.
  */
  .control {
    appearance: none;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    inline-size: fit-content;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding: 0 16px;
    border: 1px solid var(--color-boundary);
    background: transparent;
    font-family: var(--font-sans);
    color: var(--color-ink);
    text-align: start;
    cursor: pointer;
  }

  /* Hover: the boundary to the action colour, instantly. */
  .control:hover:not(:disabled) {
    border-color: var(--color-action);
  }

  /* Disabled: a real attribute; the label to the quiet rung. */
  .control:disabled {
    cursor: not-allowed;
  }

  .control:disabled .label {
    color: var(--color-ink-quiet);
  }

  /* Two stacked lines, each in a 14px fixed box (Y-10): the row cannot move with the state. */
  .lines {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* The label: the user's word, sentence case, at the connection control's size and one weight up. */
  .label {
    line-height: 14px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
    white-space: nowrap;
    color: var(--color-ink);
  }

  /*
    The caption: the reason, in DeviceSlot's caption register (12px, the
    quiet ink, nearly no tracking, one line). Rendered only where the
    connection zone has room for it - see the container query beneath.
  */
  .caption {
    display: none;
    line-height: 14px;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.01em;
    white-space: nowrap;
    color: var(--color-ink-quiet);
  }

  /*
    THE ROOM RULE. The zone (Header.svelte's .connection, an inline-size
    container that takes the row's remaining space) must hold this box with
    its widest reason beside the connection control at its widest, with the
    12px gap between them. Measured on the served build in 13.1-05 (Inter at
    12px; chromium and webkit agree to the pixel): the reasons run 172.6 /
    205.6 / 254.2 wide, so the box (32px of padding, 2px of border) is 206.6
    / 239.6 / 288.2; the connection control is its label or its caption plus
    52 (16 + 16 of padding, 2 of border, the 8px dot and its 10px gap) -
    160.3 at `ZONA connected`, 161.1 at `Not in this browser`, 220.1 at
    `Disconnected · draft retained`. The pairs that can occur together are
    the store's: no-snapshot beside a connected or idle control (288.2 + 12
    + 160.3 = 460.5), incapable beside the two capability captions (239.6 +
    12 + 161.1 = 412.7), no-session beside the unplugged caption (206.6 + 12
    + 220.1 = 438.7). 480 is the largest rounded up to the next ten. The
    zone is 503 at 1280 and 247 at 1024, so the caption shows from about
    1257 up on the app pages; below it the caption is not rendered and the
    reason lives in the description alone; the row never scrolls sideways.
  */
  @container (min-width: 480px) {
    .caption {
      display: inline;
    }
  }
</style>
