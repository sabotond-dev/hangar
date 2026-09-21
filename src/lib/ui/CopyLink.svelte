<!--
  Share snapshot (Phase 5's COPY LINK): copy without awaiting, and a fallback that
  does not fail silently. Props: url (ALREADY COMPOSED upstream on every knob
  change; never computed, never awaited here), oncopied (the region announces it
  through its one live region), label. writeText runs with nothing in front of it
  and is continued with .then, never awaited: Safari expires the transient user
  activation across an await (DEGR-01). The confirmation is the control's own
  label, Link copied, for 2000ms - no toast, no icon, no fill. The fallback is a
  reveal: a readonly 16px monospace field, select()ed, with a line naming the two
  keys. Not an install control; no standing line since 10-03 (R-07). No --color-error-ink here.
  Decided at 05-08 / 10-03 (R-07); see .planning/phases/10-redesign/10-03-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy } from "svelte";
  import {
    LINK_COPIED,
    SHARE_FALLBACK_FIELD_NAME,
    SHARE_FALLBACK_LINE,
  } from "$lib/tune/copy";
  import { SHARE_SNAPSHOT } from "$lib/tune/inspector-copy";

  let {
    url,
    oncopied,
    label = SHARE_SNAPSHOT,
  }: {
    /** The share link, ALREADY COMPOSED upstream on every knob change; never computed or awaited here. */
    url: string;
    /** A successful copy, for the region's one polite live region; this component holds none. */
    oncopied?: () => void;
    /** The resting label, the PDF's Share snapshot by default; the confirmed label is copy.ts's Link copied (D-23). */
    label?: string;
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
    // No await before this call: Safari expires the transient user activation across an
    // await and writeText then rejects with NotAllowedError (05-RESEARCH). A branch, not
    // `clipboard?.writeText(url).then(...) ?? fellBack()`, because that expression
    // statement fails @typescript-eslint/no-unused-expressions; the semantics are the same.
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(copied, fellBack);
    } else {
      fellBack();
    }
  }
</script>

<div class="share">
  <button
    class="control pill"
    class:confirmed
    type="button"
    data-testid="copy-link"
    aria-describedby={fallback ? "copy-link-line" : undefined}
    onclick={copy}
  >
    {confirmed ? LINK_COPIED : label}
  </button>

  <!-- The fallback line names a next step, so R-11 keeps it; aria-describedby follows it and points at nothing in the normal state. SHARE_QUIET_LINE is retired (R-07). -->
  {#if fallback}
    <p class="line" id="copy-link-line">{SHARE_FALLBACK_LINE}</p>
  {/if}

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
    align-items: stretch;
  }

  /* Phase 4's secondary treatment, sentence case since 13-19 (D-05); the hairline and no fill are src/app.css's .pill (A-41); the 44px floor is this control's; the cell's width (change 16b). Enabled, so its label is --color-ink. */
  .control {
    appearance: none;
    inline-size: 100%;
    min-block-size: 44px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
    color: var(--color-ink);
    cursor: pointer;
    transition: border-color 140ms ease-out;
  }

  .control:hover,
  .control.confirmed {
    border-color: var(--color-action);
  }

  /* Body role, quiet. 8px below the control: the button-to-reason gap. */
  .line {
    margin: 8px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /* 16px is the iOS zoom floor, not a type choice - the field is select()ed the instant it appears; monospace because a URL is machine text. */
  .field {
    inline-size: 100%;
    min-block-size: 44px;
    margin-block-start: 8px;
    padding-inline: 12px;
    border: 1px solid var(--color-boundary);
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
