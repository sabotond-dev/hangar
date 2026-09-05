<!--
  The header's one right-hand slot: BROWSE ALL, or BACK TO BROWSE.

  One control with two labels, in one place on the screen (D-19, W-01). It is
  rendered by FrontDoor.svelte, so / and every /c/{id}/ get the identical slot
  and the two routes cannot drift apart. It never moves when a visitor chooses,
  it is header chrome rather than panel content, and it cannot be confused with
  an install control.

  THREE RULES, AND EACH OF THEM IS A DECISION.

  1. IT RENDERS NOTHING ON /browse/, and the decision is made from
     `page.url.pathname` ALONE. `page.url.search` and `page.url.searchParams`
     are the two properties a reflex would reach for, and both of them THROW on
     a prerendered route: Kit's respond.js and load_data.js call
     `disable_search(url)` whenever `state.prerendering`, and utils/url.js then
     redefines search and searchParams as accessors that raise. `pathname` is
     untouched by that, which is why it is the only part of the address this
     component is allowed to read. (The browse page never renders FrontDoor
     today, so this branch is a guard rather than a live case - it is here so
     that a future route which does render the header cannot accidentally offer
     a visitor a link to the page they are standing on. W-01.)

  2. THE RECORD IS READ AFTER MOUNT, NEVER AT INIT AND NEVER THROUGH A $derived
     OVER SOMETHING THE SERVER CAN SEE. `sessionStorage` does not exist during
     prerender, and it is per tab besides - so a BACK TO BROWSE baked into the
     prerendered HTML would be a lie in every visitor's first painted frame,
     including the ones who arrived cold from a shared link in a brand new tab.
     The prerendered file therefore carries BROWSE ALL, always, and hydration
     upgrades the label when this tab really does hold a record. That is the
     whole reason the record lives in a rune assigned from onMount rather than
     in a $derived: a $derived would have to derive from something, and there
     is nothing on the server to derive it from.

  3. RETURNING IS A goto, NEVER A history.back(). Phase 4's Coverflow.choose()
     performs pushState("", { chosen: true }), so a visitor who arrived from
     browse and then tapped the pad is TWO entries deep rather than one, and a
     history.back() would land them on the un-chosen detail page - short by an
     amount that depends on what they happened to do while they were here
     (05.1-RESEARCH.md, Pitfall 8). A recorded address is deterministic however
     many entries the detail page collected. `noScroll: true` rides along with
     it because the browse page restores its own recorded offset on mount and a
     scroll-to-top from Kit would fight it. `replaceState: true` does NOT - see
     RETURN_OPTIONS below, where the measurement that ruled it out is written
     down.

  THE STORE IS FETCHED THROUGH A FUNCTION, NOT CACHED. A property access on
  window.sessionStorage can itself throw in a browser configured to refuse
  storage, before any of return.ts's own try/catch blocks get a chance - so the
  guard is here, exactly as /browse/ does it.

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

  let {
    covered = false,
  }: {
    /** True while the splash covers the row. The wordmark's own treatment. */
    covered?: boolean;
  } = $props();

  /* Visitor-facing copy, verbatim from the Copywriting Contract, in one block.
     Consts rather than inline markup text: Prettier reflows element text and
     Phase 2 lost a load-bearing sentence to exactly that. */
  const BROWSE_ALL = "BROWSE ALL";
  const BACK_TO_BROWSE = "BACK TO BROWSE";

  /** The one route on which this slot is not offered, and the only one it
      ever navigates to. */
  const BROWSE_PATH = "/browse/";

  /**
   * How the recorded view is re-entered.
   *
   * `noScroll` because /browse/ restores its own recorded offset on mount and a
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
   * Coverflow.choose()'s `pushState` is what lines the two indices up. Observed
   * on a served production build with `replaceState: true`: browse to /c/ghost/,
   * tap the pad, press the control, then press the browser's Back - the address
   * bar reads /c/ghost/ while the browse screen is still on the page
   * (`[data-testid="browse"]` present, `[data-testid="front-door"]` absent,
   * still true five seconds later). Without it, the same Back lands on the
   * chosen /c/ghost/ correctly.
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

  /** The session store, or undefined. /browse/ guards it the same way. */
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

  /** Pathname only. Rule 1 in the header says why it is pathname only. */
  const onBrowse = $derived(page.url.pathname.startsWith(BROWSE_PATH));

  /**
   * Go where the visitor was. An address, not a count of history entries.
   *
   * THE ADDRESS IS REBUILT THROUGH resolve() RATHER THAN HANDED OVER WHOLE, and
   * that is two things at once. It is what satisfies
   * svelte/no-navigation-without-resolve with no suppression and no cast: the
   * rule accepts a resolve() call or a value whose type IS ResolvedPathname,
   * and `record.href` is a plain string read out of JSON, so it can never be
   * the second. Two statements rather than one ternary argument, because the
   * rule reads the call expression it is handed - the same shape /browse/ uses
   * for its own address writes.
   *
   * It is also the safety half. Only the recorded QUERY is carried across; the
   * path is this component's own literal. A record poisoned by anything else in
   * the origin therefore cannot send a visitor to an address of its choosing -
   * the worst it can do is put a nonsense query on /browse/, which the page
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
    else void goto(resolve(`/browse/?${search}`), RETURN_OPTIONS);
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
      class:covered
      href={resolve("/browse/")}
      data-testid="browse-link">{BROWSE_ALL}</a
    >
  {:else}
    <!--
      A button, because this is not a plain navigation: it restores a scroll
      offset and it replaces rather than pushes. Giving it an href would
      promise a middle-click that could not carry the record into a new tab.
    -->
    <button
      class="browse-link"
      class:covered
      type="button"
      data-testid="browse-link"
      onclick={toRecorded}>{BACK_TO_BROWSE}</button
    >
  {/if}
{/if}

<style>
  /*
    The shipped DISCONNECT ZONA treatment, which is Phase 4's only other quiet
    header-weight control: Micro, no border, no fill, quiet at rest. A bordered
    button here would outshout the wordmark it sits opposite (W-02).

    The 44px inline floor matters as much as the block one: BROWSE ALL is wide
    enough on its own, but the box is what a thumb aims at and the rule has to
    hold for whatever label the slot carries next.
  */
  .browse-link {
    appearance: none;
    display: grid;
    place-items: center;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-block: 0;
    padding-inline: 0;
    border: 0;
    background: transparent;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    text-decoration: none;
    white-space: nowrap;
    color: var(--color-ink-quiet);
    cursor: pointer;
    /*
      Two transitions, and they are two different jobs. The colour is the hover
      response. The opacity is the OPENING, and it uses the front door's own
      --arrive-ms and the wordmark's own curve so the two come up together and
      land as one. --arrive-ms is declared on .front-door, the ancestor that
      always wraps this control; it is 700ms, or 200ms under reduced motion.
    */
    transition:
      color 160ms ease-out,
      opacity var(--arrive-ms) cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  .browse-link:hover {
    color: var(--color-ink);
  }

  /*
    Held at nothing while the splash owns the screen, and NOT transitioned into
    that state - exactly the wordmark's rule, for exactly the wordmark's reason.
    The control must be invisible on the very first painted frame rather than
    fade out of one, which is a thing a visitor sees.
  */
  .browse-link.covered {
    opacity: 0;
    transition: none;
  }
</style>
