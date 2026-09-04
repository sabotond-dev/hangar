<!--
  The wall: sixteen live pads in a grid of links, one clock, one tab stop.

  Almost nothing here is new machinery, and that is the point. SimHost,
  PadFrame, PadCanvas and createEngine already do everything a live card wall
  needs, and src/routes/dev/catalog/+page.svelte is the working precedent for
  mounting a card behind a dynamic import. Anything in this file that starts to
  look like new simulator or new canvas machinery is a signal that the wrong
  path is being taken.

  A PLAIN LIST OF LINKS, NOT A LISTBOX AND NOT A GRID. This component renders a
  <ul role="list"> of <li>, each holding one real anchor. It is deliberately not
  role="listbox" and deliberately not role="grid": both REPLACE the link role,
  and with it a screen reader's links list - which is how a non-sighted visitor
  surveys a page of sixteen destinations - middle-click, and open-in-new-tab.
  Phase 4 was right to make the coverflow a listbox, because a coverflow SELECTS
  a centred value; a grid of links NAVIGATES, and the two want opposite
  semantics (W-07). The roving tabindex that buys back the single tab stop a
  listbox would have given is the next task in this plan.

  ONE SimHost, ONE requestAnimationFrame. The host owns the page's only
  animation frame and this file never asks for one of its own: N loops is N
  times the scheduler overhead and N chances to desync. The post-update repaint
  below is sequenced with Svelte's tick(), which is a microtask, not a frame.

  A CARD IS A PICTURE, NOT AN INSTRUMENT (W-15). host.setHero(undefined) is
  called once and never called with an id, so the sampler delivers nothing to
  any card's engine, at any width, under any pointer. No `onpointerdown`,
  `onpointermove` or `onpointerup` handler is installed on a card, a list item or
  the list - the words appear in this sentence and in no attribute, which is why
  every structural scan over this file strips comments first. A pointerdown on a
  card is the beginning of a click that opens the detail view, and delivering it
  to the simulator as well would make the card's most common gesture ambiguous.
  The instrument is the detail view, where the hero already plays.

  ENGINES ARE BUILT LAZILY, PER CARD, ON FIRST INTERSECTION. That single line is
  what keeps a visitor who never brings a Lua card into view from downloading the
  271 KB VM. Three properties decide whether the claim is true, and each carries
  its own comment below: the import of $lib/sim/engine is INSIDE the intersection
  callback rather than in onMount or at module scope; the build decision is per
  card rather than for the whole page; and the engine map is a plain Map.

  TWO OBSERVERS, TWO QUESTIONS. SimHost exposes no visibility callback and is not
  gaining one. This component keeps its own tiny IntersectionObserver for the
  BUILD decision while SimHost goes on owning the TICK decision, on the same
  { threshold: 0, rootMargin: "200px" } geometry. A card therefore starts loading
  its engine slightly before it is on screen, and starts ticking when the host's
  own observer says so.

  ALL OF THEM MOUNT AND NONE IS UNMOUNTED OFFSCREEN (W-16). An observer-paused
  card costs literally zero, and unmounting would restart an engine a visitor is
  about to scroll back to. Documented ceiling: past roughly 40 entries, revisit
  with lazy mounting or virtualisation - the limit there is compositor memory for
  mounted canvases, not simulation.

  THE GRID NEVER ANIMATES ITS OWN LAYOUT. No FLIP, no stagger, no fade-in, 0 ms
  on a filter change (W-11). Animating sixteen live canvases through a reflow
  fights the shared rAF loop for exactly the frames the pads need, and the pads
  are the motion on this page.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import type { ListingEntry } from "$lib/catalog/listing";
  import { SimHost, type HostEngine } from "$lib/sim/host";
  import CatalogCard from "./CatalogCard.svelte";

  let {
    entries,
    total = entries.length,
    emptyReason,
    onreorder,
  }: {
    /** Already sorted and filtered by the page. This component never sorts. */
    entries: readonly ListingEntry[];
    /**
     * The size of the unfiltered catalog, which is what tells the two empty
     * states apart: nothing matched a filter, or the catalog file itself is
     * empty. Defaults to the rendered count, so a grid handed nothing and told
     * nothing reads as an empty shelf.
     */
    total?: number;
    /**
     * The by-condition sentence for an empty result, supplied by the page -
     * which is the only place that knows whether a query, a set of tags or both
     * produced the miss.
     */
    emptyReason?: string;
    /** Optional hook so the page can flush its address after a reorder. */
    onreorder?: () => void;
  } = $props();

  /** Only these cross into the markup. Everything else is a plain binding. */
  let building: string[] = $state([]);
  let unavailable: string[] = $state([]);

  // Plain bindings, deliberately outside the reactive graph.
  let host: SimHost | undefined;
  let observer: IntersectionObserver | undefined;
  let mounted = false;
  let lastOrder: string | undefined;

  // Plain Maps and a plain Set, never their Svelte counterparts. The lint rule
  // assumes a mutable collection is a missed reactivity opportunity; here it is
  // the opposite. A SvelteMap is a reactive proxy, and a proxy trap around an
  // engine that is read on every one of the 100 ticks a second is a silent
  // performance cliff (04-RESEARCH Pitfall 3). None of them is ever read from
  // the markup, so nothing needs to react to them.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const engines = new Map<string, HostEngine>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const elements = new Map<string, HTMLCanvasElement>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const ids = new Map<Element, string>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const started = new Set<string>();

  /**
   * PadCanvas hands its element over from its own onMount, which runs before
   * this component's. The element is held until an engine exists for it, and
   * the build observer starts watching it here - the canvas is the card's own
   * geometry, and it is the element SimHost observes too.
   */
  function collect(id: string, canvas: HTMLCanvasElement): void {
    elements.set(id, canvas);
    ids.set(canvas, id);
    adopt(id);
    observer?.observe(canvas);
  }

  /**
   * register(), not replaceEngine(): this canvas has never been registered.
   * register() sets intersecting: false and paints once immediately, so a card
   * shows its frame and dot field from the prerendered HTML and its canvas fills
   * in when its engine arrives; the host's own observer then wakes it.
   */
  function adopt(id: string): void {
    const canvas = elements.get(id);
    const engine = engines.get(id);
    if (host === undefined || canvas === undefined || engine === undefined) {
      return;
    }
    host.register(id, canvas, engine);
  }

  /**
   * Build one card's engine, once, on its first intersection.
   *
   * THE IMPORT IS HERE AND NOT IN onMount. onMount runs on load, which is
   * precisely the moment plan 05.1-10's cold-load assertion is taken: a static
   * import - or a dynamic one at mount - would put the Lua VM's module graph,
   * and with it the fingerprinted glue.wasm URL, on the page's critical path.
   *
   * THE DECISION IS PER CARD. A page filtered to one ported entry builds one
   * PadSim and never touches the Lua branch at all, because no Lua card ever
   * intersects.
   *
   * One entry that cannot be built is skipped and reported, exactly as
   * Coverflow does. A failed lazy import is a real, reachable failure - a
   * network that drops mid-scroll rejects it - and it falls to the unavailable
   * plate on that one card alone. The wall never blanks.
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

  onMount(() => {
    mounted = true;
    host = new SimHost();
    // No card is ever the hero. The sampler holds no contact for a browse
    // screen, so nothing is delivered to any card's engine on any tick.
    host.setHero(undefined);
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (records) => {
          for (const record of records) {
            if (!record.isIntersecting) continue;
            const id = ids.get(record.target);
            if (id !== undefined) void build(id);
          }
        },
        // The same geometry the host uses: a card starts fetching its engine
        // before it crosses the viewport edge rather than as it arrives.
        { threshold: 0, rootMargin: "200px" },
      );
      for (const [id, canvas] of elements) {
        ids.set(canvas, id);
        observer.observe(canvas);
      }
    } else {
      // No observer: build everything, exactly as the host treats a missing one
      // as "on screen", so a missing capability never shows a wall of blanks.
      for (const entry of entries) void build(entry.id);
    }
  });

  onDestroy(() => {
    // onDestroy runs during prerender, where none of this was ever created.
    if (!mounted) return;
    mounted = false;
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

    void (async () => {
      // A post-update tick, because the <li> elements have to have moved before
      // the repaint below means anything.
      await tick();
      if (!mounted || first) return;
      // A still pad does not tick, so nothing else would repaint it after its
      // <li> moved, and whether a canvas bitmap survives a re-parenting move is
      // not a question this repository wants to depend on (Pitfall 10).
      host?.repaintAll();
      onreorder?.();
    })();
  });
</script>

{#if entries.length === 0}
  <div class="empty" data-testid="browse-empty">
    {#if total === 0}
      <!-- Phase 4's two strings, verbatim. Reusing them is what keeps a build
           failure distinguishable from a filter miss. -->
      <p class="empty-title">Nothing on the shelf</p>
      <p class="empty-body">
        The catalog file has no configurations in it. That is a build problem,
        not something you did.
      </p>
    {:else}
      <p class="empty-title">Nothing here matches</p>
      {#if emptyReason !== undefined}
        <p class="empty-body">{emptyReason}</p>
      {/if}
      <!-- CLEAR FILTERS is named because it is on the screen: the toolbar is
           still above this block. -->
      <p class="empty-next">
        CLEAR FILTERS brings back all {total} configurations.
      </p>
    {/if}
  </div>
{:else}
  <ul
    class="grid"
    data-testid="browse-grid"
    role="list"
    aria-label="ZONA configurations"
  >
    <!--
      Keyed by entry.id, so Svelte MOVES nodes instead of recreating them and a
      card that is still on screen keeps its engine and its canvas.
    -->
    {#each entries as entry, index (entry.id)}
      <CatalogCard
        {entry}
        tabbable={index === 0}
        pending={entry.preview === "lua" && building.includes(entry.id)}
        unavailable={unavailable.includes(entry.id)}
        onready={collect}
        onfocus={() => {}}
      />
    {/each}
  </ul>
{/if}

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 24px;
    align-items: start;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .empty {
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: start;
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

  /* Body: 16px / 400 / 1.5. An empty result is the filter working, so the
     next-step line is quiet prose and nothing here is an alarm. */
  .empty-body,
  .empty-next {
    margin: 0;
    max-inline-size: 62ch;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }

  .empty-next {
    color: var(--color-ink-quiet);
  }
</style>
