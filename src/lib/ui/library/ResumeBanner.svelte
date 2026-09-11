<!--
  The resume banner on My configs (plan 13-13; PDF page 4, x 259 -> 1466,
  y 305 -> 452): a raised surface with a 3px action-colour rule down its left
  edge, a 96 x 96 LIVE thumbnail, `CONTINUE EDITING` in the 11px uppercase
  role, the draft's name in the display face (~28px), the meta line
  `Draft · {type} · Last edited {edited}`, and a filled action-colour
  `Resume draft` at the right. It is the intro's Card A (StartCard.svelte's
  `ruled` variant) grown to carry a picture, and it renders only when the
  route hands it a draft - the newest one (drafts.ts's newestDraft), which is
  the same source the table's Draft chip reads.

  THE THUMBNAIL IS LIVE, NOT STORED (13-06's rule: nothing stores a picture).
  This component renders PadFrame + PadCanvas and hands the canvas up through
  `onready`; the route registers it with the page's one SimHost, so the banner
  and every table row tick on the same animation frame. The canvas id is
  namespaced (`resume:{draft.id}`) so the same record's table row keeps its
  own registration.

  THE META LINE IS THE PDF's, with the draft's TYPE in the middle term - the
  intro's resume card puts the draft's NAME there because that card has no
  title of its own (card.ts, ledgered at 13-07); here the title is the name,
  so the middle term is the category, exactly as page 4 draws it (`Draft ·
  Modulation · Last edited 12 minutes ago`).

  Every visible string is the PDF's, verbatim: `CONTINUE EDITING`, `Resume
  draft`, `Draft`, `Last edited`. Nothing here is ledgered. Square corners
  throughout (D-01); no allowlist row.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import type { Draft } from "$lib/store/schema";
  import PadCanvas from "$lib/ui/PadCanvas.svelte";
  import PadFrame from "$lib/ui/PadFrame.svelte";
  import { STATUS_WORDS } from "./words";

  let {
    draft,
    type,
    edited,
    href,
    onready,
  }: {
    draft: Draft;
    /** The TYPE word for the meta line: `Modulation`, `Custom surface`. */
    type: string;
    /** The age in words: `12 minutes ago` (card.ts's relativeTime). */
    edited: string;
    /** Where Resume draft goes; resolved by the route. */
    href: ResolvedPathname;
    /** The canvas, for the route's host. The id is `resume:{draft.id}`. */
    onready: (id: string, canvas: HTMLCanvasElement) => void;
  } = $props();

  const CONTINUE_EDITING = "CONTINUE EDITING";
  const RESUME_DRAFT = "Resume draft";
  const LAST_EDITED = "Last edited";

  const canvasId = $derived(`resume:${draft.id}`);
  const meta = $derived(
    `${STATUS_WORDS.draft} · ${type} · ${LAST_EDITED} ${edited}`,
  );
</script>

<section
  class="banner"
  data-testid="resume-banner"
  aria-label={CONTINUE_EDITING}
>
  <div class="thumb">
    <PadFrame entry={{ id: canvasId }}>
      <PadCanvas entry={{ id: canvasId, name: draft.name }} {onready} />
    </PadFrame>
  </div>
  <div class="text">
    <p class="eyebrow type-micro">{CONTINUE_EDITING}</p>
    <h2 class="title" data-testid="resume-title">{draft.name}</h2>
    <p class="meta" data-testid="resume-meta">{meta}</p>
  </div>
  <a class="resume" {href} data-testid="resume-draft">{RESUME_DRAFT}</a>
</section>

<style>
  /* The PDF's banner: raised, ruled on the left, 147 tall at 1500. */
  .banner {
    display: flex;
    align-items: center;
    gap: 24px;
    box-sizing: border-box;
    min-block-size: 147px;
    padding: 24px;
    background: var(--color-raised);
    border-inline-start: 3px solid var(--color-action);
    color: var(--color-ink);
  }

  /* 96 x 96, the PDF's measure; the frame inside is PadFrame's own. */
  .thumb {
    flex: none;
    inline-size: 96px;
    block-size: 96px;
  }

  .text {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 6px;
    min-inline-size: 0;
  }

  .eyebrow {
    margin: 0;
    color: var(--color-ink-quiet);
  }

  /* The PDF's ~28px title, in the display face, between the page and panel roles. */
  .title {
    margin: 0;
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  .meta {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.45;
    color: var(--color-ink-quiet);
  }

  /* Filled action colour, the PDF's 178 x 38 beneath the site's 44 floor. */
  .resume {
    flex: none;
    display: grid;
    place-items: center;
    min-inline-size: 178px;
    min-block-size: 44px;
    padding-inline: 20px;
    background: var(--color-action);
    font-family: var(--font-sans);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.2;
    text-decoration: none;
    color: var(--color-on-action);
  }

  .resume:hover {
    color: var(--color-on-action);
  }

  /* Below 768 the banner stacks: picture and words above, the action full width. */
  @media (max-width: 767px) {
    .banner {
      flex-wrap: wrap;
    }

    .resume {
      inline-size: 100%;
    }
  }
</style>
