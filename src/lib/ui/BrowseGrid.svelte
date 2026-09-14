<!--
  The wall: the catalog's live pads in a <ul role="list"> of links - not a listbox
  and not a grid, which would replace the link role (W-07) - with ONE SimHost, one
  animation frame and ONE tabbable card (roving tabindex). Props: entries (already
  sorted and filtered), total, favorites, onfavorite, onreorder. Arrow keys are
  $lib/browse/grid's nextIndex (grid.spec.ts); Enter, Space and a modified arrow
  have no handler here. A card is a picture, not an instrument (W-15): setHero is
  never called with an id and no pointer handler is installed. Engines are built
  lazily, per card, on first intersection (the 271 KB VM stays off a cold load);
  every card mounts and none is unmounted offscreen (W-16, the ceiling measured at 09-10).
  Decided at 05.1-04 / 13-08 (W-07, W-15, W-16); see .planning/phases/13-gui-overhaul/13-08-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from "svelte";
  import {
    columnsForWidth,
    columnsFromTemplate,
    nextIndex,
  } from "$lib/browse/grid";
  import type { ListingEntry } from "$lib/catalog/listing";
  import type { DemoPath } from "$lib/sim/demo";
  import { SimHost, type HostEngine } from "$lib/sim/host";
  import { motionDeps } from "$lib/sim/motion.svelte";
  import CatalogCard from "./CatalogCard.svelte";

  let {
    entries,
    total = entries.length,
    favorites = [],
    onfavorite,
    onreorder,
  }: {
    /** Already sorted and filtered by the page. This component never sorts. */
    entries: readonly ListingEntry[];
    /** The unfiltered catalog's size, which tells a filter miss from an empty shelf; defaults to the rendered count. */
    total?: number;
    /** The starred ids, read by the page from the favorites store (13-08). */
    favorites?: readonly string[];
    /** A card's star was pressed; the page flips the store. */
    onfavorite?: (id: string) => void;
    /** Optional hook so the page can flush its address after a reorder. */
    onreorder?: () => void;
  } = $props();

  /* Section 16's row for no results, verbatim (plan 13-08). */
  const NO_RESULTS =
    "No configurations found. Try a different search or clear your filters.";

  const RESIZE_DEBOUNCE_MS = 200;

  /** Only these cross into the markup. Everything else is a plain binding. */
  let rovingIndex = $state(0);
  let building: string[] = $state([]);
  let unavailable: string[] = $state([]);

  /**
   * The one element reference that is a rune: nothing holding an ENGINE, a CANVAS or a
   * FRAME BUFFER goes into a rune (a proxy trap in a 100 Hz loop), and a <ul> is none of
   * the three. A rune because the binding sits inside an {#if}, where Svelte warns
   * non_reactive_update on a plain one; $state does not proxy a DOM element.
   */
  let list: HTMLUListElement | undefined = $state(undefined);

  // Plain bindings, deliberately outside the reactive graph.
  let host: SimHost | undefined;
  let observer: IntersectionObserver | undefined;
  let mounted = false;
  let lastOrder: string | undefined;
  let columns = 1;
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  /** The roving card's id, not only its index: a filter that removes it resets to the first card; one that moves it keeps the same card roving. */
  let rovingId: string | undefined;

  // Plain Maps and a plain Set: a SvelteMap is a reactive proxy, and a proxy trap around an
  // engine read on every tick is a silent performance cliff (04-RESEARCH Pitfall 3).
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const engines = new Map<string, HostEngine>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const elements = new Map<string, HTMLCanvasElement>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const ids = new Map<Element, string>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const started = new Set<string>();
  /** Each card's demonstration gesture, for the cards that have one (D-09); CatalogCard owns the lookup. */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const demos = new Map<string, DemoPath>();

  /** PadCanvas hands its element over from its own onMount, before this component's; held until an engine exists, and the build observer watches it. */
  function collect(
    id: string,
    canvas: HTMLCanvasElement,
    demo?: DemoPath,
  ): void {
    elements.set(id, canvas);
    ids.set(canvas, id);
    if (demo !== undefined) demos.set(id, demo);
    adopt(id);
    observer?.observe(canvas);
  }

  /** register(), not replaceEngine(): the canvas was never registered. It paints once immediately, so the prerendered frame fills in when the engine arrives. */
  function adopt(id: string): void {
    const canvas = elements.get(id);
    const engine = engines.get(id);
    if (host === undefined || canvas === undefined || engine === undefined) {
      return;
    }
    // The demo replays a dark card's authored gesture through its own TouchSampler (D-09).
    host.register(id, canvas, engine, { demo: demos.get(id) });
  }

  /**
   * Build one card's engine, once, on first intersection. The import is HERE, not in
   * onMount: onMount is the moment 05.1-10's cold-load assertion is taken. Per card, so
   * a page filtered to one ported entry never touches the Lua branch. A failed lazy
   * import falls to the unavailable plate on that one card; the wall never blanks.
   */
  async function build(id: string): Promise<void> {
    if (started.has(id)) return;
    started.add(id);
    building = [...building, id];
    try {
      const [{ createEngine }, { byId }] = await Promise.all([
        import("$lib/sim/engine"),
        import("$lib/catalog"),
      ]);
      if (!mounted) return;
      const configuration = byId(id);
      if (configuration === undefined) {
        throw new Error(`no catalog entry with id "${id}"`);
      }
      const engine = await createEngine(configuration);
      if (!mounted) return;
      engines.set(id, engine);
      adopt(id);
    } catch (error) {
      unavailable = [...unavailable, id];
      console.warn(
        `BrowseGrid: no simulator engine for "${id}"; its card reads unavailable.`,
        error,
      );
    } finally {
      building = building.filter((pending) => pending !== id);
    }
  }

  /** The live column count, read from the layout (the one source that cannot disagree with the screen); at least one, since the arrows divide by it. */
  function measureColumns(): void {
    if (list === undefined) return;
    const template = getComputedStyle(list).gridTemplateColumns;
    columns =
      template === "" || template === "none"
        ? columnsForWidth(list.clientWidth)
        : columnsFromTemplate(template);
  }

  /** Debounced: a resize fires per frame and is its own jank source. */
  function onResize(): void {
    if (resizeTimer !== undefined) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = undefined;
      measureColumns();
    }, RESIZE_DEBOUNCE_MS);
  }

  /** The list arrives as an argument: Svelte warns non_reactive_update on a bind:this target a template handler reads. */
  function focusCard(root: HTMLUListElement, index: number): void {
    const entry = entries[index];
    if (entry === undefined) return;
    root
      .querySelector<HTMLAnchorElement>(`[data-testid="card-name-${entry.id}"]`)
      ?.focus();
  }

  /** One keydown on the list, delegated to nextIndex; the modifier guard comes first, and an undefined return leaves Space and Enter alone. */
  function onKeyDown(
    event: KeyboardEvent & { currentTarget: HTMLUListElement },
  ): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    const next = nextIndex(event.key, rovingIndex, entries.length, columns);
    if (next === undefined) return;
    event.preventDefault();
    rovingIndex = next;
    rovingId = entries[next]?.id;
    focusCard(event.currentTarget, next);
  }

  onMount(() => {
    mounted = true;
    // os || still: the footer's control stills this wall as the OS setting does (13-04).
    host = new SimHost(motionDeps());
    // No card is ever the hero: nothing is delivered to any card's engine.
    host.setHero(undefined);
    measureColumns();
    window.addEventListener("resize", onResize);
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (records) => {
          for (const record of records) {
            if (!record.isIntersecting) continue;
            const id = ids.get(record.target);
            if (id !== undefined) void build(id);
          }
        },
        // The host's geometry: a card starts fetching before it crosses the viewport edge.
        { threshold: 0, rootMargin: "200px" },
      );
      for (const [id, canvas] of elements) {
        ids.set(canvas, id);
        observer.observe(canvas);
      }
    } else {
      // No observer: build everything, as the host treats a missing one as "on screen".
      for (const entry of entries) void build(entry.id);
    }
  });

  onDestroy(() => {
    // onDestroy runs during prerender, where none of this was ever created.
    if (!mounted) return;
    mounted = false;
    window.removeEventListener("resize", onResize);
    if (resizeTimer !== undefined) clearTimeout(resizeTimer);
    observer?.disconnect();
    observer = undefined;
    host?.destroy();
    host = undefined;
    engines.clear();
    elements.clear();
    ids.clear();
    started.clear();
  });

  $effect(() => {
    const order = entries.map((entry) => entry.id).join(" ");
    if (order === lastOrder) return;
    const first = lastOrder === undefined;
    lastOrder = order;

    untrack(() => {
      const rendered = entries.map((entry) => entry.id);
      const found = rovingId === undefined ? -1 : rendered.indexOf(rovingId);
      // A filter that removed the roving card resets the index to the first
      // one, and focus is deliberately NOT moved: stealing focus out of the
      // search field on a keystroke would make the field unusable.
      rovingIndex = found === -1 ? 0 : found;
      rovingId = rendered[rovingIndex];
    });

    void (async () => {
      // A post-update tick: the <li> elements have to have moved first.
      await tick();
      if (!mounted) return;
      // Re-read after a reorder too: a filter below one row changes what auto-fill did.
      measureColumns();
      if (first) return;
      // A still pad does not tick, and a canvas bitmap surviving a re-parenting move is not
      // a question this repository depends on (Pitfall 10).
      host?.repaintAll();
      onreorder?.();
    })();
  });
