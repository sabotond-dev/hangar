<!--
  PDF page 1, the intro: two columns and a strip - an eyebrow, the two-line
  headline (second line in the action colour), two sub-lines, two start cards,
  the import line and one bulleted line at the left; the hero panel with the live
  9 x 9 surface at the right; a rule and three numbered steps below. Flat, solid,
  no splash, no dissolve. Props: card (card.ts's reading of the store: a returning
  visitor's first card becomes Resume draft), hero. Every visible string is the
  PDF's, verbatim; uppercase only where the PDF sets it (intro.spec.ts). It fits
  the screen in the wide and compact bands: every vertical number is the PDF's
  times --intro-unit (min(1px, 100cqh / INTRO_FIT_H)), spacings on the steeper
  --intro-squeeze ramp, the type floored (headline 34, sub-lines 15, titles 18); layout.ts's constants.
  Decided at 13-07 / 13.1-01 (13-CONTEXT D-01, D-05; 13.1-CONTEXT D-01); see .planning/phases/13.1-bench-corrections-four/13.1-01-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { resolve } from "$app/paths";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import {
    INTRO_FIT_H,
    INTRO_GAP,
    INTRO_PAD_BOTTOM,
    INTRO_PAD_TOP,
    INTRO_SQUEEZE_FROM,
    INTRO_STRIP_PAD,
    INTRO_WORDS_MIN_W,
  } from "../shell/layout";
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
      ? resolve("/playground/[id]", { id: card.draft.source })
      : sandbox,
  );
</script>

<div
  class="intro"
  data-testid="intro"
  style:--intro-fit-h={INTRO_FIT_H}
  style:--intro-squeeze-from={INTRO_SQUEEZE_FROM}
  style:--intro-pad-top={INTRO_PAD_TOP}
  style:--intro-pad-bottom={INTRO_PAD_BOTTOM}
  style:--intro-gap={INTRO_GAP}
  style:--intro-strip-pad={INTRO_STRIP_PAD}
  style:--intro-words-min-w="{INTRO_WORDS_MIN_W}px"
>
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
  /*
    The fit (13.1-01, D-01): --intro-unit is one PDF pixel at the centre's height,
    capped at 1px; --intro-squeeze is the spacing ramp, 1px at the PDF's height and 0
    at INTRO_SQUEEZE_FROM of it. The centre is the one size container, so 100cqh is
    the centre below. Two rows: the columns take what the strip leaves.
  */
  .intro {
    --intro-unit: min(1px, calc(100cqh / var(--intro-fit-h)));
    --intro-squeeze: clamp(
      0px,
      calc(
        (var(--intro-unit) - var(--intro-squeeze-from) * 1px) /
          (1 - var(--intro-squeeze-from))
      ),
      1px
    );
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    row-gap: calc(var(--intro-gap) * var(--intro-squeeze));
    box-sizing: border-box;
    block-size: 100%;
    min-block-size: 0;
    padding: calc(var(--intro-pad-top) * var(--intro-squeeze)) 72px
      calc(var(--intro-pad-bottom) * var(--intro-squeeze));
    color: var(--color-ink);
  }

  /* Two columns at the PDF's proportions (638 and 619 across a 96 gutter), the words never narrower than INTRO_WORDS_MIN_W; one explicit row, so the hero is bounded by the row. */
  .columns {
    display: grid;
    grid-template-columns:
      minmax(min(100%, var(--intro-words-min-w)), 638fr)
      minmax(0, 619fr);
    grid-template-rows: minmax(0, 1fr);
    column-gap: 96px;
    align-items: stretch;
    min-block-size: 0;
  }

  .words {
    display: flex;
    flex-direction: column;
    min-block-size: 0;
    padding-block-start: calc(37 * var(--intro-squeeze));
  }

  .eyebrow {
    margin: 0 0 calc(20 * var(--intro-squeeze));
    color: var(--color-ink-quiet);
  }

  /* The headline clamped HERE: app.css's .type-display stays at 60 (D-17); 60 at the PDF's height, never below 34. */
  .headline {
    display: flex;
    flex-direction: column;
    margin: 0 0 calc(28 * var(--intro-squeeze));
    font-size: max(34px, calc(60 * var(--intro-unit)));
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
    font-size: max(15px, calc(19 * var(--intro-unit)));
    line-height: 1.55;
    color: var(--color-ink-quiet);
  }

  /* The cards' vertical numbers travel as custom properties StartCard reads: the PDF's 108 tall, the title never below 18. */
  .cards {
    --start-card-min: calc(108 * var(--intro-unit));
    --start-card-pad: calc(16 * var(--intro-squeeze));
    --start-card-gap: calc(6 * var(--intro-squeeze));
    --start-card-title: max(18px, calc(24 * var(--intro-unit)));
    display: flex;
    flex-direction: column;
    gap: calc(16 * var(--intro-squeeze));
    margin-block: calc(44 * var(--intro-squeeze))
      calc(40 * var(--intro-squeeze));
  }

  .have {
    margin: 0 0 calc(20 * var(--intro-squeeze));
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

  /* The strip: a full-width rule, then three equal columns. Its height is its content's. */
  .steps {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 32px;
    margin: 0;
    padding: calc(var(--intro-strip-pad) * var(--intro-squeeze)) 4px 0;
    list-style: none;
    border-block-start: 1px solid var(--color-divider);
  }

  .steps li {
    display: flex;
    flex-direction: column;
    gap: calc(8 * var(--intro-squeeze));
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

  /* Below the compact band the columns stack and the page may scroll at the PDF's numbers (the unit and the ramp are 1px; the centre is no container). */
  @media (max-width: 1023.98px) {
    .intro {
      --intro-unit: 1px;
      --intro-squeeze: 1px;
      display: flex;
      flex-direction: column;
      block-size: auto;
      padding-inline: 32px;
    }

    .columns {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: none;
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
