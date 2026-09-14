<!--
  The rail's way back: the PDF's "All configs" link, one label, two behaviours
  (D-19, W-01). No props. It renders nothing on /playground/, decided from
  page.url.pathname ALONE: search and searchParams THROW on a prerendered route
  (Kit's disable_search). The return record is read after mount, never at init and
  never through a $derived - sessionStorage does not exist during prerender - so
  the prerendered file carries the plain anchor and hydration upgrades it to the
  button when this tab holds a record. Returning is a goto to the recorded
  address with noScroll, never history.back() (05.1-RESEARCH Pitfall 8) and never
  replaceState (RETURN_OPTIONS says why). The store is fetched through a function, guarded.
  Decided at 05.1-04 / 13-09 (W-01, D-19); see .planning/phases/05.1-catalog-browse/05.1-04-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import {
    readBrowseReturn,
    type BrowseReturn,
    type ReturnStore,
  } from "$lib/browse/return";
  import { ALL_CONFIGS } from "$lib/tune/inspector-copy";

  /** The one route on which this slot is not offered, and the only one it
      ever navigates to. */
  const BROWSE_PATH = "/playground/";

  /**
   * noScroll: /playground/ restores its own recorded offset on mount. NOT replaceState,
   * tried and measured on a served build: Kit 2.70.3's navigate() leaves the navigation
   * index where it was on a replacing navigation, so the next Back takes the shallow
   * popstate branch and the address bar reads /playground/ghost/ over the browse screen.
   * One history entry per round trip is the price.
   */
  const RETURN_OPTIONS = { noScroll: true };

  /** The recorded way back, or undefined; assigned once, on mount (nothing on the server could derive it). */
  let recorded: BrowseReturn | undefined = $state(undefined);

  /** The session store, or undefined. /playground/ guards it the same way. */
  function returnStore(): ReturnStore | undefined {
    try {
      return window.sessionStorage;
    } catch {
      return undefined;
    }
  }

  onMount(() => {
    recorded = readBrowseReturn(returnStore());
  });

  /** Pathname only (search and searchParams throw on a prerendered route), and EXACT: a startsWith would hide this slot on every /playground/<id>/. */
  const onBrowse = $derived(page.url.pathname === BROWSE_PATH);

  /**
   * Go where the visitor was: an address, not a count of history entries. Rebuilt
   * through resolve() so svelte/no-navigation-without-resolve is satisfied by the call,
   * and so only the recorded QUERY is carried - the path is this file's own literal, and a
   * poisoned record can put nothing worse than a nonsense query on /playground/ (W-12).
   * void, not await: nothing waits on a navigation that removes its own page.
   */
  function toRecorded(): void {
    const target = recorded;
    if (target === undefined) return;
    const mark = target.href.indexOf("?");
    const search = mark === -1 ? "" : target.href.slice(mark + 1);
    if (search === "") void goto(resolve(BROWSE_PATH), RETURN_OPTIONS);
    else void goto(resolve(`/playground/?${search}`), RETURN_OPTIONS);
  }
</script>

{#if !onBrowse}
  {#if recorded === undefined}
    <!-- The prerendered, cold-arrival and new-tab case: a real anchor, so middle-click and a links list work. -->
    <a
      class="browse-link"
      href={resolve("/playground/")}
      data-testid="browse-link"
      data-way="all">{ALL_CONFIGS}</a
    >
  {:else}
    <!-- A button, because this restores a scroll offset that a middle-click could not carry into a new tab. Same words. -->
    <button
      class="browse-link"
      type="button"
      data-testid="browse-link"
      data-way="back"
      onclick={toRecorded}>{ALL_CONFIGS}</button
    >
  {/if}
{/if}

<style>
  /* Rail.svelte's row treatment: the sans face at 15px, no fill, the raised fill on hover; a 44px box on both axes. */
  .browse-link {
    appearance: none;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 12px;
    border: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.3;
    text-align: start;
    text-decoration: none;
    white-space: nowrap;
    color: var(--color-ink);
    cursor: pointer;
    transition: background-color 160ms ease-out;
  }

  .browse-link:hover {
    background: var(--color-raised);
  }

  @media (prefers-reduced-motion: reduce) {
    .browse-link {
      transition: none;
    }
  }
</style>
