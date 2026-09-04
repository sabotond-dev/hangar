<!--
  COPY LINK: copy without awaiting, and a fallback that does not fail silently.

  THE HANDLER IS THE WHOLE COMPONENT. `writeText` is called with nothing held up
  in front of it and its promise is continued with `.then`, never `await`ed.
  Safari EXPIRES the transient user activation across an await rather than
  consuming it, and the write then rejects with a NotAllowedError - on the one
  browser family DEGR-01 exists for, and with a symptom that reads to a visitor
  as "the button is broken". The URL is therefore composed upstream on every
  knob change and arrives here as a plain string prop, already finished. This
  component never computes it, never asks the model for it, and never navigates
  to it. It is the same ordering rule TryOnDevice.svelte obeys for
  requestPort(), for the same reason, in the same words.

  WHY THE CONFIRMATION IS THE CONTROL'S OWN STATE. The label becomes LINK COPIED
  with an accent border for 2000ms and then goes back. No toast - the site has
  no toast vocabulary and this phase does not invent one - no icon, no colour
  fill. The button's accessible name is always its visible text (WCAG 2.5.3),
  which is what a label that changes with state has to guarantee. The copy is
  additionally announced once through the region's single polite live region,
  which the region owns; this component signals it through a callback and holds
  no live region of its own.

  THE FALLBACK IS A REVEAL, NOT A FAILURE. Where navigator.clipboard is absent
  or the write rejects, a readonly input appears directly beneath the button
  holding the full URL, already select()ed, with one line above it that names
  KEYS rather than controls - because the visitor is about to press two of them
  and there is no control on the screen that would do it for them. The button's
  own label stays COPY LINK: it did not become a different control.

  THE FIELD IS 16px AND THAT IS NOT A TYPOGRAPHIC CHOICE. iOS Safari zooms the
  whole viewport when a form field smaller than 16px takes focus, and the field
  is select()ed on reveal - so at 15px the panel would jump and the visitor
  would lose their place at the exact moment they are trying to copy. It is
  monospace because a URL is machine text, which is the fourth of this phase's
  declared monospace uses.

  document.execCommand("copy") is deprecated and is deliberately NOT a path
  here: it is not needed, the select-and-copy reveal is the honest fallback, and
  a deprecated API behind a capability check would be three lines that no test
  in this repository can reach.

  COPY LINK IS NOT AN INSTALL CONTROL and never claims to be. It sits beside
  KEEP ON DEVICE, which is disabled throughout this phase with a dim label and
  its own reason, while this one is enabled with an --color-ink label and a line
  saying it copies a link. Phase 4's rule that the two INSTALL controls are
  never the same size, never the same fill and never adjacent is untouched.

  No --color-over appears in this file. The token is scoped to X-01's three
  uses, all of them in BudgetMeter.svelte and BudgetMessage.svelte.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy } from "svelte";
  import {
    COPY_LINK,
    LINK_COPIED,
    SHARE_FALLBACK_FIELD_NAME,
    SHARE_FALLBACK_LINE,
    SHARE_QUIET_LINE,
  } from "$lib/tune/copy";

  let {
    url,
    oncopied,
  }: {
    /**
     * The share link, ALREADY COMPOSED upstream and recomposed on every knob
     * change. Never computed here, and never awaited: see the header.
     */
    url: string;
    /**
     * Signals a successful copy so the region can announce it once through its
     * own polite live region. This component holds no live region.
     */
    oncopied?: () => void;
  } = $props();

  /** The confirmed state's lifetime, and the contract's number. */
  const CONFIRM_MS = 2000;

  let confirmed = $state(false);
  /** Until the panel closes, per the states table. Never resets on its own. */
  let fallback = $state(false);
  let field: HTMLInputElement | undefined = $state(undefined);

  /** Not a rune: nothing renders from the handle. */
  let confirmTimer: ReturnType<typeof setTimeout> | undefined;

  onDestroy(() => {
    if (confirmTimer !== undefined) clearTimeout(confirmTimer);
  });

  function copied(): void {
    confirmed = true;
    oncopied?.();
    if (confirmTimer !== undefined) clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => {
      confirmTimer = undefined;
      confirmed = false;
    }, CONFIRM_MS);
  }

  function fellBack(): void {
    confirmed = false;
    fallback = true;
    // After the reveal has rendered, so there is a field to select.
    queueMicrotask(() => field?.select());
  }

  function copy(): void {
    // No await before this call. Safari expires the transient user activation
    // across an await and writeText then rejects with NotAllowedError - on the
    // one browser family DEGR-01 exists for. The URL is precomputed on every
    // knob change for exactly this reason (05-RESEARCH, COPY LINK).
    //
    // Written as a branch rather than as the plan's
    // `clipboard?.writeText(url).then(...) ?? fellBack()` for one mechanical
    // reason: that form is an expression statement and
    // @typescript-eslint/no-unused-expressions rejects it. The semantics are
    // identical - a property test, then the call, then .then with both
    // continuations - and nothing is held up in front of the write.
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(copied, fellBack);
    } else {
      fellBack();
    }
  }
</script>

<div class="share">
  <button
    class="control"
    class:confirmed
    type="button"
    data-testid="copy-link"
    aria-describedby="copy-link-line"
    onclick={copy}
  >
    {confirmed ? LINK_COPIED : COPY_LINK}
  </button>

  <p class="line" id="copy-link-line">
    {fallback ? SHARE_FALLBACK_LINE : SHARE_QUIET_LINE}
  </p>

  {#if fallback}
    <input
      class="field"
      bind:this={field}
      data-testid="copy-link-fallback"
      type="text"
      readonly
      value={url}
      aria-label={SHARE_FALLBACK_FIELD_NAME}
    />
  {/if}
</div>

<style>
  .share {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  /*
    Phase 4's secondary treatment: Micro label, hairline border, no fill. It is
    ENABLED, and its label is --color-ink rather than the dim rung KEEP ON
    DEVICE beside it wears - which is the whole of how a visitor tells the
    enabled control from the disabled one without reading either.
  */
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
    color: var(--color-ink);
    cursor: pointer;
    transition: border-color 140ms ease-out;
  }

  .control:hover,
  .control.confirmed {
    border-color: var(--color-accent);
  }

  /* Body role, quiet. 8px below the control: the button-to-reason gap. */
  .line {
    margin: 8px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /*
    16px is the iOS zoom floor, not a type choice: iOS Safari zooms the viewport
    when a field under 16px takes focus, and this one is select()ed the instant
    it appears. Monospace because a URL is machine text.
  */
  .field {
    inline-size: 100%;
    min-block-size: 44px;
    margin-block-start: 8px;
    padding-inline: 12px;
    border: 1px solid var(--color-line);
    border-radius: 2px;
    background: transparent;
    font-family: var(--font-mono);
    font-size: 16px;
    font-weight: 400;
    color: var(--color-ink);
  }

  @media (prefers-reduced-motion: reduce) {
    .control {
      transition: none;
    }
  }
</style>