</script>

{#if entries.length === 0}
  <div class="empty" data-testid="browse-empty">
    {#if total === 0}
      <!-- Phase 4's two strings, verbatim: a build failure stays distinguishable from a filter miss. -->
      <p class="empty-title">Nothing on the shelf</p>
      <p class="empty-body">
        The catalog file has no configurations in it. That is a build problem,
        not something you did.
      </p>
    {:else}
      <!-- The filter miss: section 16's one line, and nothing else (13-08). -->
      <p class="empty-body">{NO_RESULTS}</p>
    {/if}
  </div>
{:else}
  <!--
    The listener is delegated: the anchors take focus and the key, and the handler moves
    focus between them; the listbox role the rule wants would destroy the link semantics.
    Kept apart from the svelte-ignore line: every word after the rule name there is
    parsed as another rule name.
  -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <ul
    class="grid"
    data-testid="browse-grid"
    role="list"
    aria-label="ZONA configurations"
    bind:this={list}
    onkeydown={onKeyDown}
  >
    <!-- Keyed by entry.id, so Svelte MOVES nodes and a card on screen keeps its engine and canvas. -->
    {#each entries as entry, index (entry.id)}
      <CatalogCard
        {entry}
        tabbable={index === rovingIndex}
        pending={entry.preview === "lua" && building.includes(entry.id)}
        unavailable={unavailable.includes(entry.id)}
        favorite={favorites.includes(entry.id)}
        {onfavorite}
        onready={collect}
        onfocus={() => {
          rovingIndex = index;
          rovingId = entry.id;
        }}
      />
    {/each}
  </ul>
{/if}

<style>
  .grid {
    display: grid;
    /* The PDF's three columns at 390 with a 24 gutter; auto-fill keeps the wall honest at every width. */
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    align-items: start;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* The empty state paints the workspace itself (A-56's exception; the registration field went at 13-04). */
  .empty {
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: start;
    background-color: var(--color-workspace);
  }

  /* Micro (title): 12px / 600 / 1.2 / 0.01em, sentence case. */
  .empty-title {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
    color: var(--color-ink);
  }

  /* Body: an empty result is the filter working, so the line is quiet prose. */
  .empty-body {
    margin: 0;
    max-inline-size: 62ch;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }
</style>
