<!--
  The type probe (IDENT-01; 10-UI-SPEC 5.1 and 12.1): the surface CH_PER_LINE and the Inter @font-face
  were measured on before a component was written. Linked from nowhere, prerendered; its siblings are
  described, not spelled (config-shape.spec.ts's probe scan). The column is 372px because that was the
  panel's (420 max inline size less 24 of padding each side); the paragraphs are the real strings the
  twins reserve for (101, 90, 86, 82 and 37 code points); the Quicksand column beside them refuted the
  assumption (Inter measured 2.35 per cent WIDER on the 86-character line; the smallest full line box
  holds 43 in both faces and both engines). Each sentence is an inline span because getClientRects()
  returns one rectangle per line box only for an inline element; the <p> keeps the testid and the block
  box for the second count. The @font-face below is the proof surface for 5.1's candidate (b): a relative url() into node_modules.
  Decided at 10-01 (CH_PER_LINE the 43); see .planning/phases/10-redesign/10-01-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  /** The five strings, longest first, each the worst case of its cell; counted by script: 101, 90, 86, 82, 37. */
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
