<!--
  PDF page 1: the intro (plan 13-07; 13-CONTEXT.md D-01, D-05, D-09, D-14 Q2;
  13-RESEARCH.md section 1 "Page 1 - the intro" and section 8).

  FLAT, SOLID, TYPOGRAPHIC, WITH ONE LIVE SURFACE. Two columns and a strip.
  Left: an eyebrow, a two-line headline with its second line in the action
  colour, two secondary lines, two stacked start cards, the import line and
  one bulleted line. Right: the hero panel with the live 9 x 9 surface. Below
  both: a full-width rule and the three numbered steps. The Bible's section 3
  would have permitted texture on an introduction screen and the PDF declines
  it; so does this file. There is no splash, no dissolve, no glyph field and
  no ceremony: the page is on screen at the first paint and the machine is
  already running beside the words.

  EVERY VISIBLE STRING IS THE PDF's, VERBATIM, real apostrophes included, and
  none is ledgered. The two strings HANGAR wrote for the returning visitor's
  card and the hero's description live in card.ts and are ledgered there.
  Uppercase appears on exactly the short labels the PDF sets in uppercase -
  the eyebrow, the two card eyebrows, the panel label, the chip and the
  hero's caption - and nowhere else (D-05; intro.spec.ts test 1 asserts it).

  THE RETURNING VISITOR CHANGES ONE CARD. `card` is the caller's reading of
  the local store (card.ts); for `resume` the first card becomes `Resume
  draft`, named for the draft and dated in words, and points at the draft's
  own address. Nothing here reads storage and nothing here navigates - the
  route reads, once, in onMount, and this component only renders what it is
  handed.

  THE ADDRESSES. `Explore Playground` and `Build in Sandbox` go to the primary
  nav's own destinations (shell.svelte.ts SECTIONS, the one declaration), and
  `Import config` to My configs, where the PDF's page 4 keeps import. None of
  the three routes exists yet - 13-08, 13-10 and 13-12 land them - so
  vite.config.ts names the three paths for the prerender crawler until they
  do. A Playground draft resolves through Kit's own `resolve("/c/[id]")`, the
  address helper CatalogCard.svelte uses today, so 13-08's move to
  /playground/<id> (D-20) carries this line with every other call site.

  Measured on the PDF at a 1500px render width (MEDIUM confidence, raster):
  page inset 72; left column 72-710, right 806-1425 (a 96 gutter); eyebrow at
  y 170 under a 76 header, panel from y 133; cards 108 tall; strip y 845-930
  with items at x 76 / 534 / 994. The headline's measured 62-66px is the
  display role 13-03 declared (.type-display, 60px at 0.95), and the display
  face is the one D-04 keeps behind one token.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { resolve } from "$app/paths";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import { SECTIONS } from "../shell/shell.svelte";
  import HeroSurface from "./HeroSurface.svelte";
  import StartCard from "./StartCard.svelte";
  import {
    RESUME_EYEBROW,
    heroDescription,
    resumeLine,
    type IntroCard,
  } from "./card";

  let {
    card,
    hero,
  }: {
    /** The first card, as card.ts read it from the store. */
    card: IntroCard;
    /** The live surface's entry, src/lib/catalog/front-door.ts's hero. */
    hero: FrontDoorEntry;
  } = $props();

  const playground = SECTIONS[0].href;
  const sandbox = SECTIONS[1].href;
  const myConfigs = SECTIONS[2].href;

  /** Where the draft lives: a Playground draft at its entry's address, a Sandbox draft in the Sandbox. */
  const resumeHref = $derived(
    card.kind === "resume" && card.draft.kind === "playground"
      ? resolve("/c/[id]", { id: card.draft.source })
      : sandbox,
  );
</script>

