<!--
  SELECTED ELEMENT: PDF page 3's right column in Inspector.svelte's panel - the
  eyebrow and the name, the units chip, Element name, the type as a plain label
  (a kind never changes once placed - change 10A) and Orientation on a fader,
  Behavior (change 10B: a fader's Mode / Speed / Spring, an XY pad's Mode /
  Speed, a button's Toggle / Group, a knob's Mode), MIDI output (the
  controllers, the channel, Min and Max; a button's Output and its Note; not
  on a blank), Appearance through Swatch.svelte, then the pinned Duplicate /
  Delete element. Props: view, the callbacks, notice. Every typed edit goes
  through the editor and the previous valid value survives a refusal (the field
  shows the refused text with aria-invalid until a keystroke validates; blur and
  Enter are oncommit, the history's coalescing boundary); every select and
  checkbox is one entry. The grid reflows at NUMERIC_GRID_REFLOW (D-21). In Play every field is read-only with PLAY_LOCKS_FIELDS.
  Decided at 13-16 (Bible section 8; D-21); see .planning/phases/13-gui-overhaul/13-16-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { brightnessOf } from "$lib/catalog/brightness";
  import {
    COLOUR_KNOB_ID,
    colourKnobView,
    levelsOf,
  } from "$lib/sandbox/colour-knob";
  import {
    APPEARANCE,
    BEHAVIOR,
    BUTTON_MIN_MAX_HELPER,
    CC_NUMBER,
    CC_NUMBER_Y,
    CHANNEL,
    COLOUR_LABEL,
    DELETE_ELEMENT,
    DUPLICATE,
    ELEMENT_NAME,
    GROUP,
    GROUP_HELPER,
    GROUP_NONE,
    KIND_LABELS,
    KNOB_MODE_WORDS,
    KNOB_RELATIVE_HELPER,
    MAX,
    MIDI_OUTPUT,
    MIN,
    MIN_MAX_HELPER,
    MODE,
    MODE_ABSOLUTE,
    MODE_HELPER,
    MODE_RELATIVE,
    NOTE_HELPER,
    NOTE_NUMBER,
    NO_SELECTION_EYEBROW,
    NO_SELECTION_HEADLINE,
    NO_SELECTION_LEDE,
    ORIENTATION,
    ORIENTATION_HORIZONTAL,
    ORIENTATION_VERTICAL,
    OUTPUT,
    OUTPUT_CC,
    OUTPUT_NOTE,
    PLAY_LOCKS_FIELDS,
    SELECTED_ELEMENT,
    SPEED,
    SPEED_FULL,
    SPEED_HALF,
    SPEED_HELPER,
    SPRING,
    SPRING_HELPER,
    SPRING_VALUE,
    TOGGLE,
    TOGGLE_HELPER,
    TYPE,
    groupWord,
    unitsChip,
  } from "$lib/sandbox/copy";
  import {
    DEFAULT_COLOUR,
    type EditorState,
    type NumericField,
  } from "$lib/sandbox/editor";
  import {
    BUTTON_OUTPUTS,
    CONTINUOUS_MODES,
    GROUP_MAX,
    KNOB_MODES,
    ORIENTATIONS,
    SPEEDS,
    groupOf,
    isRelative,
    modeOf,
    orientationOf,
    outputOf,
    speedOf,
    springOf,
    type ButtonOutput,
    type Orientation,
    type RegionMode,
    type Speed,
  } from "$lib/sandbox/model";
  import { BRIGHTNESS_SURFACE_HELPER } from "$lib/tune/inspector-copy";
  import BrightnessField from "$lib/ui/BrightnessField.svelte";
  import Inspector, {
    type InspectorSection,
  } from "$lib/ui/shell/Inspector.svelte";
  import { NUMERIC_GRID_REFLOW } from "$lib/ui/shell/layout";
  import Swatch from "$lib/ui/Swatch.svelte";

  let {
    view,
    onrename,
    onnumber,
    oncommit,
    onorientation,
    onlatch,
    onmode,
    onspeed,
    onspring,
    onoutput,
    ongroup,
    oncolour,
    onbrightness,
    onduplicate,
    ondelete,
    notice,
  }: {
    view: EditorState;
    onrename: (name: string) => void;
    /** Every keystroke of a typed field, validated by the editor. */
    onnumber: (field: NumericField, text: string) => void;
    /** Blur or Enter: the history's coalescing boundary. */
    oncommit: () => void;
    onorientation: (orientation: Orientation) => void;
    /** The button's Toggle (the schema's `latch`). */
    onlatch: (latch: boolean) => void;
    /** The change 10B options, each one entry. */
    onmode?: (mode: RegionMode) => void;
    onspeed?: (speed: Speed) => void;
    onspring?: (spring: boolean) => void;
    onoutput?: (output: ButtonOutput) => void;
    ongroup?: (group: number) => void;
    /** Three RGB444 levels from the picker. */
    oncolour: (colour: readonly [number, number, number]) => void;
    /** The whole surface's brightness, 1..255 (change 5); 255 to reset. */
    onbrightness?: (brightness: number) => void;
    onduplicate: () => void;
    ondelete: () => void;
    /** A duplicate refused, or a store that declined - the panel's one notice. */
    notice?: string;
  } = $props();

  const uid = $props.id();
  const nameId = `${uid}-name`;
  const orientationId = `${uid}-orientation`;
  const toggleId = `${uid}-toggle`;
  const modeId = `${uid}-mode`;
  const speedId = `${uid}-speed`;
  const springId = `${uid}-spring`;
  const outputId = `${uid}-output`;
  const groupId = `${uid}-group`;
  const lockId = `${uid}-lock`;
  const orientationProblemId = `${uid}-orientation-problem`;
  const fieldId = (field: NumericField) => `${uid}-${field}`;
  const messageId = (field: NumericField) => `${uid}-${field}-message`;

  /** The test id per typed field: the model's name, kebab where it is two words. */
  const FIELD_IDS: Readonly<Record<NumericField, string>> = {
    cc: "cc",
    cc2: "cc2",
    channel: "channel",
    min: "min",
    max: "max",
    springValue: "spring-value",
    note: "note",
  };

  const region = $derived(view.selected);
  const play = $derived(view.mode === "play");
  const lock = $derived(play ? lockId : undefined);
  /** The surface's brightness (change 5): one field, shown with or without a selection. */
  const brightness = $derived(brightnessOf(view.surface.brightness));

  /** The swatch's one knob: the region's colour at its lattice position. */
  const colourKnobs = $derived(
    region === undefined
      ? []
      : [colourKnobView(region.colour, DEFAULT_COLOUR, COLOUR_LABEL)],
  );
  const noHeld: ReadonlySet<string> = new Set();

  /* D-21: the 2 x 2 grid is two columns from NUMERIC_GRID_REFLOW and one below. */
  let body = $state<HTMLElement | null>(null);
  let twoColumns = $state(true);
  onMount(() => {
    if (body === null || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        twoColumns = entry.contentRect.width >= NUMERIC_GRID_REFLOW;
      }
    });
    observer.observe(body);
    return () => observer.disconnect();
  });

  function onkeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      oncommit();
    }
  }

  const sections = $derived.by((): InspectorSection[] => {
    // No selection: the surface's own Appearance (the brightness) and nothing else.
    if (region === undefined)
      return [{ title: APPEARANCE, content: appearance }];
    const out: InspectorSection[] = [];
    // Every sending kind has a Behavior since change 10B; a blank has none.
    if (region.kind !== "blank")
      out.push({ title: BEHAVIOR, content: behavior });
    // A blank sends nothing: no MIDI output section (change 10A).
    if (region.kind !== "blank")
      out.push({ title: MIDI_OUTPUT, content: midi });
    out.push({ title: APPEARANCE, content: appearance });
    return out;
  });
