<!--
  IDENT-01 / 10-UI-SPEC §5.1 and §12.1: the type probe.

  FIVE THINGS ABOUT THIS PAGE.

  1. IT IS LINKED FROM NOWHERE. It is prerendered - src/routes/+layout.ts
     declares `prerender = true` for the whole tree and vite.config.ts's
     `prerender.entries: ["*"]` picks up every route with no required dynamic
     segment, which is why this file declares no page option of its own and
     neither does any sibling probe. e2e/fidelity.e2e.ts already asserts
     site-wide that the count of a[href*="/dev/"] on / is zero, and
     src/lib/config-shape.spec.ts's probe test discovers every directory under
     the dev routes and fails on any file outside a probe's own directory that
     names it - so the siblings are described here rather than spelled.

  2. IT EXISTS TO SETTLE TWO NUMBERS BEFORE A COMPONENT IS WRITTEN.
     10-UI-SPEC §12.1 calls CH_PER_LINE provisional at 46 and says out loud
     that a wrong number reflows a device panel mid-install: five reservations
     and four caps are that number's arithmetic. And §5.1 calls the Inter
     @font-face's src: url(...) UNPROVEN, because a bare package specifier
     inside url() is not a resolution Vite documents - it can ship verbatim
     into the built stylesheet and 404 in production while dev happens to work.
     This page is the surface both are measured on.

  3. THE COLUMN IS 372px BECAUSE THAT IS THE PANEL'S. ChosenPanel.svelte's
     content column is 420px of max inline size minus 24px of padding each
     side, and every sizing twin in §12 is arithmetic against it. Measuring
     characters per line at any other width would measure a different page.

  4. THE PARAGRAPHS ARE THE REAL STRINGS THE TWINS RESERVE FOR, not lorem.
     Their code-point counts are 101, 90, 86, 82 and 37, and each is the
     longest candidate of the cell it belongs to. A synthetic sentence would
     measure a different distribution of letters and therefore a different
     average advance.

  5. THE QUICKSAND COLUMN IS BESIDE IT SO THE COMPARISON IS OBSERVED, AND IT
     IS WHAT REFUTED THE ASSUMPTION. §12.1 raised the provisional figure from
     Phase 4's measured 43 to 46 because "Inter is narrower per character at
     the same size". Measured here, in both engines, on the 86-character CLEAR
     line: Inter 673.39px against Quicksand 657.95px, so Inter is 2.35 per cent
     WIDER, not narrower. Of the twenty-eight Body sentences in the copy
     contract, Inter takes MORE line boxes than Quicksand on two and fewer on
     none, and the smallest full line box holds 43 characters in both faces
     and both engines. The swap does not buy line capacity; it costs a little.

  EACH SENTENCE IS WRAPPED IN AN INLINE SPAN, AND THAT IS THE WHOLE POINT OF
  THE MARKUP. `Element.getClientRects()` returns one rectangle PER LINE BOX
  only for an inline element; on a block-level <p> it returns the single
  border box, so a line count read off the paragraph is 1 for every string at
  every width and the ratio it produces is the character count itself. The
  measured element is therefore the span. The <p> keeps the testid the plan
  names and carries the block box, whose height divided by the 24px line box
  is the second, independent line count the measurement cross-checks against.

  THE @font-face BELOW IS THE PROOF SURFACE, and it carries §5.1 candidate (b):
  a RELATIVE url() out of the source tree into node_modules, which Vite
  rewrites and fingerprints into _app/immutable/assets/. The depth is this
  file's own - src/routes/dev/type/ is four levels below the repository root -
  so the string src/app.css will ship differs from this one by its ../ count
  and by nothing else. The unicode-range is the latin subset's real list,
  copied from @fontsource-variable/inter's own wght.css: §5.1's draft carries
  `unicode-range: /* ... */;`, which is a syntax error that silently drops the
  whole descriptor and would take the subsetting with it.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  /**
   * The five strings, longest first, each the worst case of the cell it is
   * reserved for. Counted by script, not by eye: 101, 90, 86, 82, 37.
   */
  const LINES: readonly { id: string; n: number; text: string }[] = [
    {
      id: "measure-1",
      n: 101,
      text: "Restores the Setup and Timer that were on your ZONA when you connected, and stores them so they stay.",
    },
    {
      id: "measure-2",
      n: 90,
      text: "Writes this into your ZONA’s memory in about a second. A power cycle brings your own back.",
    },
    {
      id: "measure-3",
      n: 86,
      text: "Empties this page in your ZONA’s memory. A power cycle brings back whatever is stored.",
    },
    {
      id: "measure-4",
      n: 82,
      text: "Stores this configuration in your ZONA’s own memory, so it survives a power cycle.",
    },
    { id: "measure-5", n: 37, text: "ZONA detected. One click connects it." },
  ];
</script>

<h1>Type probe</h1>

<p data-testid="probe-width">372</p>

<div class="column inter" data-testid="measure-column">
  {#each LINES as line (line.id)}
    <p data-testid={line.id} data-chars={line.n}>
      <span data-testid="{line.id}-inline">{line.text}</span>
    </p>
  {/each}
</div>

<div class="column quicksand" data-testid="measure-column-quicksand">
  {#each LINES as line (line.id)}
    <p data-testid="{line.id}-quicksand" data-chars={line.n}>
      <span data-testid="{line.id}-quicksand-inline">{line.text}</span>
    </p>
  {/each}
</div>

<style>
  @font-face {
    font-family: "Inter Variable";
    font-style: normal;
    font-weight: 100 900;
    font-display: swap;
    src: url("../../../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")
      format("woff2-variations");
    unicode-range:
      U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
      U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193,
      U+2212, U+2215, U+FEFF, U+FFFD;
  }

  .column {
    inline-size: 372px;
    max-inline-size: 372px;
    font-size: 16px;
    line-height: 1.5;
    font-weight: 400;
  }

  .inter {
    font-family:
      "Inter Variable",
      ui-sans-serif,
      system-ui,
      -apple-system,
      "Segoe UI",
      Roboto,
      sans-serif;
  }

  .quicksand {
    font-family: var(--font-sans);
  }

  .column p {
    margin: 0 0 24px;
  }
</style>