<div class="intro" data-testid="intro">
  <div class="columns">
    <div class="words">
      <p class="eyebrow type-micro">WELCOME TO YOUR CONFIGURATION STUDIO</p>
      <h1 class="headline type-display">
        <span class="line">Make ZONA</span>
        <span class="line own">your own.</span>
      </h1>
      <p class="sub">Find a gesture you love.</p>
      <p class="sub">Build a surface that works the way you do.</p>

      <div class="cards">
        {#if card.kind === "resume"}
          <StartCard
            variant="ruled"
            eyebrow={RESUME_EYEBROW}
            title="Resume draft"
            body={resumeLine(card.draft.name, card.edited)}
            href={resumeHref}
            testid="start-resume"
          />
        {:else}
          <StartCard
            variant="ruled"
            eyebrow="START WITH AN IDEA"
            title="Explore Playground"
            body="Discover configurations. Try one. Make it yours."
            href={playground}
            testid="start-explore"
          />
        {/if}
        <StartCard
          variant="bounded"
          eyebrow="START WITH A BLANK SURFACE"
          title="Build in Sandbox"
          body="Arrange controls and choose what each gesture does."
          href={sandbox}
          testid="start-sandbox"
        />
      </div>

      <p class="have type-helper">
        Already have a configuration?
        <a class="import" href={myConfigs} data-testid="intro-import"
          >Import config <span aria-hidden="true">&#x2197;</span></a
        >
      </p>
      <p class="note type-helper">
        <span class="bullet" aria-hidden="true"></span>Start in browser preview.
        Connect ZONA when you’re ready.
      </p>
    </div>

    <HeroSurface entry={hero} description={heroDescription(hero.name)} />
  </div>

  <ol class="steps" id="quick-guide" data-testid="intro-steps">
    <li>
      <span class="num type-micro">01</span>
      <span class="word">Explore</span>
      <span class="text type-helper"
        >Find a configuration or start from scratch.</span
      >
    </li>
    <li>
      <span class="num type-micro">02</span>
      <span class="word">Shape</span>
      <span class="text type-helper"
        >Tune the behavior, color, and MIDI mapping.</span
      >
    </li>
    <li>
      <span class="num type-micro">03</span>
      <span class="word">Apply</span>
      <span class="text type-helper">Send your configuration to ZONA.</span>
    </li>
  </ol>
</div>

<style>
  .intro {
    display: flex;
    flex-direction: column;
    gap: 44px;
    box-sizing: border-box;
    padding: 57px 72px 48px;
    color: var(--color-ink);
  }

  /* Two columns at the PDF's proportions: 638 and 619 across a 96 gutter. */
  .columns {
    display: grid;
    grid-template-columns: minmax(0, 638fr) minmax(0, 619fr);
    column-gap: 96px;
    align-items: start;
  }

  .words {
    display: flex;
    flex-direction: column;
    padding-block-start: 37px;
  }

  .eyebrow {
    margin: 0 0 20px;
    color: var(--color-ink-quiet);
  }

  .headline {
    display: flex;
    flex-direction: column;
    margin: 0 0 28px;
  }

  .line {
    display: block;
  }

  /* The second line in the action colour: the one place the intro uses it on text. */
  .own {
    color: var(--color-action);
  }

  .sub {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 19px;
    line-height: 1.55;
    color: var(--color-ink-quiet);
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-block: 44px 40px;
  }

  .have {
    margin: 0 0 20px;
    color: var(--color-ink-quiet);
  }

  .import {
    margin-inline-start: 8px;
    color: var(--color-ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .import:hover {
    color: var(--color-action);
  }

  .note {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0;
    color: var(--color-ink-quiet);
  }

  /* The bullet is a small square, not a dot: nothing on the site is round but D-15's six. */
  .bullet {
    flex: none;
    inline-size: 6px;
    block-size: 6px;
    background: var(--color-action);
  }

  /* The strip: a full-width rule, then three equal columns. */
  .steps {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 32px;
    margin: 0;
    padding: 32px 4px 0;
    list-style: none;
    border-block-start: 1px solid var(--color-divider);
  }

  .steps li {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .num {
    color: var(--color-ink-quiet);
  }

  .word {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    line-height: 1.15;
  }

  .text {
    color: var(--color-ink-quiet);
  }

  /* Below the compact band the columns stack and the strip follows. */
  @media (max-width: 1023.98px) {
    .intro {
      padding-inline: 32px;
    }

    .columns {
      grid-template-columns: minmax(0, 1fr);
      row-gap: 40px;
    }

    .steps {
      grid-template-columns: minmax(0, 1fr);
      row-gap: 24px;
    }
  }

  @media (max-width: 767.98px) {
    .intro {
      padding: 32px 16px;
    }
  }
</style>