</script>

{#snippet headline()}
  {#if region === undefined}
    {NO_SELECTION_HEADLINE}
  {:else}
    <span data-testid="inspector-name">{region.name}</span>
  {/if}
{/snippet}

{#snippet chip()}
  {#if region !== undefined}
    <span class="chip numerals" data-testid="inspector-units"
      >{unitsChip(region.w, region.h)}</span
    >
  {/if}
{/snippet}

{#snippet numeric(field: NumericField, label: string)}
  {@const problem = view.fields[field]}
  <div class="field" class:invalid={problem !== undefined}>
    <label class="label type-helper" for={fieldId(field)}>{label}</label>
    <input
      class="input numerals"
      id={fieldId(field)}
      type="text"
      inputmode={field === "note" ? "text" : "numeric"}
      autocomplete="off"
      data-testid="field-{FIELD_IDS[field]}"
      data-field={field}
      value={view.texts[field]}
      readonly={play}
      aria-readonly={play}
      aria-invalid={problem !== undefined}
      aria-describedby={problem !== undefined ? messageId(field) : lock}
      oninput={(event) => onnumber(field, event.currentTarget.value)}
      onblur={oncommit}
      {onkeydown}
    />
    {#if problem !== undefined}
      <p
        class="message type-helper"
        id={messageId(field)}
        data-testid="field-{FIELD_IDS[field]}-message"
      >
        {problem.message}
      </p>
    {/if}
  </div>
{/snippet}

{#snippet check(
  id: string,
  testid: string,
  label: string,
  checked: boolean,
  onchange: (checked: boolean) => void,
)}
  <div class="check">
    <input
      class="checkbox"
      {id}
      type="checkbox"
      data-testid={testid}
      {checked}
      disabled={play}
      aria-describedby={lock}
      onchange={(event) => onchange(event.currentTarget.checked)}
    />
    <label class="label type-helper" for={id}>{label}</label>
  </div>
{/snippet}

{#snippet behavior()}
  {#if region !== undefined && (region.kind === "fader" || region.kind === "xy")}
    <!-- Mode and, under Relative, Speed (answers 7c); a fader's Spring and its value (answer 8). -->
    <div class="grid" class:two={twoColumns}>
      <div class="field">
        <label class="label type-helper" for={modeId}>{MODE}</label>
        <select
          class="input select"
          id={modeId}
          data-testid="field-mode"
          value={modeOf(region)}
          disabled={play}
          aria-describedby={lock}
          onchange={(event) =>
            onmode?.(event.currentTarget.value as RegionMode)}
        >
          {#each CONTINUOUS_MODES as mode (mode)}
            <option value={mode} selected={mode === modeOf(region)}
              >{mode === "absolute" ? MODE_ABSOLUTE : MODE_RELATIVE}</option
            >
          {/each}
        </select>
      </div>
      {#if isRelative(region)}
        <div class="field">
          <label class="label type-helper" for={speedId}>{SPEED}</label>
          <select
            class="input select"
            id={speedId}
            data-testid="field-speed"
            value={speedOf(region)}
            disabled={play}
            aria-describedby={lock}
            onchange={(event) => onspeed?.(event.currentTarget.value as Speed)}
          >
            {#each SPEEDS as speed (speed)}
              <option value={speed} selected={speed === speedOf(region)}
                >{speed === "half" ? SPEED_HALF : SPEED_FULL}</option
              >
            {/each}
          </select>
        </div>
      {/if}
    </div>
    <p class="helper type-helper">
      {isRelative(region) ? SPEED_HELPER : MODE_HELPER}
    </p>
    {#if region.kind === "fader"}
      {@render check(springId, "field-spring", SPRING, springOf(region), (on) =>
        onspring?.(on),
      )}
      {#if springOf(region)}
        <div class="grid" class:two={twoColumns}>
          {@render numeric("springValue", SPRING_VALUE)}
        </div>
      {/if}
      <p class="helper type-helper">{SPRING_HELPER}</p>
    {/if}
  {:else if region !== undefined && region.kind === "button"}
    <!-- Toggle (the schema's latch) and the radio group (answer 9b). -->
    {@render check(
      toggleId,
      "field-toggle",
      TOGGLE,
      region.latch === true,
      (on) => onlatch(on),
    )}
    <p class="helper type-helper">{TOGGLE_HELPER}</p>
    <div class="grid" class:two={twoColumns}>
      <div class="field">
        <label class="label type-helper" for={groupId}>{GROUP}</label>
        <select
          class="input select"
          id={groupId}
          data-testid="field-group"
          value={String(groupOf(region))}
          disabled={play}
          aria-describedby={lock}
          onchange={(event) =>
            ongroup?.(Number.parseInt(event.currentTarget.value, 10))}
        >
          <option value="0" selected={groupOf(region) === 0}
            >{GROUP_NONE}</option
          >
          {#each Array.from({ length: GROUP_MAX }, (_, i) => i + 1) as n (n)}
            <option value={String(n)} selected={groupOf(region) === n}
              >{groupWord(n)}</option
            >
          {/each}
        </select>
      </div>
    </div>
    <p class="helper type-helper">{GROUP_HELPER}</p>
  {:else if region !== undefined && region.kind === "knob"}
    <!-- The knob's four modes (answer 11d). -->
    <div class="grid" class:two={twoColumns}>
      <div class="field">
        <label class="label type-helper" for={modeId}>{MODE}</label>
        <select
          class="input select"
          id={modeId}
          data-testid="field-mode"
          value={modeOf(region)}
          disabled={play}
          aria-describedby={lock}
          onchange={(event) =>
            onmode?.(event.currentTarget.value as RegionMode)}
        >
          {#each KNOB_MODES as mode (mode)}
            <option value={mode} selected={mode === modeOf(region)}
              >{KNOB_MODE_WORDS[mode as keyof typeof KNOB_MODE_WORDS]}</option
            >
          {/each}
        </select>
      </div>
    </div>
    {#if isRelative(region)}
      <p class="helper type-helper">{KNOB_RELATIVE_HELPER}</p>
    {/if}
  {/if}
{/snippet}

{#snippet midi()}
  {#if region !== undefined}
    {#if region.kind === "button"}
      <!-- Output first (answer 10): CC or Note; the number field follows the choice. -->
      <div class="grid" class:two={twoColumns}>
        <div class="field">
          <label class="label type-helper" for={outputId}>{OUTPUT}</label>
          <select
            class="input select"
            id={outputId}
            data-testid="field-output"
            value={outputOf(region)}
            disabled={play}
            aria-describedby={lock}
            onchange={(event) =>
              onoutput?.(event.currentTarget.value as ButtonOutput)}
          >
            {#each BUTTON_OUTPUTS as output (output)}
              <option value={output} selected={output === outputOf(region)}
                >{output === "cc" ? OUTPUT_CC : OUTPUT_NOTE}</option
              >
            {/each}
          </select>
        </div>
        {#if outputOf(region) === "note"}
          {@render numeric("note", NOTE_NUMBER)}
        {:else}
          {@render numeric("cc", CC_NUMBER)}
        {/if}
        {@render numeric("channel", CHANNEL)}
        {@render numeric("min", MIN)}
        {@render numeric("max", MAX)}
      </div>
      <p class="helper type-helper">
        {outputOf(region) === "note" ? NOTE_HELPER : BUTTON_MIN_MAX_HELPER}
      </p>
    {:else}
      <div class="grid" class:two={twoColumns}>
        {@render numeric(
          "cc",
          region.kind === "xy" ? `${CC_NUMBER} (X)` : CC_NUMBER,
        )}
        {#if region.kind === "xy"}
          {@render numeric("cc2", CC_NUMBER_Y)}
        {/if}
        {@render numeric("channel", CHANNEL)}
        <!-- Min and Max (answer 6a) - not under a knob's relative modes, where a detent is a step. -->
        {#if !(region.kind === "knob" && isRelative(region))}
          {@render numeric("min", MIN)}
          {@render numeric("max", MAX)}
        {/if}
      </div>
      {#if !(region.kind === "knob" && isRelative(region))}
        <p class="helper type-helper">{MIN_MAX_HELPER}</p>
      {/if}
    {/if}
  {/if}
{/snippet}

{#snippet appearance()}
  {#if region !== undefined}
    <div class="swatch" class:locked={play} data-testid="region-swatch">
      <Swatch
        entry={{ id: `sandbox-${region.id}`, name: region.name }}
        knobs={colourKnobs}
        held={noHeld}
        onchange={(_id, position) => {
          if (!play) oncolour(levelsOf(position));
        }}
        onreset={(id) => {
          if (!play && id === COLOUR_KNOB_ID) oncolour(DEFAULT_COLOUR);
        }}
        onhold={() => undefined}
      />
    </div>
  {/if}
  <!-- The surface's brightness (change 5): under Appearance whether or not an element is selected, its helper saying whose it is; read-only in Play like every field. -->
  <BrightnessField
    value={brightness}
    readonly={play}
    describedBy={lock}
    helper={BRIGHTNESS_SURFACE_HELPER}
    onchange={(next) => onbrightness?.(next)}
    onreset={() => onbrightness?.(255)}
    {oncommit}
  />
{/snippet}

{#snippet actions()}
  {#if region !== undefined}
    <button
      class="outlined"
      type="button"
      data-testid="duplicate-element"
      disabled={play}
      aria-describedby={lock}
      onclick={onduplicate}>{DUPLICATE}</button
    >
    <button
      class="outlined"
      type="button"
      data-testid="delete-element"
      disabled={play}
      aria-describedby={lock}
      onclick={ondelete}>{DELETE_ELEMENT}</button
    >
  {/if}
{/snippet}

<div class="region-inspector" bind:this={body} data-testid="region-inspector">
  <Inspector
    eyebrow={region === undefined
      ? NO_SELECTION_EYEBROW
      : `${SELECTED_ELEMENT} / ${KIND_LABELS[region.kind].toUpperCase()}`}
    {headline}
    aside={region === undefined ? undefined : chip}
    lede={region === undefined ? NO_SELECTION_LEDE : undefined}
    {sections}
    lead={region === undefined ? undefined : identity}
    actions={region === undefined ? undefined : actions}
  >
    {#if region !== undefined}
      {#if play}
        <p class="lock type-helper" id={lockId} data-testid="fields-locked">
          {PLAY_LOCKS_FIELDS}
        </p>
      {/if}
      {#if notice !== undefined}
        <p class="notice type-helper" data-testid="inspector-notice">
          {notice}
        </p>
      {/if}
    {/if}
  </Inspector>
</div>

{#snippet identity()}
  {#if region !== undefined}
    <!-- Identity (section 8): the name and the type, above the first section. -->
    <div class="identity">
      <div class="field">
        <label class="label type-helper" for={nameId}>{ELEMENT_NAME}</label>
        <input
          class="input"
          id={nameId}
          type="text"
          autocomplete="off"
          data-testid="field-name"
          value={region.name}
          readonly={play}
          aria-readonly={play}
          aria-describedby={lock}
          oninput={(event) => onrename(event.currentTarget.value)}
          onblur={oncommit}
          {onkeydown}
        />
      </div>
      <div class="grid" class:two={twoColumns}>
        <!-- The type is a fact, not a field: a kind never changes once placed (change 10A). -->
        <div class="field">
          <span class="label type-helper">{TYPE}</span>
          <span class="value" data-testid="field-kind" data-kind={region.kind}
            >{KIND_LABELS[region.kind]}</span
          >
        </div>
        {#if region.kind === "fader"}
          <div class="field">
            <label class="label type-helper" for={orientationId}
              >{ORIENTATION}</label
            >
            <select
              class="input select"
              id={orientationId}
              data-testid="field-orientation"
              value={orientationOf(region)}
              disabled={play}
              aria-describedby={view.orientationProblem !== undefined
                ? orientationProblemId
                : lock}
              onchange={(event) =>
                onorientation(event.currentTarget.value as Orientation)}
            >
              {#each ORIENTATIONS as orientation (orientation)}
                <option
                  value={orientation}
                  selected={orientation === orientationOf(region)}
                  >{orientation === "vertical"
                    ? ORIENTATION_VERTICAL
                    : ORIENTATION_HORIZONTAL}</option
                >
              {/each}
            </select>
          </div>
        {/if}
      </div>
      {#if view.orientationProblem !== undefined}
        <p
          class="message type-helper"
          id={orientationProblemId}
          data-testid="orientation-problem"
        >
          {view.orientationProblem}
        </p>
      {/if}
      <!-- Rule 6's warnings (geometry.ts), under the identity now that the geometry block is the plate's. -->
      {#each view.warnings.filter((w) => w.a === region.name || w.b === region.name) as warning (warning.a + warning.b)}
        <p class="warning type-helper" data-testid="adjacency-warning">
          {warning.message}
        </p>
      {/each}
    </div>
  {/if}
{/snippet}

<style>
  .region-inspector {
    display: contents;
  }

  /* The raised chip beside the headline: `2 × 6 units`, a rectangle (D-01). */
  .chip {
    display: inline-block;
    padding: 4px 8px;
    background: var(--color-raised);
    font-size: 12px;
    color: var(--color-ink);
    white-space: nowrap;
  }

  .identity {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-block-end: 20px;
  }

  /* D-21: one column, and two from NUMERIC_GRID_REFLOW, measured. */
  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px 22px;
  }

  .grid.two {
    grid-template-columns: 1fr 1fr;
  }

  /* A grid under a helper or a check: the section's own rhythm between the rows. */
  .helper + .grid,
  .check + .grid {
    margin-block-start: 12px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-inline-size: 0;
  }

  .label {
    color: var(--color-ink-quiet);
  }

  /* The PDF's field: 38 tall beneath the 44px floor, a boundary hairline, square (the user-agent radius zeroed for layer C); 16px so iOS does not zoom. */
  .input {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: 44px;
    padding-inline: 12px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: var(--color-workspace);
    font-family: var(--font-sans);
    font-size: 16px;
    color: var(--color-ink);
  }

  .input.numerals {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
  }

  .input:read-only,
  .input:disabled {
    color: var(--color-ink-quiet);
  }

  /* The type, read only: a line at the field's height, the ink, no box. */
  .value {
    display: flex;
    align-items: center;
    min-block-size: 44px;
    font-family: var(--font-sans);
    font-size: 16px;
    color: var(--color-ink);
  }

  /* The field that refused a keystroke: the error ink on its boundary only. */
  .invalid .input {
    border-color: var(--color-error-ink);
  }

  .message {
    margin: 0;
    color: var(--color-error-ink);
  }

  .helper,
  .warning,
  .lock,
  .notice {
    margin: 12px 0 0;
    color: var(--color-ink-quiet);
  }

  .check {
    display: flex;
    align-items: center;
    gap: 12px;
    min-block-size: 44px;
  }

  .checkbox {
    inline-size: 20px;
    block-size: 20px;
    margin: 0;
    border-radius: 0;
    accent-color: var(--color-action);
  }

  .swatch.locked {
    pointer-events: none;
    opacity: 0.6;
  }

  /* The pinned pair: outlined, the boundary token, square, 44px. */
  .outlined {
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 12px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    color: var(--color-ink);
    cursor: pointer;
  }

  .outlined:hover:not(:disabled) {
    border-color: var(--color-action);
  }

  .outlined:disabled {
    color: var(--color-ink-quiet);
    cursor: default;
  }
</style>
