<!--
  SELECTED ELEMENT(S): PDF page 3's right column in Inspector.svelte's panel - the eyebrow and
  the name (a count over a set, change 13A), the units chip, then four titled sections on the
  rack's grid (change 16c): Identity (the name with the lock box in its lock column, the type as
  a fact, Orientation on faders), Behavior (Mode, Speed, Spring and its value; Touches; Toggle and
  Group; a knob's Mode), MIDI output (Type, the number, Channel, Min, Max, Receive; an XY pad's
  axes as two blocks - change 17), Appearance, then the pinned Duplicate / Delete. Every
  field is one row - label | control | reset | lock - its control filling the column at 44: a text
  field, a fact, a segmented control of two words, a select past two, Stepper.svelte over a range;
  a helper is the label's title and a description; a set's differing field reads MIXED and has an
  Arrange row (13B); no selection lists Shared controllers (13C), Color input (17) and New elements.
  Decided at 13-16 (Bible section 8; D-21); see .planning/phases/13-gui-overhaul/13-16-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { brightnessOf } from "$lib/catalog/brightness";
  import {
    COLOUR_KNOB_ID,
    colourKnobView,
    levelsOf,
  } from "$lib/sandbox/colour-knob";
  import {
    ALIGN_BOTTOM,
    ALIGN_CENTRE_X,
    ALIGN_CENTRE_Y,
    ALIGN_LEFT,
    ALIGN_RIGHT,
    ALIGN_TOP,
    APPEARANCE,
    ARRANGE,
    ARRANGE_HELPER,
    BEHAVIOR,
    BUTTON_MIN_MAX_HELPER,
    CC_NUMBER,
    CHANNEL,
    COLOUR_LABEL,
    CONFLICTS,
    CONFLICTS_HELPER,
    DEFAULTS_HELPER,
    DELETE_ELEMENT,
    DISTRIBUTE_X,
    DISTRIBUTE_Y,
    DUPLICATE,
    ELEMENT_NAME,
    GROUP,
    GROUP_HELPER,
    GROUP_NONE,
    IDENTITY,
    KIND_LABELS,
    KNOB_MODE_WORDS,
    KNOB_RELATIVE_HELPER,
    LOCKED,
    LOCKED_HELPER,
    MAX,
    MIDI_OUTPUT,
    MIN,
    MIN_MAX_HELPER,
    MIXED,
    MODE,
    MODE_ABSOLUTE,
    MODE_HELPER,
    MODE_RELATIVE,
    MULTI_LEDE,
    NEW_ELEMENTS,
    NOTE_HELPER,
    NOTE_NUMBER,
    NO_SELECTION_EYEBROW,
    NO_SELECTION_HEADLINE,
    NO_SELECTION_LEDE,
    ORIENTATION,
    ORIENTATION_HORIZONTAL,
    ORIENTATION_VERTICAL,
    OUTPUT_CC,
    OUTPUT_NOTE,
    OUTPUT_TYPE,
    PLAY_LOCKS_FIELDS,
    RECENT_COLOURS,
    RECENT_COLOURS_HELPER,
    RESET_DEFAULTS,
    RESET_DEFAULTS_HELPER,
    SELECTED_ELEMENT,
    SELECTED_ELEMENTS,
    SPEED,
    SPEED_FULL,
    SPEED_HALF,
    SPEED_HELPER,
    SPRING,
    SPRING_HELPER,
    SPRING_VALUE,
    SWITCH_OFF,
    SWITCH_ON,
    TOGGLE,
    TOGGLE_HELPER,
    TOUCHES,
    TOUCHES_HELPER,
    TYPE,
    TYPE_HELPER,
    TYPE_PITCH_BEND,
    TYPE_PRESSURE,
    X_AXIS,
    Y_AXIS,
    RECEIVE,
    RECEIVE_HELPER,
    COLOR_INPUT,
    COLOR_INPUT_HELPER,
    COLOR_INPUT_SWITCH,
    FIRST_CC,
    CC_RANGE,
    CHANNEL_RANGE,
    WHOLE_NUMBER,
    conflictLine,
    deleteElements,
    elementsLine,
    groupWord,
    recentColourName,
    titledWithKeys,
    unitsChip,
  } from "$lib/sandbox/copy";
  import type { Conflict } from "$lib/sandbox/conflicts";
  import { modWord } from "$lib/sandbox/shortcuts";
  import {
    DEFAULT_COLOUR,
    type EditorState,
    type NumericField,
  } from "$lib/sandbox/editor";
  import type { Alignment, Axis } from "$lib/sandbox/geometry";
  import {
    BUTTON_OUTPUTS,
    CC_MAX,
    CC_MIN,
    CHANNEL_MAX,
    CHANNEL_MIN,
    CONTINUOUS_MODES,
    GROUP_MAX,
    KNOB_MODES,
    ORIENTATIONS,
    SPEEDS,
    TOUCHES_MAX,
    VALUE_MAX,
    VALUE_MIN,
    colourByte,
    groupOf,
    isRelative,
    lockedOf,
    maxOf,
    minOf,
    modeOf,
    orientationOf,
    outputOf,
    speedOf,
    springOf,
    springValueOf,
    touchesOf,
    CONTINUOUS_TYPES,
    channelYOf,
    hasNumber,
    receiveOf,
    typeOf,
    typeYOf,
    type ColourInput,
    type MidiType,
    type Orientation,
    type Region,
    type RegionMode,
    type Speed,
  } from "$lib/sandbox/model";
  import { BRIGHTNESS_SURFACE_HELPER } from "$lib/tune/inspector-copy";
  import BrightnessField from "$lib/ui/BrightnessField.svelte";
  import Inspector, {
    type InspectorSection,
  } from "$lib/ui/shell/Inspector.svelte";
  import Stepper from "$lib/ui/Stepper.svelte";
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
    onoutputy,
    onreceive,
    oncolourinput,
    ongroup,
    ontouches,
    onlocked,
    oncolour,
    onbrightness,
    onalign,
    ondistribute,
    onresetdefaults,
    onduplicate,
    ondelete,
    notice,
    recentColours = [],
    conflicts = [],
    mac = false,
  }: {
    view: EditorState;
    onrename: (name: string) => void;
    /** Every keystroke of a typed field, validated by the editor; a step box or an arrow is one keystroke of the next value. */
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
    /** The output's Type (change 17): a button's CC / Note, a continuous kind's (an XY pad's X axis) CC / Pitch bend / Channel pressure. */
    onoutput?: (output: MidiType) => void;
    /** An XY pad's Y axis Type (change 17). */
    onoutputy?: (output: MidiType) => void;
    /** Receive (change 17): MIDI RX on or off, one entry. */
    onreceive?: (receive: boolean) => void;
    /** The surface's Color input (change 17): a channel and a first CC, or undefined for off. */
    oncolourinput?: (input: ColourInput | undefined) => void;
    ongroup?: (group: number) => void;
    /** An XY pad's touch count, 1..5 (change 11); the editor refuses a count the controllers cannot carry. */
    ontouches?: (touches: number) => void;
    /** The lock (change 13A): the set locked or unlocked, one entry. */
    onlocked?: (locked: boolean) => void;
    /** Three RGB444 levels from the picker. */
    oncolour: (colour: readonly [number, number, number]) => void;
    /** The whole surface's brightness, 1..255 (change 5); 255 to reset. */
    onbrightness?: (brightness: number) => void;
    /** The Arrange row over a set (change 13B): editor.alignSelected and editor.distributeSelected. */
    onalign?: (to: Alignment) => void;
    ondistribute?: (axis: Axis) => void;
    /** Reset defaults, with nothing selected (change 13B): editor.resetDefaults - not an entry. */
    onresetdefaults?: () => void;
    onduplicate: () => void;
    ondelete: () => void;
    /** A duplicate refused, a store that declined, the defaults reset - the panel's one notice. */
    notice?: string;
    /** The recent colours (change 13C), newest first; a chip clicked is oncolour. */
    recentColours?: readonly (readonly [number, number, number])[];
    /** The shared-controller pairs (change 13C, conflicts.ts), listed with nothing selected. */
    conflicts?: readonly Conflict[];
    /** Cmd in the pinned pair's titles. */
    mac?: boolean;
  } = $props();

  const uid = $props.id();
  const nameId = `${uid}-name`;
  const orientationId = `${uid}-orientation`;
  const toggleId = `${uid}-toggle`;
  const modeId = `${uid}-mode`;
  const speedId = `${uid}-speed`;
  const springId = `${uid}-spring`;
  const outputId = `${uid}-output`;
  const outputYId = `${uid}-output-y`;
  const receiveId = `${uid}-receive`;
  const colourSwitchId = `${uid}-colour-input`;
  const colourHelperId = `${uid}-colour-input-helper`;
  const groupId = `${uid}-group`;
  const touchesId = `${uid}-touches`;
  const lockedHelperId = `${uid}-locked-helper`;
  const lockId = `${uid}-lock`;
  const arrangeHelperId = `${uid}-arrange-helper`;
  const recentHelperId = `${uid}-recent-helper`;
  const defaultsHelperId = `${uid}-defaults-helper`;

  /** A glyph is straight lines on a 20 x 20 box: [x1, y1, x2, y2] each (no curve, no radius). */
  type Glyph = readonly (readonly [number, number, number, number])[];
  /** An edge line and two bars from it; the centres a line through two centred bars; the spacings three bars. */
  const EDGE_LEFT: Glyph = [
    [3, 2, 3, 18],
    [3, 6, 15, 6],
    [3, 13, 11, 13],
  ];
  const flipX = (g: Glyph): Glyph =>
    g.map(([x1, y1, x2, y2]) => [20 - x1, y1, 20 - x2, y2]);
  const swap = (g: Glyph): Glyph =>
    g.map(([x1, y1, x2, y2]) => [y1, x1, y2, x2]);
  const CENTRE_X: Glyph = [
    [10, 2, 10, 18],
    [3, 6, 17, 6],
    [6, 13, 14, 13],
  ];
  const SPACE_X: Glyph = [
    [4, 3, 4, 17],
    [10, 5, 10, 15],
    [16, 3, 16, 17],
  ];
  /** The Arrange row's eight commands (change 13B): a test id, an accessible name, a glyph, and the call. */
  const ARRANGEMENTS: readonly {
    id: string;
    label: string;
    glyph: Glyph;
    align?: Alignment;
    distribute?: Axis;
  }[] = [
    { id: "arrange-left", label: ALIGN_LEFT, glyph: EDGE_LEFT, align: "left" },
    {
      id: "arrange-right",
      label: ALIGN_RIGHT,
      glyph: flipX(EDGE_LEFT),
      align: "right",
    },
    {
      id: "arrange-top",
      label: ALIGN_TOP,
      glyph: swap(EDGE_LEFT),
      align: "top",
    },
    {
      id: "arrange-bottom",
      label: ALIGN_BOTTOM,
      glyph: swap(flipX(EDGE_LEFT)),
      align: "bottom",
    },
    {
      id: "arrange-centre-x",
      label: ALIGN_CENTRE_X,
      glyph: CENTRE_X,
      align: "centre-x",
    },
    {
      id: "arrange-centre-y",
      label: ALIGN_CENTRE_Y,
      glyph: swap(CENTRE_X),
      align: "centre-y",
    },
    {
      id: "arrange-space-x",
      label: DISTRIBUTE_X,
      glyph: SPACE_X,
      distribute: "horizontal",
    },
    {
      id: "arrange-space-y",
      label: DISTRIBUTE_Y,
      glyph: swap(SPACE_X),
      distribute: "vertical",
    },
  ];
  const orientationProblemId = `${uid}-orientation-problem`;
  const touchesProblemId = `${uid}-touches-problem`;
  const fieldId = (field: NumericField) => `${uid}-${field}`;
  const messageId = (field: NumericField) => `${uid}-${field}-message`;
  const helperId = (field: NumericField) => `${uid}-${field}-helper`;

  /** The test id per typed field: the model's name, kebab where it is two words. */
  const FIELD_IDS: Readonly<Record<NumericField, string>> = {
    cc: "cc",
    cc2: "cc2",
    channel: "channel",
    channelY: "channel-y",
    min: "min",
    max: "max",
    springValue: "spring-value",
    note: "note",
  };

  /** Each typed field's closed range: the stepper's boxes and arrows walk it by one (the model refuses outside it). */
  const RANGES: Readonly<Record<NumericField, readonly [number, number]>> = {
    cc: [CC_MIN, CC_MAX],
    cc2: [CC_MIN, CC_MAX],
    channel: [CHANNEL_MIN, CHANNEL_MAX],
    channelY: [CHANNEL_MIN, CHANNEL_MAX],
    min: [VALUE_MIN, VALUE_MAX],
    max: [VALUE_MIN, VALUE_MAX],
    springValue: [VALUE_MIN, VALUE_MAX],
    note: [CC_MIN, CC_MAX],
  };

  /** A segmented control's or a select's words: the model's value and the copy's word. */
  type Word = { readonly value: string; readonly label: string };
  const ORIENTATION_WORDS: readonly Word[] = ORIENTATIONS.map((o) => ({
    value: o,
    label: o === "vertical" ? ORIENTATION_VERTICAL : ORIENTATION_HORIZONTAL,
  }));
  const MODE_WORDS: readonly Word[] = CONTINUOUS_MODES.map((m) => ({
    value: m,
    label: m === "absolute" ? MODE_ABSOLUTE : MODE_RELATIVE,
  }));
  const SPEED_WORDS: readonly Word[] = SPEEDS.map((s) => ({
    value: s,
    label: s === "half" ? SPEED_HALF : SPEED_FULL,
  }));
  const OUTPUT_WORDS: readonly Word[] = BUTTON_OUTPUTS.map((o) => ({
    value: o,
    label: o === "cc" ? OUTPUT_CC : OUTPUT_NOTE,
  }));
  /** A continuous output's three types (change 17, answer 2): a select, as one word is long. */
  const TYPE_WORDS: readonly Word[] = CONTINUOUS_TYPES.map((t) => ({
    value: t,
    label:
      t === "pitchbend"
        ? TYPE_PITCH_BEND
        : t === "pressure"
          ? TYPE_PRESSURE
          : OUTPUT_CC,
  }));
  /** The Color input's first values when it is switched on (change 17): the last channel, CC 0 up. */
  const COLOUR_INPUT_START: ColourInput = { channel: CHANNEL_MAX, cc: CC_MIN };
  /** A checkbox's two states as two words (change 16c): Spring, Toggle. */
  const SWITCH_WORDS: readonly Word[] = [
    { value: "false", label: SWITCH_OFF },
    { value: "true", label: SWITCH_ON },
  ];
  const KNOB_MODE_LIST: readonly Word[] = KNOB_MODES.map((m) => ({
    value: m,
    label: KNOB_MODE_WORDS[m as keyof typeof KNOB_MODE_WORDS],
  }));
  const TOUCHES_LIST: readonly Word[] = Array.from(
    { length: TOUCHES_MAX },
    (_, i) => ({ value: String(i + 1), label: String(i + 1) }),
  );
  const GROUP_LIST: readonly Word[] = [
    { value: "0", label: GROUP_NONE },
    ...Array.from({ length: GROUP_MAX }, (_, i) => ({
      value: String(i + 1),
      label: groupWord(i + 1),
    })),
  ];

  /** The set (change 13A): `region` is the one element while the set has one; `any` and `multi` size it. */
  const members = $derived(view.selectedRegions);
  const any = $derived(members.length > 0);
  const multi = $derived(members.length > 1);
  const region = $derived(view.selected);
  /** The kind every member is, or undefined over a mixed set: the kind-specific fields hang off it. */
  const sharedKind = $derived(
    any && members.every((r) => r.kind === members[0].kind)
      ? members[0].kind
      : undefined,
  );
  /** A reading every member agrees on, or undefined - MIXED - when they differ. */
  function shared<T>(read: (r: Region) => T): T | undefined {
    if (members.length === 0) return undefined;
    const first = read(members[0]);
    return members.every((r) => read(r) === first) ? first : undefined;
  }
  const play = $derived(view.mode === "play");
  const lock = $derived(play ? lockId : undefined);
  /** The surface's brightness (change 5): one field, shown with or without a selection. */
  const brightness = $derived(brightnessOf(view.surface.brightness));

  /** The swatch's one knob: the first member's colour at its lattice position (a set that differs says so beneath). */
  const colourKnobs = $derived(
    any
      ? [colourKnobView(members[0].colour, DEFAULT_COLOUR, COLOUR_LABEL)]
      : [],
  );
  const colourMixed = $derived(
    multi && shared((r) => r.colour.join(",")) === undefined,
  );
  const noHeld: ReadonlySet<string> = new Set();

  /** The ids a control is described by, joined; undefined with none. */
  const describedBy = (...ids: (string | undefined)[]): string | undefined =>
    ids.filter((id) => id !== undefined).join(" ") || undefined;

  /** The first member's own value for a typed field - the rung the boxes step from; a refused text steps from the model, as MidiField does. */
  function modelValue(field: NumericField): number | undefined {
    const first = members[0];
    if (first === undefined) return undefined;
    switch (field) {
      case "cc":
      case "note":
        return first.cc;
      case "cc2":
        return first.cc2;
      case "channel":
        return first.channel;
      case "channelY":
        return channelYOf(first);
      case "min":
        return minOf(first);
      case "max":
        return maxOf(first);
      case "springValue":
        return springValueOf(first);
    }
  }
  const rankOf = (field: NumericField): number =>
    (modelValue(field) ?? RANGES[field][0]) - RANGES[field][0];
  const countOf = (field: NumericField): number =>
    RANGES[field][1] - RANGES[field][0] + 1;
  /** A step box or an arrow: the next value in the range, typed for the editor as a keystroke; the field's blur or Enter is the boundary. */
  function stepTo(field: NumericField, rank: number): void {
    const [lo, hi] = RANGES[field];
    onnumber(field, String(Math.min(hi, Math.max(lo, lo + rank))));
  }
  /** The stepper's text: a keystroke goes to the editor; Enter and blur are the history's boundary. */
  function typed(field: NumericField, text: string, committed: boolean): void {
    if (committed) oncommit();
    else onnumber(field, text);
  }

  /** Receive's row (change 17): shown unless a member cannot hold a received value - a blank, a relative knob, a pad with more than one touch (model.ts `receivesOf`). */
  const canReceive = $derived(
    any &&
      !members.some(
        (r) =>
          r.kind === "blank" ||
          (r.kind === "knob" && isRelative(r)) ||
          touchesOf(r) > 1,
      ),
  );

  /** The Color input's typed fields (change 17): the text while one is being typed, and its refusal. */
  type ColourField = "channel" | "cc";
  let colourTyped = $state<
    { field: ColourField; text: string; problem?: string } | undefined
  >(undefined);
  const colourRange = (field: ColourField): readonly [number, number] =>
    field === "channel" ? [CHANNEL_MIN, CHANNEL_MAX] : [CC_MIN, CC_MAX];
  /** A keystroke applies a whole number in range at once (the brightness field's rule); Enter and blur are the history's boundary. */
  function typeColour(field: ColourField, text: string, committed: boolean) {
    const input = view.surface.colourInput;
    if (input === undefined) return;
    if (committed) {
      oncommit();
      if (colourTyped?.problem === undefined) colourTyped = undefined;
      return;
    }
    const trimmed = text.trim();
    if (!/^[0-9]+$/.test(trimmed)) {
      colourTyped = { field, text, problem: WHOLE_NUMBER };
      return;
    }
    const n = Number.parseInt(trimmed, 10);
    const [lo, hi] = colourRange(field);
    if (n < lo || n > hi) {
      colourTyped = {
        field,
        text,
        problem: field === "channel" ? CHANNEL_RANGE : CC_RANGE,
      };
      return;
    }
    colourTyped = { field, text };
    oncolourinput?.({ ...input, [field]: n });
  }
  /** A step box or an arrow: the next value in the range, applied. */
  function stepColour(field: ColourField, rank: number): void {
    const input = view.surface.colourInput;
    if (input === undefined) return;
    const [lo, hi] = colourRange(field);
    colourTyped = undefined;
    oncolourinput?.({
      ...input,
      [field]: Math.min(hi, Math.max(lo, lo + rank)),
    });
  }

  function onkeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      oncommit();
    }
  }

  const sections = $derived.by((): InspectorSection[] => {
    // No selection: the surface's own Appearance (the brightness), then New elements (the remembered defaults, 13B).
    if (!any)
      return [
        { title: APPEARANCE, content: appearance },
        { title: COLOR_INPUT, content: colourInput },
        { title: NEW_ELEMENTS, content: defaults },
      ];
    const out: InspectorSection[] = [];
    // A set: the Arrange row first (13B) - the spacings need three.
    if (multi) out.push({ title: ARRANGE, content: arrange });
    // Identity (section 8): the name, the type and the lock, Orientation on faders (change 16c: a titled section on the grid).
    out.push({ title: IDENTITY, content: identity });
    // Every sending kind has a Behavior since change 10B; a blank has none, and a set has one only when every member is one kind.
    if (sharedKind !== undefined && sharedKind !== "blank")
      out.push({ title: BEHAVIOR, content: behavior });
    // A blank sends nothing: no MIDI output section (change 10A), and none with a blank in the set.
    if (!members.some((r) => r.kind === "blank"))
      out.push({ title: MIDI_OUTPUT, content: midi });
    out.push({ title: APPEARANCE, content: appearance });
    return out;
  });
  /** The sections shown: with nothing selected and two elements on one controller (13C), Shared controllers first. */
  const shown = $derived(
    !any && conflicts.length > 0
      ? [{ title: CONFLICTS, content: conflictsSection }, ...sections]
      : sections,
  );
