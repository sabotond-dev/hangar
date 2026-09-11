<!--
  The rail's way back: the PDF's `← All configs` (page 5), in one place.

  One control, ONE label since 13-09, two behaviours (D-19, W-01). It is
  rendered by the workspace's rail (src/routes/playground/[id]/+page.svelte)
  as the rail's lead, above the CONFIGURATIONS rows. Phase 5's BROWSE ALL and
  BACK TO BROWSE were two labels for the two behaviours below; the Bible's
  page 5 draws one link, so the label is the PDF's and the behaviour is still
  decided by the record. It never moves when a visitor tunes, it is rail
  chrome rather than panel content, and it cannot be confused with an install
  control.

  THREE RULES, AND EACH OF THEM IS A DECISION.

  1. IT RENDERS NOTHING ON /playground/, and the decision is made from
     `page.url.pathname` ALONE. `page.url.search` and `page.url.searchParams`
     are the two properties a reflex would reach for, and both of them THROW on
     a prerendered route: Kit's respond.js and load_data.js call
     `disable_search(url)` whenever `state.prerendering`, and utils/url.js then
     redefines search and searchParams as accessors that raise. `pathname` is
     untouched by that, which is why it is the only part of the address this
     component is allowed to read. (The gallery never renders this rail, so
     this branch is a guard rather than a live case - it is here so that a
     future route which does render it cannot accidentally offer a visitor a
     link to the page they are standing on. W-01.)

  2. THE RECORD IS READ AFTER MOUNT, NEVER AT INIT AND NEVER THROUGH A $derived
     OVER SOMETHING THE SERVER CAN SEE. `sessionStorage` does not exist during
     prerender, and it is per tab besides - so a way back baked into the
     prerendered HTML as a button would be a lie in every visitor's first
     painted frame, including the ones who arrived cold from a shared link in
     a brand new tab. The prerendered file therefore carries the plain link,
     always, and hydration upgrades it to the button when this tab really does
     hold a record. That is the whole reason the record lives in a rune
     assigned from onMount rather than in a $derived: a $derived would have to
     derive from something, and there is nothing on the server to derive it
     from.

  3. RETURNING IS A goto, NEVER A history.back(). A visitor who arrived from
     the gallery may have collected any number of history entries here, and a
     history.back() would land short by an amount that depends on what they
     happened to do (05.1-RESEARCH.md, Pitfall 8). A recorded address is
     deterministic however many entries the workspace collected. `noScroll:
     true` rides along with it because the gallery restores its own recorded
     offset on mount and a scroll-to-top from Kit would fight it.
     `replaceState: true` does NOT - see RETURN_OPTIONS below, where the
     measurement that ruled it out is written down.

  THE STORE IS FETCHED THROUGH A FUNCTION, NOT CACHED. A property access on
  window.sessionStorage can itself throw in a browser configured to refuse
  storage, before any of return.ts's own try/catch blocks get a chance - so the
  guard is here, exactly as /playground/ does it.

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
   * How the recorded view is re-entered.
   *
   * `noScroll` because /playground/ restores its own recorded offset on mount and a
   * scroll-to-top from Kit would fight it.
   *
   * AND NOT `replaceState`, WHICH WAS TRIED AND MEASURED. 05.1-UI-SPEC.md asks
   * for it so the round trip does not grow the history; on Kit 2.70.3 it breaks
   * the browser's Back button on this exact journey, and the plan's own
   * interfaces table asks for `{ noScroll: true }` alone.
   *
   * The mechanism, from Kit's own source. `navigate()` at client.js:1874 does
   * `const change = replace_state ? 0 : 1` and then bumps BOTH the history index
   * and the NAVIGATION index by `change` - so a replacing navigation leaves
   * `current_navigation_index` where it was. The popstate handler at
   * client.js:2886 decides whether a Back is a real navigation with
   * `navigation_index === current_navigation_index && has_navigated`, and takes
   * a SHALLOW branch when that holds: it updates `page.state` and the address
   * and renders nothing new.
   *
   * Observed on a served production build with `replaceState: true`: browse to
   * /playground/ghost/, press the control, then press the browser's Back - the
   * address bar reads /playground/ghost/ while the browse screen is still on
   * the page (`[data-testid="browse"]` present, still true five seconds
   * later). Without it, the same Back lands on /playground/ghost/ correctly.
   *
   * The price is one history entry per round trip. An address bar that lies
   * about what is on the screen is worth more than that.
   */
  const RETURN_OPTIONS = { noScroll: true };

  /**
   * The recorded way back, or undefined. Assigned once, on mount - see rule 2
   * in the header. Undefined on the server and in the first client frame.
   */
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

  /** Pathname only, and EXACT: every workspace lives under the same prefix
      since 13-08 (/playground/<id>/), so a startsWith would hide this slot on
      the very pages it exists for. Rule 1 in the header says why it is
      pathname only. */
  const onBrowse = $derived(page.url.pathname === BROWSE_PATH);

  /**
   * Go where the visitor was. An address, not a count of history entries.
   *
   * THE ADDRESS IS REBUILT THROUGH resolve() RATHER THAN HANDED OVER WHOLE, and
   * that is two things at once. It is what satisfies
   * svelte/no-navigation-without-resolve with no suppression and no cast: the
   * rule accepts a resolve() call or a value whose type IS ResolvedPathname,
   * and `record.href` is a plain string read out of JSON, so it can never be
   * the second. Two statements rather than one ternary argument, because the
   * rule reads the call expression it is handed - the same shape /playground/ uses
   * for its own address writes.
   *
   * It is also the safety half. Only the recorded QUERY is carried across; the
   * path is this component's own literal. A record poisoned by anything else in
   * the origin therefore cannot send a visitor to an address of its choosing -
   * the worst it can do is put a nonsense query on /playground/, which the page
   * already parses defensively (W-12).
   *
   * `void` rather than `await`: nothing here waits on the navigation, and an
   * async handler on a control that removes its own page is a promise nobody
   * is left to settle.
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
    <!--
      The prerendered case, and the cold-arrival case, and the new-tab case.
      A real anchor: it is a plain navigation to a real page, so middle-click
      and open-in-new-tab work and a screen reader lists it as a link.
    -->
    <a
      class="browse-link"
      href={resolve("/playground/")}
      data-testid="browse-link"
      data-way="all">{ALL_CONFIGS}</a
    >
  {:else}
    <!--
      A button, because this is not a plain navigation: it restores a scroll
      offset. Giving it an href would promise a middle-click that could not
      carry the record into a new tab. Same words: the PDF draws one link.
    -->
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
  /*
    The rail's own row treatment (Rail.svelte's .row): the sans face at 15px,
    no border, no fill, ink at rest and the raised fill on hover. A 44px box
    on both axes at every pointer - the site's floor is per control.
  */
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
