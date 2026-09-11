<!--
  THE PRIMARY NAV (plan 13-05; Bible section 4; PDF pages 2-5).

  PLAYGROUND / SANDBOX / MY CONFIGS at the PDF's measured 15px, uppercase,
  0.05em tracking. Three items, and the current one carries TWO signals: the
  action colour AND a 2px underline of the same colour about 2px below the
  box - because colour alone is forbidden by section 14 and by
  identity.spec.ts test 6's reading of it, and because on the PDF the
  underline is what you see first. The current item is aria-current="page",
  and the CSS keys both signals to that attribute, so the accessibility
  tree and the paint cannot disagree.

  NOT A ROUTER. It takes the current section as a prop and renders links;
  which section is current is the route's to say through the shell fill.
  The three hrefs come from shell.svelte.ts's SECTIONS, where the reason
  they are literals rather than resolve() calls is written.

  Every number is layout.ts's, imported. The labels are the PDF's own and
  are not ledgered (D-05: uppercase for short navigation labels).

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
