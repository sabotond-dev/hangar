<!--
  The primary nav, PDF pages 2-5: PLAYGROUND / SANDBOX / MY CONFIGS at 15px,
  uppercase, 0.05em. Prop: section (the current one; undefined marks nothing).
  The current item carries TWO signals - the action colour AND a 2px underline -
  both keyed to aria-current="page", so the tree and the paint cannot disagree
  (section 14; identity.spec.ts). Not a router: the route says which section is
  current through the shell fill, and the three hrefs are shell.svelte.ts's
  SECTIONS. Every number is layout.ts's; the labels are the PDF's (D-05).
  Decided at 13-05 (Bible section 4); see .planning/phases/13-gui-overhaul/13-05-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { NAV } from "./layout";
  import { SECTIONS, type Section } from "./shell.svelte";

  let {
    section,
  }: {
    /** The current section. Undefined marks nothing current. */
    section?: Section;
  } = $props();
</script>

<nav
  class="nav"
  data-testid="shell-nav"
  style:--nav-size="{NAV.size}px"
  style:--nav-tracking="{NAV.tracking}em"
  style:--nav-underline="{NAV.underline}px"
  style:--nav-gap="{NAV.underlineGap}px"
>
  <ul class="items">
    {#each SECTIONS as item (item.id)}
      <li>
        <a
          class="item"
          href={item.href}
          aria-current={item.id === section ? "page" : undefined}
          data-section={item.id}>{item.label}</a
        >
      </li>
    {/each}
  </ul>
</nav>

<style>
  .items {
    display: flex;
    gap: 40px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Each link is a 44px box at every pointer: the site's floor is per control. */
  .item {
    display: inline-flex;
    align-items: center;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-block-end: var(--nav-gap);
    border-block-end: var(--nav-underline) solid transparent;
    font-family: var(--font-sans);
    font-size: var(--nav-size);
    font-weight: 500;
    letter-spacing: var(--nav-tracking);
    text-transform: uppercase;
    text-decoration: none;
    color: var(--color-ink-quiet);
    transition: color 120ms ease-out;
  }

  .item:hover {
    color: var(--color-ink);
  }

  /* The current item: the action colour AND the underline. Two signals. */
  .item[aria-current] {
    color: var(--color-action);
    border-block-end: var(--nav-underline) solid var(--color-action);
  }

  /* Section 13's narrow band: three items wrap on a phone rather than overflow (13-08). */
  @media (max-width: 767.98px) {
    .items {
      flex-wrap: wrap;
      gap: 0 24px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .item {
      transition: none;
    }
  }
</style>
