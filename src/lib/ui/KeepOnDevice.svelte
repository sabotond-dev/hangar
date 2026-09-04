<!--
  The secondary install control, and it is secondary on purpose (SAFE-02).

  KEEP ON DEVICE is the genuinely destructive one - it writes the configuration
  into the module's own flash, so it survives a power cycle and replaces
  whatever the owner had there. Phase 7 owns that write. Throughout Phase 4 the
  control is present and really `disabled`, with its reason in the panel beside
  it, because a control that vanishes teaches a visitor nothing about what the
  site will eventually do.

  It is never an equal-weight button beside TRY ON DEVICE: auto width against
  the primary's full width, a hairline border against the primary's solid
  accent fill, a dim label against black-on-lime, and a 24px rule between them.
  The two install controls are never the same size, never the same fill and
  never adjacent (04-UI-SPEC Screen 3).

  A real `disabled` attribute, never aria-disabled alone: the reason exists to
  be read, and an aria-disabled button still takes a click and still has to
  invent something to do with it.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  /*
    The copy contract's words, in a const rather than inline in the markup.
    Prettier reflows element text and Phase 2 lost a load-bearing sentence to a
    line break that way (02-05-SUMMARY.md).
  */
  const LABEL = "KEEP ON DEVICE";
  const REASON =
    "Available after a try-on. Storing into the module’s own memory " +
    "ships together with install.";
</script>

<div class="keep">
  <button
    class="control"
    type="button"
    data-testid="keep-on-device"
    disabled
    aria-describedby="keep-on-device-reason"
  >
    {LABEL}
  </button>
  <p class="reason" id="keep-on-device-reason">{REASON}</p>
</div>

<style>
  .keep {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  /* Micro role: 12px / 600 / 0.18em / uppercase, in the dim rung of the ladder. */
  .control {
    appearance: none;
    inline-size: fit-content;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-line);
    border-radius: 6px;
    background: transparent;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-dim);
    cursor: not-allowed;
  }

  /* Body role. 8px below the control, which is the button-to-reason gap. */
  .reason {
    margin: 8px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }
</style>
