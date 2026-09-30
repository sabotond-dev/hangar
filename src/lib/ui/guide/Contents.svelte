<!--
  The Quick guide's contents (change 26): the eight section titles as anchor links, in the rail's
  register - the micro title, 44px rows, the title at the left and the section's number at the
  right in the numerals (Rail.svelte's row, drawn here because a rail row takes a route and these
  take a fragment). A nav with a name. Prop: placement - "rail" (the shell's left column, from the
  compact band up) or "page" (in the article under the lede, below the compact band, where the
  rail stacks above the page); each placement draws itself only where the other does not, so one
  set of contents is on screen and in the tree at a time. Every word is src/lib/guide/copy.ts's.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import {
    CONTENTS_NAME,
    CONTENTS_TITLE,
    GUIDE_SECTIONS,
  } from "$lib/guide/copy";
  import { padCount } from "../shell/layout";

  let {
    placement,
  }: {
    /** "rail": the shell's left column, 1024 and up. "page": in the article, below 1024. */
    placement: "rail" | "page";
  } = $props();
</script>

<nav
  class="toc"
  class:in-rail={placement === "rail"}
  class:in-page={placement === "page"}
  aria-label={CONTENTS_NAME}
  data-testid={placement === "rail" ? "guide-contents-rail" : "guide-contents"}
>
  <p class="title type-micro" aria-hidden="true">{CONTENTS_TITLE}</p>
  <ol class="rows">
    {#each GUIDE_SECTIONS as section, i (section.id)}
      <li>
        <a class="row" href="#{section.id}" data-section={section.id}>
          <span class="label">{section.title}</span>
          <span class="side numerals">{padCount(i + 1)}</span>
        </a>
      </li>
    {/each}
  </ol>
</nav>

<style>
  /* In the rail: the rail's own padding on the panel ground the column already paints. */
  .in-rail {
    box-sizing: border-box;
    padding: 16px 16px 24px;
  }

  /* In the article: a divider above and below, the rows at the article's edge. */
  .in-page {
    margin-block: 24px 8px;
    padding-block: 8px;
    border-block: 1px solid var(--color-divider);
  }

  .title {
    margin: 0;
    padding-inline: 12px;
    padding-block: 12px 8px;
    color: var(--color-ink-quiet);
  }

  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* A row: Rail.svelte's - the 44px floor on both axes, the 3px left slot reserved, the label and the number. */
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 12px;
    border-inline-start: 3px solid transparent;
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.3;
    text-decoration: none;
    color: var(--color-ink);
  }

  .row:hover {
    background: var(--color-raised);
  }

  .side {
    flex: 0 0 auto;
    font-size: 13px;
    color: var(--color-ink-quiet);
  }

  /* One placement at a time: the rail's from the compact band up, the page's below it. */
  @media (max-width: 1023.98px) {
    .in-rail {
      display: none;
    }
  }

  @media (min-width: 1024px) {
    .in-page {
      display: none;
    }
  }
</style>
