<!--
  /guide/ - the Quick guide (change 26, BENCH-2026-09-16.txt section 26): a content page in the
  shell, as the Playground index and My configs are - the breadcrumb bar, the full footer, a
  centre that scrolls. The eyebrow, the one h1 and the lede; the contents (a named nav: in the
  rail from the compact band up, in the article under the lede below it); then the eight
  sections, each an h2 with an id for a deep link (/guide/#store), two to five sentences or a
  numbered list, a key drawn as a kbd in the house mono. Every word is src/lib/guide/copy.ts's.
  Light on purpose: nothing here imports the simulator, the Lua VM, the catalog's engines or the
  protocol, so the page fetches no .wasm (guide.e2e.ts holds that). The shape travels as data
  (+page.ts); the rail's contents arrive with the effect. The head is the intro's: thirteen tags,
  the hero's picture as the link preview (no per-route image exists to generate).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { FRONT_DOOR_HERO } from "$lib/catalog/front-door";
  import {
    GUIDE_BREADCRUMB,
    GUIDE_DESCRIPTION,
    GUIDE_EYEBROW,
    GUIDE_HEADLINE,
    GUIDE_LEDE,
    GUIDE_SECTIONS,
    GUIDE_STATUS,
    GUIDE_TITLE,
    inlineParts,
  } from "$lib/guide/copy";
  import { SITE_ORIGIN } from "$lib/share/url";
  import { ogAlt } from "$lib/tune/copy";
  import Contents from "$lib/ui/guide/Contents.svelte";
  import { fillShell } from "$lib/ui/shell/shell.svelte";

  /* The head, the intro's thirteen tags; the picture is the hero's, the one surface a visitor sees first. */
  const SITE = "HANGAR";
  const OG_TYPE = "article";
  const OG_URL = `${SITE_ORIGIN}/guide/`;
  const OG_IMAGE = `${SITE_ORIGIN}/og/${FRONT_DOOR_HERO.id}.png`;
  const OG_IMAGE_TYPE = "image/png";
  const OG_IMAGE_WIDTH = "1200";
  const OG_IMAGE_HEIGHT = "630";
  const OG_IMAGE_ALT = ogAlt(FRONT_DOOR_HERO.name);
  const TWITTER_CARD = "summary_large_image";

  $effect(() =>
    fillShell({
      variant: "app",
      section: "guide",
      breadcrumb: GUIDE_BREADCRUMB,
      status: GUIDE_STATUS,
      rail,
    }),
  );
</script>

<svelte:head>
  <title>{GUIDE_TITLE}</title>
  <meta name="description" content={GUIDE_DESCRIPTION} />
  <meta property="og:type" content={OG_TYPE} />
  <meta property="og:site_name" content={SITE} />
  <meta property="og:title" content={GUIDE_TITLE} />
  <meta property="og:description" content={GUIDE_DESCRIPTION} />
  <meta property="og:url" content={OG_URL} />
  <meta property="og:image" content={OG_IMAGE} />
  <meta property="og:image:type" content={OG_IMAGE_TYPE} />
  <meta property="og:image:width" content={OG_IMAGE_WIDTH} />
  <meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
  <meta property="og:image:alt" content={OG_IMAGE_ALT} />
  <meta name="twitter:card" content={TWITTER_CARD} />
</svelte:head>

{#snippet rail()}
  <Contents placement="rail" />
{/snippet}

<!-- A sentence with its keys: a run of text, or a key in a kbd. -->
{#snippet line(text: string)}
  {#each inlineParts(text) as part, i (i)}{#if "key" in part}<kbd
        >{part.key}</kbd
      >{:else}{part.text}{/if}{/each}
{/snippet}

<article class="guide" data-testid="guide">
  <header class="top">
    <p class="eyebrow type-micro">{GUIDE_EYEBROW}</p>
    <h1 class="headline type-page-title">{GUIDE_HEADLINE}</h1>
    <p class="lede">{GUIDE_LEDE}</p>
  </header>

  <Contents placement="page" />

  {#each GUIDE_SECTIONS as section (section.id)}
    <section
      class="part"
      id={section.id}
      aria-labelledby="{section.id}-title"
      data-testid="guide-section"
    >
      <h2 class="part-title type-panel-title" id="{section.id}-title">
        {section.title}
      </h2>
      {#each section.blocks as block, b (b)}
        {#if block.kind === "text"}
          <p class="text">{@render line(block.text)}</p>
        {:else if block.kind === "steps"}
          <ol class="steps">
            {#each block.items as item (item)}<li>
                {@render line(item)}
              </li>{/each}
          </ol>
        {:else if block.kind === "list"}
          <ul class="items">
            {#each block.items as item (item)}<li>
                {@render line(item)}
              </li>{/each}
          </ul>
        {:else if block.kind === "keys"}
          <dl class="keys" data-testid="guide-keys">
            {#each block.rows as row (row.key)}
              <div class="key-row">
                <dt><kbd>{row.key}</kbd></dt>
                <dd>{row.what}</dd>
              </div>
            {/each}
          </dl>
        {:else if block.kind === "answers"}
          <dl class="answers">
            {#each block.items as item (item.problem)}
              <dt>{item.problem}</dt>
              <dd>{@render line(item.fix)}</dd>
            {/each}
          </dl>
        {/if}
      {/each}
    </section>
  {/each}
</article>

<style>
  /* The reading column: about 680px, at the centre's left edge; the centre scrolls its own body. */
  .guide {
    box-sizing: border-box;
    max-inline-size: 680px;
    padding-block-end: 48px;
    color: var(--color-ink);
  }

  .eyebrow {
    margin: 0 0 12px;
    color: var(--color-ink-quiet);
  }

  .headline {
    margin: 0 0 12px;
    color: var(--color-ink);
  }

  .lede {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 17px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /* A section: a rule above, its title, its body; a deep link lands with a little room above the title. */
  .part {
    margin-block-start: 40px;
    padding-block-start: 32px;
    border-block-start: 1px solid var(--color-divider);
    scroll-margin-block-start: 24px;
  }

  .part-title {
    margin: 0 0 16px;
    color: var(--color-ink);
  }

  .text,
  .steps,
  .items,
  .answers dd {
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.6;
    color: var(--color-ink);
  }

  .text {
    margin: 0 0 12px;
  }

  .steps,
  .items {
    margin: 0 0 16px;
    padding-inline-start: 24px;
  }

  .steps {
    list-style: decimal;
  }

  .items {
    list-style: square;
  }

  .steps li,
  .items li {
    margin-block-end: 8px;
    padding-inline-start: 4px;
  }

  .steps li::marker,
  .items li::marker {
    color: var(--color-ink-quiet);
  }

  /* The add keys: one row each, the key then the element it arms. */
  .keys {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    margin: 0 0 16px;
  }

  .key-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .keys dt,
  .keys dd {
    margin: 0;
  }

  .keys dd {
    font-family: var(--font-sans);
    font-size: 15px;
    color: var(--color-ink);
  }

  /* Problems and fixes: the problem in the group title's weight, the fix beneath it. */
  .answers {
    margin: 0;
  }

  .answers dt {
    margin: 20px 0 4px;
    font-family: var(--font-sans);
    font-size: 17px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-ink);
  }

  .answers dt:first-child {
    margin-block-start: 0;
  }

  .answers dd {
    margin: 0;
  }

  /* A key: the shortcut sheet's chip - a square box in the house mono. */
  kbd {
    display: inline-block;
    box-sizing: border-box;
    min-inline-size: 24px;
    padding: 1px 6px;
    border: 1px solid var(--color-boundary);
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.4;
    text-align: center;
    color: var(--color-ink);
  }
</style>
