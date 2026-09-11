<!--
  The My configs table (plan 13-13; PDF page 4; Bible section 11).

  A TABLE, NOT A CARD GRID. Section 11 says "each item shows a preview, title,
  kind, timestamp/status" and draws nothing; the PDF draws a table, and the
  table wins because a timestamp and a status are columns. Four heads at the
  11px uppercase role over a 1px rule - CONFIGURATION, TYPE, LAST EDITED,
  STATUS - and 78px rows separated by 1px rules, each carrying a 56 x 56 LIVE
  thumbnail, the name over `ZONA · Personal configuration`, the type in
  sentence case, the moment in words, a status chip and a small outlined
  `Open`. A real <table> with <th scope="col">, so a screen reader gets the
  column a value sits in; the thumbnail column has an empty head because the
  PDF's has none and a picture needs no caption of its own.

  TWO WORDS FOR TWO OBJECTS, NEVER ONE FOR THREE (section 9). The chip says
  `Draft` in the action colour for a drafts.ts record and `Saved` neutral for
  a library.ts record, and nothing else - what is on the device is the
  install store's word and is not in this table. The chip is a RECTANGLE
  (D-01); this file takes no allowlist row.

  THE THUMBNAIL IS LIVE. Every row renders PadFrame + PadCanvas and hands the
  canvas up through `onready`; the route owns the page's ONE SimHost and
  registers the canvas with an engine built for the record's source entry.
  Nothing here stores a picture (13-06's rule) and nothing here reaches the
  simulator: the words `vendor`, `engine` and `catalog` appear in this comment
  and in no import. A sandbox record's face is unlit until 13-15's surface
  engine exists - the frame and the dot field are drawn, the canvas is never
  registered - and that is a known stub, named in 13-13-SUMMARY.md.

  BEYOND THE PDF, THREE QUIET ACTIONS PER ROW - `Rename`, `Export`, `Delete` -
  and, when the route hands over collections, an `Add to collection` select.
  Section 11 requires named copies, export/import and deletion with undo and
  the PDF's row draws only `Open`, so the extra controls are 13px, quiet,
  and in a fifth column with no head; the words are HANGAR's and ledgered.
  Rename is inline: the name becomes a field, Enter or blur commits, Escape
  cancels, and the field is labelled by the record's own name.

  THE EMPTY STATES ARE THE ROUTE'S SENTENCES, passed in, because which one
  applies (nothing saved yet, a search that found nothing, a collection with
  no members) is the route's knowledge and section 16's line for the search
  miss is reused verbatim there.

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
    onready,
    onrename,
    onexport,
    ondelete,
    onfile,
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
    /** Add a record to a collection. */
    onfile?: (record: StoredRecord, collectionId: string) => void;
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
  const HEAD_ACTIONS = "Actions";
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
          <td class="edited-cell numerals" data-testid="library-edited"
            >{row.edited}</td
          >
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

  .status-cell {
    white-space: nowrap;
  }

  /*
    The chip: a rectangle (D-01), 13px, the two words for the two objects.
    Draft in the action colour, Saved neutral - both on the raised surface.
  */
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

  /* Open: a small outlined rectangle at the floor. */
  .open {
    display: inline-grid;
    place-items: center;
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