</script>

{#snippet headline()}
  {#if region !== undefined}
    <span data-testid="inspector-name">{region.name}</span>
  {:else if multi}
    <span data-testid="inspector-count">{elementsLine(members.length)}</span>
  {:else}
    {NO_SELECTION_HEADLINE}
  {/if}
{/snippet}

{#snippet chip()}
  {#if region !== undefined}
    <span class="chip numerals" data-testid="inspector-units"
      >{unitsChip(region.w, region.h)}</span
    >
  {/if}
{/snippet}

<!-- A typed field on the grid: Stepper.svelte over the field's range, the model's text shown, a refusal's line under the row. A helper is the label's title and, rendered once, a description; `sharedHelper` names a description another row rendered (Max reads Min's). -->
{#snippet numeric(
  field: NumericField,
  label: string,
  helper: string | undefined,
  sharedHelper: string | undefined,
)}
  {@const problem = view.fields[field]}
  {@const mixed = view.mixed.includes(field) && problem === undefined}
  {@const ownHelper =
    helper !== undefined && sharedHelper === undefined
      ? helperId(field)
      : undefined}
  <div class="field" class:invalid={problem !== undefined}>
    <div class="row">
      <label class="label type-micro" for={fieldId(field)} title={helper}
        >{label}</label
      >
      {#if ownHelper !== undefined}
        <span class="sr-only" id={ownHelper}>{helper}</span>
      {/if}
      <div class="control">
        <Stepper
          id={fieldId(field)}
          testid="field-{FIELD_IDS[field]}"
          inputTestid="field-{FIELD_IDS[field]}"
          value={view.texts[field]}
          rank={rankOf(field)}
          count={countOf(field)}
          invalid={problem !== undefined}
          describedBy={describedBy(
            problem !== undefined ? messageId(field) : undefined,
            ownHelper ?? sharedHelper,
            lock,
          )}
          hint={false}
          inputmode={field === "note" ? "text" : "numeric"}
          readonly={play}
          placeholder={mixed ? MIXED : undefined}
          {mixed}
          ontext={(text, committed) => typed(field, text, committed)}
          onrank={(rank) => stepTo(field, rank)}
        />
      </div>
    </div>
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

<!-- A worded field of two: the rack's segmented control - real radios in labels under a radiogroup, joined boxes of equal width, the chosen one on the action colour by edge and word. Over a set that differs (change 13A) none is chosen and the group says so. -->
{#snippet segmented(
  id: string,
  testid: string,
  label: string,
  helper: string | undefined,
  words: readonly Word[],
  value: string | undefined,
  onpick: (value: string) => void,
  problem: { id: string; testid: string; text: string } | undefined,
)}
  {@const labelId = `${id}-label`}
  {@const helpId = helper === undefined ? undefined : `${id}-helper`}
  <div class="field">
    <div class="row">
      <span class="label type-micro" id={labelId} title={helper}>{label}</span>
      {#if helper !== undefined}
        <span class="sr-only" id={helpId}>{helper}</span>
      {/if}
      <div
        class="control options"
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={describedBy(
          problem === undefined ? undefined : problem.id,
          helpId,
          lock,
        )}
        data-testid={testid}
        data-value={value ?? ""}
        data-mixed={value === undefined || undefined}
        aria-disabled={play || undefined}
        style:--segment-cols={words.length}
      >
        {#each words as word (word.value)}
          <label class="option" class:selected={word.value === value}>
            <input
              class="sr-only"
              type="radio"
              name={id}
              value={word.value}
              checked={word.value === value}
              disabled={play}
              onchange={() => onpick(word.value)}
            />
            <span class="word">{word.label}</span>
          </label>
        {/each}
      </div>
    </div>
    {#if problem !== undefined}
      <p
        class="message type-helper"
        id={problem.id}
        data-testid={problem.testid}
      >
        {problem.text}
      </p>
    {/if}
  </div>
{/snippet}

<!-- A worded field past two: the rack's select. The blank option a select shows while its members differ (change 13A); choosing any other applies to all. `onpick` is handed the element so Touches can snap it back after a refusal. -->
{#snippet selectRow(
  id: string,
  testid: string,
  label: string,
  helper: string | undefined,
  words: readonly Word[],
  value: string | undefined,
  onpick: (value: string, select: HTMLSelectElement) => void,
  problem: { id: string; testid: string; text: string } | undefined,
)}
  {@const helpId = helper === undefined ? undefined : `${id}-helper`}
  <div class="field">
    <div class="row">
      <label class="label type-micro" for={id} title={helper}>{label}</label>
      {#if helper !== undefined}
        <span class="sr-only" id={helpId}>{helper}</span>
      {/if}
      <div class="control select-wrap">
        <select
          class="select"
          {id}
          data-testid={testid}
          value={value ?? ""}
          disabled={play}
          aria-describedby={describedBy(
            problem === undefined ? undefined : problem.id,
            helpId,
            lock,
          )}
          onchange={(event) =>
            onpick(event.currentTarget.value, event.currentTarget)}
        >
          {#if value === undefined}
            <option value="" disabled>{MIXED}</option>
          {/if}
          {#each words as word (word.value)}
            <option value={word.value} selected={word.value === value}
              >{word.label}</option
            >
          {/each}
        </select>
      </div>
    </div>
    {#if problem !== undefined}
      <p
        class="message type-helper"
        id={problem.id}
        data-testid={problem.testid}
      >
        {problem.text}
      </p>
    {/if}
  </div>
{/snippet}

<!-- The lock (change 13A, suggestion 6), as the rack's lock box in the lock column of the first identity row (change 16c): pressed when every member is locked, mixed when they differ; Ctrl+L on the plate is the same toggle. -->
{#snippet lockBox()}
  {@const locked = shared(lockedOf)}
  <button
    class="box lock"
    type="button"
    data-testid="field-locked"
    aria-pressed={locked === undefined ? "mixed" : locked}
    aria-label={LOCKED}
    title={LOCKED_HELPER}
    disabled={play}
    aria-describedby={describedBy(lockedHelperId, lock)}
    onclick={() => onlocked?.(locked !== true)}
  >
    <svg class="glyph" viewBox="0 0 20 20" aria-hidden="true">
      <line x1="5" y1="10" x2="15" y2="10" />
      <line x1="15" y1="10" x2="15" y2="17" />
      <line x1="15" y1="17" x2="5" y2="17" />
      <line x1="5" y1="17" x2="5" y2="10" />
      <line x1="7" y1="10" x2="7" y2="5" />
      <line x1="7" y1="5" x2="13" y2="5" />
      <line x1="13" y1="5" x2="13" y2={locked === true ? 10 : 7} />
    </svg>
  </button>
  <span class="sr-only" id={lockedHelperId}>{LOCKED_HELPER}</span>
{/snippet}

{#snippet identity()}
  {@const orientation = shared(orientationOf)}
  <div class="rows">
    {#if region !== undefined}
      <!-- The name (one element only), with the lock box in the row's lock column. -->
      <div class="field">
        <div class="row">
          <label class="label type-micro" for={nameId}>{ELEMENT_NAME}</label>
          <div class="control">
            <input
              class="text"
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
          {@render lockBox()}
        </div>
      </div>
    {/if}
    <!-- The type is a fact, not a field: a kind never changes once placed (change 10A); over a mixed set it reads Mixed, and a set (no name row) carries the lock here. -->
    <div class="field">
      <div class="row">
        <span class="label type-micro">{TYPE}</span>
        <div class="control">
          <span
            class="fact"
            data-testid="field-kind"
            data-kind={sharedKind ?? "mixed"}
            >{sharedKind === undefined ? MIXED : KIND_LABELS[sharedKind]}</span
          >
        </div>
        {#if region === undefined}
          {@render lockBox()}
        {/if}
      </div>
    </div>
    {#if sharedKind === "fader"}
      {@render segmented(
        orientationId,
        "field-orientation",
        ORIENTATION,
        undefined,
        ORIENTATION_WORDS,
        orientation,
        (value) => onorientation(value as Orientation),
        view.orientationProblem === undefined
          ? undefined
          : {
              id: orientationProblemId,
              testid: "orientation-problem",
              text: view.orientationProblem,
            },
      )}
    {/if}
  </div>
  <!-- Rule 6's warnings (geometry.ts), under the identity now that the geometry block is the plate's. -->
  {#if region !== undefined}
    {#each view.warnings.filter((w) => w.a === region.name || w.b === region.name) as warning (warning.a + warning.b)}
      <p class="warning type-helper" data-testid="adjacency-warning">
        {warning.message}
      </p>
    {/each}
  {/if}
{/snippet}

{#snippet behavior()}
  <div class="rows">
    {#if sharedKind === "fader" || sharedKind === "xy"}
      {@const mode = shared(modeOf)}
      {@const speed = shared(speedOf)}
      {@const relative = members.some(isRelative)}
      <!-- Mode and, under Relative, Speed (answers 7c); a fader's Spring and its value (answer 8). -->
      {@render segmented(
        modeId,
        "field-mode",
        MODE,
        MODE_HELPER,
        MODE_WORDS,
        mode,
        (value) => onmode?.(value as RegionMode),
        undefined,
      )}
      {#if relative}
        {@render segmented(
          speedId,
          "field-speed",
          SPEED,
          SPEED_HELPER,
          SPEED_WORDS,
          speed,
          (value) => onspeed?.(value as Speed),
          undefined,
        )}
      {/if}
      {#if sharedKind === "xy"}
        {@const touches = shared(touchesOf)}
        <!-- Touches (change 11, answers 1a and 2a): 1 to 5; a refused count snaps the select back to the model's and shows its line. -->
        {@render selectRow(
          touchesId,
          "field-touches",
          TOUCHES,
          TOUCHES_HELPER,
          TOUCHES_LIST,
          touches === undefined ? undefined : String(touches),
          (value, select) => {
            ontouches?.(Number.parseInt(value, 10));
            const now = shared(touchesOf);
            select.value = now === undefined ? "" : String(now);
          },
          view.touchesProblem === undefined
            ? undefined
            : {
                id: touchesProblemId,
                testid: "touches-problem",
                text: view.touchesProblem,
              },
        )}
      {/if}
      {#if sharedKind === "fader"}
        {@const spring = shared(springOf)}
        {@render segmented(
          springId,
          "field-spring",
          SPRING,
          SPRING_HELPER,
          SWITCH_WORDS,
          spring === undefined ? undefined : String(spring),
          (value) => onspring?.(value === "true"),
          undefined,
        )}
        {#if spring === true}
          {@render numeric("springValue", SPRING_VALUE, undefined, undefined)}
        {/if}
      {/if}
    {:else if sharedKind === "button"}
      {@const group = shared(groupOf)}
      {@const latch = shared((r) => r.latch === true)}
      <!-- Toggle (the schema's latch) and the radio group (answer 9b). -->
      {@render segmented(
        toggleId,
        "field-toggle",
        TOGGLE,
        TOGGLE_HELPER,
        SWITCH_WORDS,
        latch === undefined ? undefined : String(latch),
        (value) => onlatch(value === "true"),
        undefined,
      )}
      {@render selectRow(
        groupId,
        "field-group",
        GROUP,
        GROUP_HELPER,
        GROUP_LIST,
        group === undefined ? undefined : String(group),
        (value) => ongroup?.(Number.parseInt(value, 10)),
        undefined,
      )}
    {:else if sharedKind === "knob"}
      {@const mode = shared(modeOf)}
      <!-- The knob's four modes (answer 11d), a select; under a relative mode the helper says Min and Max do not apply. -->
      {@render selectRow(
        modeId,
        "field-mode",
        MODE,
        members.some(isRelative) ? KNOB_RELATIVE_HELPER : undefined,
        KNOB_MODE_LIST,
        mode,
        (value) => onmode?.(value as RegionMode),
        undefined,
      )}
    {/if}
  </div>
{/snippet}

<!-- Change 17: every output's Type, Number and Channel. A continuous kind's Type is a select (Pitch bend and Channel pressure carry no number, so the number row goes with them); a button's the two-word segmented control; an XY pad's two outputs are two blocks under their axis's sub-head, each its own Type, number and channel. -->
{#snippet midi()}
  <div class="rows">
    {#if sharedKind === "button"}
      {@const output = shared(outputOf)}
      <!-- Type first (answer 10): CC or Note; the number field follows the choice - over a set, only when every member is on Note (the controller is each one's own). -->
      {@render segmented(
        outputId,
        "field-output",
        OUTPUT_TYPE,
        undefined,
        OUTPUT_WORDS,
        output,
        (value) => onoutput?.(value as MidiType),
        undefined,
      )}
      {#if output === "note"}
        {@render numeric("note", NOTE_NUMBER, NOTE_HELPER, undefined)}
      {:else if region !== undefined}
        {@render numeric("cc", CC_NUMBER, undefined, undefined)}
      {/if}
      {@render numeric("channel", CHANNEL, undefined, undefined)}
      {@render numeric("min", MIN, BUTTON_MIN_MAX_HELPER, undefined)}
      {@render numeric("max", MAX, BUTTON_MIN_MAX_HELPER, helperId("min"))}
    {:else if sharedKind === "xy"}
      {@const typeX = shared(typeOf)}
      {@const typeY = shared(typeYOf)}
      <!-- The pad's shared rows first - Min and Max serve both axes, Receive the pad - then its two outputs, each under its axis. -->
      {@render numeric("min", MIN, MIN_MAX_HELPER, undefined)}
      {@render numeric("max", MAX, MIN_MAX_HELPER, helperId("min"))}
      {#if canReceive}
        {@render receiveRow()}
      {/if}
      <p class="subhead type-micro" data-testid="axis-x">{X_AXIS}</p>
      {@render selectRow(
        outputId,
        "field-output",
        OUTPUT_TYPE,
        TYPE_HELPER,
        TYPE_WORDS,
        typeX,
        (value) => onoutput?.(value as MidiType),
        undefined,
      )}
      {#if region !== undefined && hasNumber(typeOf(region))}
        {@render numeric("cc", CC_NUMBER, undefined, undefined)}
      {/if}
      {@render numeric("channel", CHANNEL, undefined, undefined)}
      <p class="subhead type-micro" data-testid="axis-y">{Y_AXIS}</p>
      {@render selectRow(
        outputYId,
        "field-output-y",
        OUTPUT_TYPE,
        TYPE_HELPER,
        TYPE_WORDS,
        typeY,
        (value) => onoutputy?.(value as MidiType),
        undefined,
      )}
      {#if region !== undefined && hasNumber(typeYOf(region))}
        {@render numeric("cc2", CC_NUMBER, undefined, undefined)}
      {/if}
      {@render numeric("channelY", CHANNEL, undefined, undefined)}
    {:else if any}
      {@const relativeKnob = members.some(
        (r) => r.kind === "knob" && isRelative(r),
      )}
      <!-- A fader's or a knob's Type - not under a knob's relative modes, which send relative CC steps. -->
      {#if sharedKind !== undefined && !relativeKnob}
        {@render selectRow(
          outputId,
          "field-output",
          OUTPUT_TYPE,
          TYPE_HELPER,
          TYPE_WORDS,
          shared(typeOf),
          (value) => onoutput?.(value as MidiType),
          undefined,
        )}
      {/if}
      {#if region !== undefined && hasNumber(typeOf(region))}
        {@render numeric("cc", CC_NUMBER, undefined, undefined)}
      {/if}
      {@render numeric("channel", CHANNEL, undefined, undefined)}
      <!-- Min and Max (answer 6a) - not under a knob's relative modes, where a detent is a step. -->
      {#if !relativeKnob}
        {@render numeric("min", MIN, MIN_MAX_HELPER, undefined)}
        {@render numeric("max", MAX, MIN_MAX_HELPER, helperId("min"))}
      {/if}
    {/if}
    {#if canReceive && sharedKind !== "xy"}
      {@render receiveRow()}
    {/if}
  </div>
{/snippet}

<!-- Receive (change 17, answers 1i and 1ii): Off / On, on by default. -->
{#snippet receiveRow()}
  {@const receive = shared(receiveOf)}
  {@render segmented(
    receiveId,
    "field-receive",
    RECEIVE,
    RECEIVE_HELPER,
    SWITCH_WORDS,
    receive === undefined ? undefined : String(receive),
    (value) => onreceive?.(value === "true"),
    undefined,
  )}
{/snippet}

<!-- The surface's Color input (change 17, answer 1iii), with nothing selected: Off / On, then its channel and first CC as the rack's steppers. -->
{#snippet colourInput()}
  {@const input = view.surface.colourInput}
  <p class="helper first type-helper" id={colourHelperId}>
    {COLOR_INPUT_HELPER}
  </p>
  <div class="rows">
    {@render segmented(
      colourSwitchId,
      "colour-input",
      COLOR_INPUT_SWITCH,
      undefined,
      SWITCH_WORDS,
      String(input !== undefined),
      (value) => {
        colourTyped = undefined;
        oncolourinput?.(
          value === "true" ? (input ?? COLOUR_INPUT_START) : undefined,
        );
        // The switch is an entry of its own: a first CC typed next is another.
        oncommit();
      },
      undefined,
    )}
    {#if input !== undefined}
      {#each [["channel", CHANNEL, input.channel], ["cc", FIRST_CC, input.cc]] as const as [field, label, value] (field)}
        {@const [lo, hi] = colourRange(field)}
        {@const typed = colourTyped?.field === field ? colourTyped : undefined}
        {@const problemId = `${colourSwitchId}-${field}-message`}
        <div class="field" class:invalid={typed?.problem !== undefined}>
          <div class="row">
            <label class="label type-micro" for={`${colourSwitchId}-${field}`}
              >{label}</label
            >
            <div class="control">
              <Stepper
                id={`${colourSwitchId}-${field}`}
                testid="colour-input-{field}"
                inputTestid="colour-input-{field}"
                value={typed?.text ?? String(value)}
                rank={value - lo}
                count={hi - lo + 1}
                invalid={typed?.problem !== undefined}
                describedBy={describedBy(
                  typed?.problem !== undefined ? problemId : undefined,
                  colourHelperId,
                  lock,
                )}
                hint={false}
                inputmode="numeric"
                readonly={play}
                ontext={(text, committed) => typeColour(field, text, committed)}
                onrank={(rank) => stepColour(field, rank)}
              />
            </div>
          </div>
          {#if typed?.problem !== undefined}
            <p
              class="message type-helper"
              id={problemId}
              data-testid="colour-input-{field}-message"
            >
              {typed.problem}
            </p>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
{/snippet}

{#snippet appearance()}
  <div class="rows">
    {#if any}
      <div class="swatch" class:locked={play} data-testid="region-swatch">
        <Swatch
          entry={{
            id: `sandbox-${members[0].id}`,
            name: region?.name ?? elementsLine(members.length),
          }}
          knobs={colourKnobs}
          held={noHeld}
          lock={false}
          onchange={(_id, position) => {
            if (!play) oncolour(levelsOf(position));
          }}
          onreset={(id) => {
            if (!play && id === COLOUR_KNOB_ID) oncolour(DEFAULT_COLOUR);
          }}
          onhold={() => undefined}
        />
        {#if colourMixed}
          <p class="message quiet type-helper" data-testid="colour-mixed">
            {MIXED}
          </p>
        {/if}
      </div>
      {#if recentColours.length > 0}
        <!-- The recent colours (change 13C): the last eight applied, newest first; a chip is the swatch's own oncolour, so a set takes it whole. -->
        <div
          class="recent"
          role="group"
          aria-label={RECENT_COLOURS}
          title={RECENT_COLOURS_HELPER}
          aria-describedby={recentHelperId}
          data-testid="recent-colours"
        >
          {#each recentColours as colour (colour.join(","))}
            {@const rgb = colour.map(colourByte)}
            <button
              class="chip-colour"
              type="button"
              data-testid="recent-colour"
              data-colour={colour.join(",")}
              aria-label={recentColourName(rgb[0], rgb[1], rgb[2])}
              title={recentColourName(rgb[0], rgb[1], rgb[2])}
              disabled={play}
              style:background="rgb({rgb[0]}
              {rgb[1]}
              {rgb[2]})"
              onclick={() => oncolour([colour[0], colour[1], colour[2]])}
            ></button>
          {/each}
          <span class="sr-only" id={recentHelperId}
            >{RECENT_COLOURS_HELPER}</span
          >
        </div>
      {/if}
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
  </div>
{/snippet}

{#snippet arrange()}
  <!-- Eight 44px icon boxes (change 13B), four to a line: the six alignments, the two spacings - disabled under three members - each named, described by the helper. -->
  <div class="arrange" role="group" aria-label={ARRANGE} data-testid="arrange">
    {#each ARRANGEMENTS as a (a.id)}
      <button
        class="icon"
        type="button"
        data-testid={a.id}
        aria-label={a.label}
        title={a.label}
        disabled={play || (a.distribute !== undefined && members.length < 3)}
        aria-describedby={play ? lock : arrangeHelperId}
        onclick={() =>
          a.align !== undefined
            ? onalign?.(a.align)
            : a.distribute !== undefined
              ? ondistribute?.(a.distribute)
              : undefined}
      >
        <svg class="glyph" viewBox="0 0 20 20" aria-hidden="true">
          {#each a.glyph as [x1, y1, x2, y2], i (i)}
            <line {x1} {y1} {x2} {y2} />
          {/each}
        </svg>
      </button>
    {/each}
  </div>
  <p class="helper type-helper" id={arrangeHelperId}>{ARRANGE_HELPER}</p>
{/snippet}

{#snippet conflictsSection()}
  <!-- The shared-controller pass (change 13C): one line per pair, a warning and never a refusal. -->
  <p class="helper first type-helper">{CONFLICTS_HELPER}</p>
  {#each conflicts as c (`${c.aId}:${c.bId}:${c.cc}`)}
    <p class="warning type-helper" data-testid="conflict-line">
      {conflictLine(c.a, c.b, c.cc, c.channel)}
    </p>
  {/each}
{/snippet}

{#snippet defaults()}
  <!-- The remembered defaults (change 13B): what a new element starts from, and the one-click reset - not an entry, so its helper says Undo does not take it back. -->
  <p class="helper first type-helper">{DEFAULTS_HELPER}</p>
  <button
    class="outlined"
    type="button"
    data-testid="reset-defaults"
    disabled={play}
    aria-describedby={play ? lock : defaultsHelperId}
    onclick={() => onresetdefaults?.()}>{RESET_DEFAULTS}</button
  >
  <p class="helper type-helper" id={defaultsHelperId}>
    {RESET_DEFAULTS_HELPER}
  </p>
{/snippet}

{#snippet actions()}
  {#if any}
    <button
      class="outlined action"
      type="button"
      data-testid="duplicate-element"
      disabled={play}
      aria-describedby={lock}
      title={titledWithKeys(DUPLICATE, `${modWord(mac)}+D`)}
      onclick={onduplicate}>{DUPLICATE}</button
    >
    <button
      class="outlined action"
      type="button"
      data-testid="delete-element"
      disabled={play}
      aria-describedby={lock}
      title={titledWithKeys(
        multi ? deleteElements(members.length) : DELETE_ELEMENT,
        "Delete",
      )}
      onclick={ondelete}
      >{multi ? deleteElements(members.length) : DELETE_ELEMENT}</button
    >
  {/if}
{/snippet}

<div class="region-inspector" data-testid="region-inspector">
  <Inspector
    eyebrow={!any
      ? NO_SELECTION_EYEBROW
      : `${multi ? SELECTED_ELEMENTS : SELECTED_ELEMENT} / ${(sharedKind === undefined ? MIXED : KIND_LABELS[sharedKind]).toUpperCase()}`}
    {headline}
    aside={region === undefined ? undefined : chip}
    lede={!any ? NO_SELECTION_LEDE : multi ? MULTI_LEDE : undefined}
    sections={shown}
    actions={!any ? undefined : actions}
  >
    {#if play}
      <p class="hold type-helper" id={lockId} data-testid="fields-locked">
        {PLAY_LOCKS_FIELDS}
      </p>
    {/if}
    <!-- The notice with or without a selection (13B: the defaults' reset has none). -->
    {#if notice !== undefined}
      <p class="notice type-helper" data-testid="inspector-notice">
        {notice}
      </p>
    {/if}
  </Inspector>
</div>

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

  /* A section's rows (TuningRegion.svelte's shape): a hairline between them; each row queries its own root. */
  .rows {
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
  }

  .rows > :global(* + *) {
    border-block-start: 1px solid var(--color-divider);
  }

  /* The root is the container its row queries (Knob.svelte's shape). */
  .field {
    container-type: inline-size;
    min-inline-size: 0;
  }

  /* Knob.svelte's grid (change 16b): label | control | reset | lock, 8px between, 44px tall; the reset cell empty on every row (the Sandbox has no per-field default), the lock cell filled on the first identity row only. */
  .row {
    position: relative;
    display: grid;
    grid-template-columns: var(--tune-label-w, 96px) minmax(0, 1fr) 44px 44px;
    grid-template-areas: "label control reset lock";
    column-gap: 8px;
    align-items: center;
    min-block-size: 44px;
    padding-inline-start: 4px;
  }

  /* Knob.svelte's switch: under 380px of container the label takes a line of its own, the control still fills its column, the boxes keep their columns. */
  @container (width < 380px) {
    .row {
      grid-template-columns: minmax(0, 1fr) 44px 44px;
      grid-template-areas:
        "label label label"
        "control reset lock";
      row-gap: 4px;
      padding-block: 6px;
    }
  }

  /* The eyebrow face, quiet; ink while the row is hovered or holds focus. */
  .label {
    grid-area: label;
    display: block;
    min-inline-size: 0;
    color: var(--color-ink-quiet);
    overflow-wrap: normal;
    transition: color 140ms ease-out;
  }

  .row:hover .label,
  .row:focus-within .label {
    color: var(--color-ink);
  }

  /* The control column: whatever the shape, it fills the column edge to edge, 44px tall. */
  .control {
    grid-area: control;
    display: grid;
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: 0;
    min-block-size: 44px;
  }

  /* The name: a typed field at 44, the house face at the field's 15px, a boundary hairline, 12px in; square (the user-agent radius zeroed for layer C). */
  .text {
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: 0;
    block-size: 44px;
    padding-inline: 12px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: var(--color-workspace);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.45;
    color: var(--color-ink);
  }

  .text:hover:not(:read-only) {
    border-color: var(--color-ink-quiet);
  }

  .text:read-only {
    color: var(--color-ink-quiet);
  }

  /* The type, a fact: the kind word on the field's line and at its inset, in the ink, no boundary - not editable, and not a broken field. */
  .fact {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    min-inline-size: 0;
    block-size: 44px;
    padding-inline: 12px;
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.45;
    color: var(--color-ink);
  }

  /*
    The segmented control (Knob.svelte's rules): real radios in labels under a radiogroup, drawn as
    joined boxes of EQUAL width - each a boundary hairline, the shared edges collapsed - the chosen
    one outlined and worded in the action colour, never a fill alone. Every Sandbox word row has
    two words, so the columns are counted from the words, never measured.
  */
  .options {
    grid-template-columns: repeat(var(--segment-cols, 2), minmax(0, 1fr));
    padding-block-start: 1px;
    padding-inline-start: 1px;
    font-size: 13px;
    font-weight: 600;
    -webkit-touch-callout: none;
    user-select: none;
  }

  .option {
    position: relative;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    min-inline-size: 0;
    min-block-size: 44px;
    padding-inline: 3px;
    margin-block-start: -1px;
    margin-inline-start: -1px;
    border: 1px solid var(--color-boundary);
    cursor: pointer;
    transition: border-color 140ms ease-out;
  }

  .option:hover {
    border-color: var(--color-ink-quiet);
  }

  .option.selected {
    z-index: 1;
    border-color: var(--color-action);
  }

  /* The radio is visually hidden, so the site's ring is drawn on the option. */
  .option:has(:focus-visible) {
    z-index: 1;
    outline: 2px solid var(--color-action);
    outline-offset: 2px;
  }

  /* Under Play the radios are disabled: the words quiet, no hand. */
  .option:has(:disabled) {
    cursor: default;
  }

  .word {
    min-inline-size: 0;
    max-inline-size: 100%;
    overflow: hidden;
    white-space: nowrap;
    letter-spacing: 0.01em;
    color: var(--color-ink-quiet);
    transition: color 140ms ease-out;
  }

  .option:hover .word {
    color: var(--color-ink);
  }

  .option.selected .word {
    color: var(--color-action);
  }

  /* The select (Knob.svelte's): a boundary hairline, the field's 15px, the column's width at 44px, appearance none so no engine rounds it; the arrow inside the end padding. */
  .select-wrap {
    position: relative;
  }

  .select-wrap::after {
    content: "";
    position: absolute;
    inset-inline-end: 16px;
    inset-block-start: 50%;
    inline-size: 8px;
    block-size: 8px;
    border-inline-end: 1px solid var(--color-ink-quiet);
    border-block-end: 1px solid var(--color-ink-quiet);
    transform: translateY(-70%) rotate(45deg);
    pointer-events: none;
  }

  .select {
    appearance: none;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 44px;
    min-block-size: 44px;
    padding-inline: 12px 36px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: var(--color-workspace);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.45;
    color: var(--color-ink);
    cursor: pointer;
  }

  .select:hover:not(:disabled) {
    border-color: var(--color-ink-quiet);
  }

  .select:disabled {
    color: var(--color-ink-quiet);
    cursor: default;
  }

  .select option {
    color: var(--color-ink);
    background: var(--color-panel);
  }

  /* The lock box (Knob.svelte's): the tool rail's 44px square with a straight-line glyph, the shackle seated when locked; the Quiet tier, borderless. */
  .box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    inline-size: 44px;
    min-inline-size: 44px;
    block-size: 44px;
    min-block-size: 44px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 140ms ease-out;
  }

  .lock {
    grid-area: lock;
  }

  .box:hover:not(:disabled),
  .lock[aria-pressed="true"] {
    color: var(--color-ink);
  }

  .box:disabled {
    cursor: default;
  }

  .glyph {
    inline-size: 20px;
    block-size: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
  }

  /* The field that refused a keystroke: the error ink on its line under the row - never on a button (X-01); the Stepper carries the boundary. */
  .message {
    margin: 4px 0 8px 8px;
    color: var(--color-error-ink);
  }

  /* The set's colours differ: the word under the swatch row, quiet. */
  .message.quiet {
    color: var(--color-ink-quiet);
  }

  .helper,
  .warning,
  .hold,
  .notice {
    margin: 12px 0 0;
    color: var(--color-ink-quiet);
  }

  /* A helper that opens a section sits on the title's rhythm, and the control under it takes the same gap. */
  .helper.first {
    margin-block: 0 12px;
  }

  /* An output block's sub-head inside MIDI output (change 17: an XY pad's X axis and Y axis): the eyebrow face in ink, the row's 4px start, a line of its own above its rows - the hairline rhythm's, no rule of its own. */
  .subhead {
    margin: 0;
    padding-block: 16px 8px;
    padding-inline-start: 4px;
    color: var(--color-ink);
  }

  .rows > .subhead:first-child {
    padding-block-start: 0;
  }

  /* The Arrange row (13B): eight square icon boxes, four to a line (the alignments, then the centres and the spacings) - a body of 385 held 7 + 1 (change 16c). */
  .arrange {
    display: grid;
    grid-template-columns: repeat(4, 44px);
    gap: 8px;
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 44px;
    block-size: 44px;
    padding: 0;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: transparent;
    color: var(--color-ink);
    cursor: pointer;
  }

  .icon:hover:not(:disabled) {
    border-color: var(--color-action);
    color: var(--color-action);
  }

  .icon:disabled {
    color: var(--color-ink-quiet);
    cursor: default;
  }

  .glyph line {
    stroke: currentColor;
    stroke-width: 2;
  }

  .swatch.locked {
    pointer-events: none;
    opacity: 0.6;
  }

  /* The recent colours (13C): up to eight 44px squares in their colour, 8px apart, a row of the section between its hairlines. */
  .recent {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-block: 8px;
    padding-inline-start: 4px;
  }

  .chip-colour {
    inline-size: 44px;
    block-size: 44px;
    padding: 0;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    cursor: pointer;
  }

  .chip-colour:hover:not(:disabled) {
    border-color: var(--color-action);
  }

  .chip-colour:disabled {
    cursor: default;
    opacity: 0.6;
  }

  /* The outlined button: the boundary token, square, 44px; the pinned pair fills its equal cell (Inspector.svelte's grid, change 16b). */
  .outlined {
    box-sizing: border-box;
    block-size: 44px;
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

  .action {
    inline-size: 100%;
  }

  .outlined:hover:not(:disabled) {
    border-color: var(--color-action);
  }

  .outlined:disabled {
    color: var(--color-ink-quiet);
    cursor: default;
  }

  @media (prefers-reduced-motion: reduce) {
    .label,
    .option,
    .word,
    .box {
      transition: none;
    }
  }
</style>
