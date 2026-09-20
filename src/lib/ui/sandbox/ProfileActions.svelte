<!--
  The Grid Editor profile controls (change 13C, suggestion 10): Export for Grid Editor - the
  surface's five strings as the Editor's own profile file, disabled with its reason while the
  landing is measuring or over the budget - and Import a profile, a file input dressed as the
  same outlined box, whose text the route reads back through share/profile.ts. The outcome line
  sits beside them. Props: exportReason (the disabled reason, or undefined), outcome, onexport,
  onimport (the file's text). The strings are share/profile-copy.ts's. Square (D-01).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import {
    EXPORT_PROFILE,
    EXPORT_PROFILE_HELPER,
    IMPORT_PROFILE,
    IMPORT_PROFILE_HELPER,
  } from "$lib/share/profile-copy";
  import { EXPORT_ACCEPT } from "$lib/store/transfer";

  let {
    exportReason,
    outcome,
    onexport,
    onimport,
  }: {
    /** Why the export cannot run now; undefined when it can. */
    exportReason?: string | undefined;
    /** The last export's or import's line, while shown. */
    outcome?: string | undefined;
    onexport: () => void;
    /** A file chosen: its text. */
    onimport: (text: string) => void;
  } = $props();

  const uid = $props.id();
  const exportHelperId = `${uid}-export-helper`;
  const importHelperId = `${uid}-import-helper`;

  /** The chosen file read as text, the input cleared so the same file can be chosen again. */
  async function read(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file === undefined) return;
    const text = await file.text();
    input.value = "";
    onimport(text);
  }
</script>

<div class="profile" data-testid="profile-actions">
  {#if outcome !== undefined}
    <span
      class="outcome type-helper"
      role="status"
      data-testid="profile-outcome">{outcome}</span
    >
  {/if}
  <button
    class="outlined"
    type="button"
    data-testid="export-profile"
    disabled={exportReason !== undefined}
    title={exportReason ?? EXPORT_PROFILE_HELPER}
    aria-describedby={exportHelperId}
    onclick={onexport}>{EXPORT_PROFILE}</button
  >
  <label class="outlined file" title={IMPORT_PROFILE_HELPER}>
    <input
      class="sr-only"
      type="file"
      accept={EXPORT_ACCEPT}
      data-testid="import-profile"
      aria-describedby={importHelperId}
      onchange={(event) => void read(event)}
    />
    {IMPORT_PROFILE}
  </label>
  <p class="sr-only" id={exportHelperId}>
    {exportReason ?? EXPORT_PROFILE_HELPER}
  </p>
  <p class="sr-only" id={importHelperId}>{IMPORT_PROFILE_HELPER}</p>
</div>

<style>
  .profile {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    min-inline-size: 0;
  }

  /* The outcome gives way beside its boxes: it shrinks and folds, never the boxes. */
  .outcome {
    min-inline-size: 0;
    overflow-wrap: anywhere;
    text-align: end;
    color: var(--color-ink-quiet);
  }

  .outlined {
    display: inline-flex;
    align-items: center;
    flex: none;
    box-sizing: border-box;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 12px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    white-space: nowrap;
    color: var(--color-ink);
    cursor: pointer;
  }

  .outlined:hover:not(:disabled) {
    border-color: var(--color-action);
  }

  .outlined:disabled {
    color: var(--color-ink-quiet);
    cursor: default;
  }

  /* The file box is a label round a visually hidden input: the input keeps the tab stop and the label the look. */
  .file:has(:focus-visible) {
    outline: 2px solid var(--color-action);
    outline-offset: 2px;
  }
</style>
