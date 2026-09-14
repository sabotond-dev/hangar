<!--
  The My configs table, PDF page 4: a real <table> with <th scope="col"> - an
  empty head over the 56 x 56 LIVE thumbnail, CONFIGURATION, TYPE, LAST EDITED,
  STATUS - 78px rows ruled beneath, a status chip (Draft in the action colour for
  a drafts.ts record, Saved neutral for a library.ts one; never a device word)
  and a small outlined Open; beyond the PDF, Rename (inline), Export, Delete and
  an Add to collection select, 13px and quiet. Props: rows (LibraryRow), empty
  (the route's sentence), collections, memberOf, the seven callbacks, removeFrom.
  Nothing here stores a picture or reaches the simulator: the route owns the page's
  one SimHost and registers each canvas handed up through onready. Rectangles (D-01).
  Decided at 13-13 (Bible section 11); see .planning/phases/13-gui-overhaul/13-13-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import type { StoredRecord } from "$lib/store/schema";
  import PadCanvas from "$lib/ui/PadCanvas.svelte";
  import PadFrame from "$lib/ui/PadFrame.svelte";
  import { RECORD_SUBLINE, STATUS_WORDS, type Status } from "./words";

  export interface LibraryRow {
    record: StoredRecord;
    /** drafts.ts's record or library.ts's - the chip's word. */
    status: Status;
    /** The TYPE column, already in sentence case. */
    type: string;
    /** The LAST EDITED column, already in words. */
    edited: string;
    /** Where `Open` goes; resolved by the route. */
    href: ResolvedPathname;
    /** True when the route has an engine for this record's thumbnail. */
    live: boolean;
  }

  export interface CollectionOption {
    id: string;
    name: string;
  }

  let {
    rows,
    empty,
    collections = [],
    memberOf = () => [],
    removeFrom,
    onready,
    onrename,
    onexport,
    ondelete,
    onfile,
    onunfile,
  }: {
    rows: readonly LibraryRow[];
    /** The sentence shown when there are no rows. */
    empty: string;
    /** Every collection, for the per-row select; empty hides the control. */
    collections?: readonly CollectionOption[];
    /** The ids of the collections a record is in. */
    memberOf?: (recordId: string) => readonly string[];
    onready: (id: string, canvas: HTMLCanvasElement) => void;
    onrename: (record: StoredRecord, name: string) => void;
    onexport: (record: StoredRecord) => void;
    ondelete: (record: StoredRecord) => void;
    /** The collection the table is showing, when it is showing one: every row offers Remove. */
    removeFrom?: CollectionOption;
    /** Add a record to a collection. */
    onfile?: (record: StoredRecord, collectionId: string) => void;
    /** Take a record out of `removeFrom`; the record itself stays. */
    onunfile?: (record: StoredRecord, collectionId: string) => void;
  } = $props();

  /* The PDF's column heads and row words, verbatim. */
  const HEAD_CONFIGURATION = "CONFIGURATION";
  const HEAD_TYPE = "TYPE";
  const HEAD_EDITED = "LAST EDITED";
  const HEAD_STATUS = "STATUS";
  const OPEN = "Open";
  const OPEN_GLYPH = "↗";

  /* HANGAR's own, ledgered in 13-COPY-NEW.md (13-13). */
  const RENAME = "Rename";
  const EXPORT = "Export";
  const DELETE = "Delete";
  const ADD_TO_COLLECTION = "Add to collection";
  const REMOVE = "Remove";
  const HEAD_ACTIONS = "Actions";
  const removeName = (name: string, collection: string) =>
    `Remove ${name} from ${collection}`;
  const renameName = (name: string) => `Rename ${name}`;
  const exportName = (name: string) => `Export ${name} as a file`;
  const deleteName = (name: string) => `Delete ${name}`;
  const fileName = (name: string) => `Add ${name} to a collection`;

  /** The row being renamed, and the name as typed. */
  let renaming: string | undefined = $state(undefined);
  let typed = $state("");

  function startRename(record: StoredRecord): void {
    renaming = record.id;
    typed = record.name;
  }

  function commitRename(record: StoredRecord): void {
    if (renaming !== record.id) return;
    const name = typed.trim();
    renaming = undefined;
    if (name.length > 0 && name !== record.name) onrename(record, name);
  }

  function cancelRename(): void {
    renaming = undefined;
  }

  function renameKeys(event: KeyboardEvent, record: StoredRecord): void {
    if (event.key === "Enter") {
      event.preventDefault();
      commitRename(record);
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelRename();
    }
  }

  /** The collections a record is NOT yet in: what the select offers. */
  function offered(record: StoredRecord): readonly CollectionOption[] {
    const have = new Set(memberOf(record.id));
    return collections.filter((collection) => !have.has(collection.id));
  }

  function fileChanged(event: Event, record: StoredRecord): void {
    const select = event.currentTarget as HTMLSelectElement;
    const id = select.value;
    select.value = "";
    if (id.length > 0) onfile?.(record, id);
  }

  /** Focus the rename field the moment it mounts. */
  function focusOnMount(node: HTMLInputElement): void {
    node.focus();
    node.select();
  }
</script>

{#if rows.length === 0}
  <p class="empty" data-testid="library-empty">{empty}</p>
{:else}
  <table class="library" data-testid="library-table">
    <thead>
      <tr>
        <th scope="col" class="head thumb-head"
          ><span class="sr-only">Preview</span></th
        >
        <th scope="col" class="head type-micro">{HEAD_CONFIGURATION}</th>
        <th scope="col" class="head type-micro">{HEAD_TYPE}</th>
        <th scope="col" class="head type-micro">{HEAD_EDITED}</th>
        <th scope="col" class="head type-micro">{HEAD_STATUS}</th>
        <th scope="col" class="head"
          ><span class="sr-only">{HEAD_ACTIONS}</span></th
        >
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row.record.id)}
        <tr
          data-testid="library-row"
          data-record={row.record.id}
          data-status={row.status}
        >
          <td class="thumb-cell">
            <div class="thumb" class:unlit={!row.live}>
              <PadFrame entry={{ id: row.record.id }}>
                {#if row.live}
                  <PadCanvas
                    entry={{ id: row.record.id, name: row.record.name }}
                    {onready}
                  />
                {/if}
              </PadFrame>
            </div>
          </td>
          <td class="name-cell">
            {#if renaming === row.record.id}
              <input
                class="rename type-field"
                type="text"
                data-testid="library-rename-field"
                aria-label={renameName(row.record.name)}
                bind:value={typed}
                use:focusOnMount
                onblur={() => commitRename(row.record)}
                onkeydown={(event) => renameKeys(event, row.record)}
              />
            {:else}
              <span class="name" data-testid="library-name"
                >{row.record.name}</span
              >
            {/if}
            <span class="subline type-helper">{RECORD_SUBLINE}</span>
          </td>
          <td class="type-cell" data-testid="library-type">{row.type}</td>
          <td class="edited-cell" data-testid="library-edited">{row.edited}</td>
          <td class="status-cell">
            <span
              class="chip {row.status}"
              data-testid="library-status"
              data-status={row.status}>{STATUS_WORDS[row.status]}</span
            >
            <a class="open" href={row.href} data-testid="library-open"
              >{OPEN} <span aria-hidden="true">{OPEN_GLYPH}</span></a
            >
          </td>
          <td class="actions-cell">
            <div class="actions">
              <button
                class="quiet"
                type="button"
                data-testid="library-rename"
                aria-label={renameName(row.record.name)}
                onclick={() => startRename(row.record)}>{RENAME}</button
              >
              <button
                class="quiet"
                type="button"
                data-testid="library-export"
                aria-label={exportName(row.record.name)}
                onclick={() => onexport(row.record)}>{EXPORT}</button
              >
              <button
                class="quiet"
                type="button"
                data-testid="library-delete"
                aria-label={deleteName(row.record.name)}
                onclick={() => ondelete(row.record)}>{DELETE}</button
              >
              {#if removeFrom !== undefined}
                <button
                  class="quiet"
                  type="button"
                  data-testid="library-unfile"
                  aria-label={removeName(row.record.name, removeFrom.name)}
                  onclick={() => onunfile?.(row.record, removeFrom.id)}
                  >{REMOVE}</button
                >
              {/if}
              {#if collections.length > 0 && offered(row.record).length > 0}
                <select
                  class="file"
                  data-testid="library-file"
                  aria-label={fileName(row.record.name)}
                  value=""
                  onchange={(event) => fileChanged(event, row.record)}
                >
                  <option value="">{ADD_TO_COLLECTION}</option>
                  {#each offered(row.record) as collection (collection.id)}
                    <option value={collection.id}>{collection.name}</option>
                  {/each}
                </select>
              {/if}
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style>
  .library {
    inline-size: 100%;
    border-collapse: collapse;
    font-family: var(--font-sans);
    color: var(--color-ink);
  }

  /* The heads: 11px uppercase secondary over the 1px rule. */
  .head {
    padding: 0 12px 12px;
    border-block-end: 1px solid var(--color-divider);
    text-align: start;
    font-weight: 700;
    color: var(--color-ink-quiet);
  }

  .thumb-head {
    inline-size: 56px;
    padding-inline: 0;
  }

  /* 78px rows, ruled beneath. */
  td {
    block-size: 78px;
    padding: 11px 12px;
    border-block-end: 1px solid var(--color-divider);
    vertical-align: middle;
  }

  .thumb-cell {
    inline-size: 56px;
    padding-inline: 0;
  }

  /* 56 x 56, the PDF's measure; PadFrame draws the frame inside it. */
  .thumb {
    inline-size: 56px;
    block-size: 56px;
  }

  .name-cell {
    min-inline-size: 0;
  }

  /* The name at ~19px in the display face over the 13px quiet line. */
  .name {
    display: block;
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 700;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }

  .subline {
    display: block;
    margin-block-start: 4px;
    color: var(--color-ink-quiet);
  }

  /* The inline rename field: a rectangle at the floor, the name's own width. */
  .rename {
    box-sizing: border-box;
    inline-size: min(100%, 32ch);
    min-block-size: 44px;
    padding-inline: 12px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    appearance: none;
    background: transparent;
    color: var(--color-ink);
  }

  .type-cell,
  .edited-cell {
    font-size: 15px;
    white-space: nowrap;
    color: var(--color-ink);
  }

  /* The moment in the sans face with tabular numerals, so a column of times lines up. */
  .edited-cell {
    font-variant-numeric: tabular-nums;
  }

  .status-cell {
    white-space: nowrap;
  }

  /* The chip: a rectangle (D-01), 13px, Draft in the action colour, Saved neutral, both on the raised surface. */
  .chip {
    display: inline-grid;
    place-items: center;
    min-inline-size: 64px;
    min-block-size: 28px;
    padding-inline: 12px;
    margin-inline-end: 12px;
    background: var(--color-raised);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--color-ink-quiet);
  }

  .chip.draft {
    color: var(--color-action);
  }

  /* Open: a small outlined rectangle at the floor, the arrow beside the word. */
  .open {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    white-space: nowrap;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.2;
    text-decoration: none;
    color: var(--color-ink);
    transition: border-color 140ms ease-out;
  }

  .open:hover {
    border-color: var(--color-action);
    color: var(--color-ink);
  }

  .actions-cell {
    white-space: nowrap;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* The three quiet actions: borderless, 13px, the ink on hover, 44px hit areas. */
  .quiet {
    min-inline-size: 44px;
    min-block-size: 44px;
    padding-inline: 8px;
    border: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.2;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 160ms ease-out;
  }

  .quiet:hover {
    color: var(--color-ink);
  }

  /* The collection select, the same quiet weight, a rectangle. */
  .file {
    box-sizing: border-box;
    min-block-size: 44px;
    padding-inline: 8px;
    border: 1px solid transparent;
    border-radius: 0;
    appearance: none;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    color: var(--color-ink-quiet);
    cursor: pointer;
  }

  .file:hover {
    color: var(--color-ink);
    border-color: var(--color-boundary);
  }

  .file option {
    background: var(--color-panel);
    color: var(--color-ink);
  }

  .empty {
    margin: 24px 0 0;
    max-inline-size: 62ch;
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /* Below 1024 the type and the moment leave the row (the compact and stacked bands). */
  @media (max-width: 1023px) {
    .type-cell,
    .edited-cell,
    .head:nth-child(3),
    .head:nth-child(4) {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .open,
    .quiet {
      transition: none;
    }
  }
</style>
